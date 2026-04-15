import { mkdir, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { AuditLogService, SqliteAuditLogRepository } from '@bug-agent/audit';
import { loadConfig } from '@bug-agent/config';
import { SqliteBugReportRepository, SqliteTicketRepository, SqliteWorkspaceRepository, getSqliteDatabase } from '@bug-agent/db';
import { createBootstrapSummary, TicketStateMachine } from '@bug-agent/orchestrator';
import { computePriorityScore, findDuplicateTicket } from '@bug-agent/skills';
import type { TicketRecord } from '@bug-agent/shared';

interface CreateBugReportBody {
  workspaceId?: string;
  message: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  stepsTried?: string[];
  environment?: Record<string, unknown>;
  reporterIdentifier?: string;
}

interface FollowUpMessageBody {
  message?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  reproSteps?: string[];
  environment?: Record<string, unknown>;
}

interface AttachmentUploadBody {
  filename: string;
  mimeType: string;
  contentBase64: string;
}

interface IntakeStructured {
  title: string;
  summary: string;
  expectedBehavior: string;
  actualBehavior: string;
  reproSteps: string[];
  environment: Record<string, unknown>;
  chat: { role: 'user' | 'agent'; message: string; createdAt: string }[];
  attachments: { id: string; fileType: string; storageUrl: string }[];
  dedupe?: {
    duplicateOfTicketId: string | null;
    confidenceScore: number;
    rationale: string;
  };
  completenessScore: number;
}

const config = loadConfig();
const db = getSqliteDatabase({ filePath: config.sqlitePath });
const bugReportRepository = new SqliteBugReportRepository(db);
const ticketRepository = new SqliteTicketRepository(db);
const workspaceRepository = new SqliteWorkspaceRepository(db);
const auditLogService = new AuditLogService(new SqliteAuditLogRepository(db));
const ticketStateMachine = new TicketStateMachine(ticketRepository, auditLogService);

void ensureDefaultWorkspace();

async function ensureDefaultWorkspace(): Promise<void> {
  const now = new Date().toISOString();
  db.prepare('insert or ignore into workspaces (id, name, created_at) values (?, ?, ?)').run('ws_local', 'Local Workspace', now);
}

function jsonResponse(res: http.ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(JSON.stringify(data));
}

async function parseJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {} as T;
  }
  return JSON.parse(raw) as T;
}

function makeTicketTitle(message: string): string {
  const normalized = message.replace(/\s+/g, ' ').trim();
  return normalized.slice(0, 90) || 'Untitled bug report';
}

function evaluateCompleteness(structured: IntakeStructured): number {
  let score = 0;
  if (structured.summary.trim().length > 10) score += 0.2;
  if (structured.expectedBehavior.trim().length > 6) score += 0.2;
  if (structured.actualBehavior.trim().length > 6) score += 0.2;
  if (structured.reproSteps.length > 0) score += 0.2;
  if (Object.keys(structured.environment).length > 0) score += 0.1;
  if (structured.attachments.length > 0) score += 0.1;
  return Math.min(1, score);
}

function nextFollowUpQuestion(structured: IntakeStructured): string | null {
  if (!structured.expectedBehavior.trim()) {
    return 'What did you expect to happen?';
  }
  if (!structured.actualBehavior.trim()) {
    return 'What happened instead?';
  }
  if (structured.reproSteps.length === 0) {
    return 'Can you share the steps you took right before the issue happened?';
  }
  return null;
}

function toStructuredDraft(body: CreateBugReportBody): IntakeStructured {
  const now = new Date().toISOString();
  const structured: IntakeStructured = {
    title: makeTicketTitle(body.message),
    summary: body.message.trim(),
    expectedBehavior: body.expectedBehavior?.trim() ?? '',
    actualBehavior: body.actualBehavior?.trim() ?? '',
    reproSteps: body.stepsTried ?? [],
    environment: body.environment ?? {},
    chat: [{ role: 'user', message: body.message.trim(), createdAt: now }],
    attachments: [],
    completenessScore: 0,
  };
  structured.completenessScore = evaluateCompleteness(structured);
  return structured;
}

function mergeFollowUp(structured: IntakeStructured, body: FollowUpMessageBody): IntakeStructured {
  const next: IntakeStructured = {
    ...structured,
    expectedBehavior: body.expectedBehavior?.trim() || structured.expectedBehavior,
    actualBehavior: body.actualBehavior?.trim() || structured.actualBehavior,
    reproSteps: body.reproSteps && body.reproSteps.length > 0 ? body.reproSteps : structured.reproSteps,
    environment: body.environment ? { ...structured.environment, ...body.environment } : structured.environment,
    chat: [...structured.chat],
    attachments: [...structured.attachments],
    completenessScore: structured.completenessScore,
  };

  if (body.message?.trim()) {
    next.chat.push({
      role: 'user',
      message: body.message.trim(),
      createdAt: new Date().toISOString(),
    });
  }

  next.completenessScore = evaluateCompleteness(next);
  return next;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toIntakeStructured(value: unknown): IntakeStructured {
  if (!isObject(value)) {
    return {
      title: 'Untitled bug report',
      summary: '',
      expectedBehavior: '',
      actualBehavior: '',
      reproSteps: [],
      environment: {},
      chat: [],
      attachments: [],
      dedupe: {
        duplicateOfTicketId: null,
        confidenceScore: 0,
        rationale: '',
      },
      completenessScore: 0,
    };
  }

  const title = typeof value.title === 'string' ? value.title : 'Untitled bug report';
  const summary = typeof value.summary === 'string' ? value.summary : '';
  const expectedBehavior = typeof value.expectedBehavior === 'string' ? value.expectedBehavior : '';
  const actualBehavior = typeof value.actualBehavior === 'string' ? value.actualBehavior : '';
  const reproSteps = Array.isArray(value.reproSteps)
    ? value.reproSteps.filter((step): step is string => typeof step === 'string')
    : [];
  const environment = isObject(value.environment) ? value.environment : {};
  const chat = Array.isArray(value.chat)
    ? value.chat.filter(
        (entry): entry is { role: 'user' | 'agent'; message: string; createdAt: string } =>
          isObject(entry) &&
          (entry.role === 'user' || entry.role === 'agent') &&
          typeof entry.message === 'string' &&
          typeof entry.createdAt === 'string',
      )
    : [];
  const attachments = Array.isArray(value.attachments)
    ? value.attachments.filter(
        (entry): entry is { id: string; fileType: string; storageUrl: string } =>
          isObject(entry) &&
          typeof entry.id === 'string' &&
          typeof entry.fileType === 'string' &&
          typeof entry.storageUrl === 'string',
      )
    : [];
  const dedupe = isObject(value.dedupe)
    ? {
        duplicateOfTicketId:
          typeof value.dedupe.duplicateOfTicketId === 'string' ? value.dedupe.duplicateOfTicketId : null,
        confidenceScore:
          typeof value.dedupe.confidenceScore === 'number' ? value.dedupe.confidenceScore : 0,
        rationale: typeof value.dedupe.rationale === 'string' ? value.dedupe.rationale : '',
      }
    : {
        duplicateOfTicketId: null,
        confidenceScore: 0,
        rationale: '',
      };

  const structured: IntakeStructured = {
    title,
    summary,
    expectedBehavior,
    actualBehavior,
    reproSteps,
    environment,
    chat,
    attachments,
    dedupe,
    completenessScore: 0,
  };
  structured.completenessScore = evaluateCompleteness(structured);
  return structured;
}

function buildTicketFromStructured(ticketId: string, workspaceId: string, structured: IntakeStructured): TicketRecord {
  const now = new Date().toISOString();
  return {
    id: ticketId,
    workspaceId,
    title: structured.title,
    summary: structured.summary,
    status: 'NEW_REPORT',
    severity: 2,
    priorityScore: 2 + Math.log(2),
    reportCount: 1,
    createdAt: now,
    updatedAt: now,
  };
}

interface FinalizeStructuredResult {
  ticketId: string;
  ticketStatus: TicketRecord['status'];
  duplicateOfTicketId: string | null;
  dedupeConfidence: number;
  dedupeRationale: string;
}

async function finalizeStructuredReport(
  bugReportId: string,
  initialTicketId: string,
  structured: IntakeStructured,
): Promise<FinalizeStructuredResult> {
  let ticket = await ticketRepository.getById(initialTicketId);
  if (!ticket) {
    throw new Error('linked ticket not found');
  }

  if (ticket.status === 'NEW_REPORT') {
    ticket = await ticketStateMachine.transition({
      ticketId: ticket.id,
      to: 'STRUCTURED',
      actorType: 'api',
      reasonCode: 'intake.completed',
      summary: 'Structured intake completed and dedupe evaluation started.',
    });
  }

  const candidates = await ticketRepository.listOpenByWorkspace(ticket.workspaceId, ticket.id);
  const dedupe = findDuplicateTicket({
    sourceTitle: structured.title,
    sourceSummary: structured.summary,
    sourceReproSteps: structured.reproSteps,
    candidateTickets: candidates.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      summary: candidate.summary,
    })),
  });

  structured.dedupe = {
    duplicateOfTicketId: dedupe.duplicateOfTicketId,
    confidenceScore: dedupe.confidenceScore,
    rationale: dedupe.rationale,
  };
  await bugReportRepository.updateStructuredJson(bugReportId, structured);

  if (ticket.status === 'STRUCTURED') {
    ticket = await ticketStateMachine.transition({
      ticketId: ticket.id,
      to: 'DEDUPED',
      actorType: 'api',
      reasonCode: dedupe.duplicateOfTicketId ? 'dedupe.duplicate_found' : 'dedupe.no_match',
      summary: dedupe.duplicateOfTicketId
        ? `Bug report merged into canonical ticket ${dedupe.duplicateOfTicketId}.`
        : 'No duplicate match found for structured ticket.',
    });
  }

  if (dedupe.duplicateOfTicketId) {
    const canonical = await ticketRepository.getById(dedupe.duplicateOfTicketId);
    if (!canonical) {
      throw new Error('canonical duplicate ticket not found');
    }

    await bugReportRepository.linkReportToTicket(canonical.id, bugReportId);
    const updatedCanonical: TicketRecord = {
      ...canonical,
      reportCount: canonical.reportCount + 1,
      priorityScore: await computePriorityScore({
        severity: canonical.severity,
        reportCount: canonical.reportCount + 1,
        createdAtIso: canonical.createdAt,
      }),
      updatedAt: new Date().toISOString(),
    };
    await ticketRepository.update(updatedCanonical);

    return {
      ticketId: canonical.id,
      ticketStatus: ticket.status,
      duplicateOfTicketId: canonical.id,
      dedupeConfidence: dedupe.confidenceScore,
      dedupeRationale: dedupe.rationale,
    };
  }

  const reprioritized: TicketRecord = {
    ...ticket,
    priorityScore: await computePriorityScore({
      severity: ticket.severity,
      reportCount: ticket.reportCount,
      createdAtIso: ticket.createdAt,
    }),
    updatedAt: new Date().toISOString(),
  };
  await ticketRepository.update(reprioritized);

  return {
    ticketId: reprioritized.id,
    ticketStatus: reprioritized.status,
    duplicateOfTicketId: null,
    dedupeConfidence: dedupe.confidenceScore,
    dedupeRationale: dedupe.rationale,
  };
}

export function createApiServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        jsonResponse(res, 200, { ok: true });
        return;
      }

      const url = new URL(req.url ?? '/', 'http://localhost');
      const pathname = url.pathname;

      if (req.method === 'GET' && pathname === '/health') {
        jsonResponse(res, 200, { status: 'ok' });
        return;
      }

      if (req.method === 'GET' && pathname === '/bootstrap') {
        jsonResponse(res, 200, createBootstrapSummary());
        return;
      }

      if (req.method === 'POST' && pathname === '/api/bug-reports') {
        const body = await parseJsonBody<CreateBugReportBody>(req);
        if (!body.message?.trim()) {
          jsonResponse(res, 400, { error: 'message is required' });
          return;
        }

        const workspaceId = body.workspaceId ?? 'ws_local';
        const workspace = await workspaceRepository.getWorkspaceById(workspaceId);
        if (!workspace) {
          await workspaceRepository.createWorkspace({
            id: workspaceId,
            name: 'Workspace',
            createdAt: new Date().toISOString(),
          });
        }

        const bugReportId = `br_${randomUUID()}`;
        const ticketId = `ticket_${randomUUID()}`;

        const structured = toStructuredDraft(body);

        await bugReportRepository.create({
          id: bugReportId,
          workspaceId,
          rawText: body.message,
          structuredJson: structured,
          reporterIdentifier: body.reporterIdentifier,
          createdAt: new Date().toISOString(),
        });

        const ticket = buildTicketFromStructured(ticketId, workspaceId, structured);
        await ticketRepository.create(ticket);
        await bugReportRepository.linkReportToTicket(ticketId, bugReportId);

        let status = ticket.status;
        let responseTicketId = ticketId;
        let duplicateOfTicketId: string | null = null;
        let dedupeConfidence = 0;
        let dedupeRationale = '';
        const followUpQuestion = nextFollowUpQuestion(structured);
        if (!followUpQuestion) {
          const finalized = await finalizeStructuredReport(bugReportId, ticketId, structured);
          status = finalized.ticketStatus;
          responseTicketId = finalized.ticketId;
          duplicateOfTicketId = finalized.duplicateOfTicketId;
          dedupeConfidence = finalized.dedupeConfidence;
          dedupeRationale = finalized.dedupeRationale;
        }

        jsonResponse(res, 201, {
          bugReportId,
          ticketId: responseTicketId,
          status,
          nextAction: followUpQuestion ? 'awaiting_followup' : 'structured',
          followUpQuestion,
          completenessScore: structured.completenessScore,
          duplicateOfTicketId,
          dedupeConfidence,
          dedupeRationale,
        });
        return;
      }

      const attachmentMatch = pathname.match(/^\/api\/bug-reports\/([^/]+)\/attachments$/);
      if (req.method === 'POST' && attachmentMatch) {
        const bugReportId = attachmentMatch[1] as string;
        const report = await bugReportRepository.getById(bugReportId);
        if (!report) {
          jsonResponse(res, 404, { error: 'bug report not found' });
          return;
        }

        const body = await parseJsonBody<AttachmentUploadBody>(req);
        if (!body.filename || !body.contentBase64 || !body.mimeType) {
          jsonResponse(res, 400, { error: 'filename, mimeType, and contentBase64 are required' });
          return;
        }

        const attachmentId = `att_${randomUUID()}`;
        const safeName = body.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const relPath = path.join('reports', bugReportId, `${attachmentId}_${safeName}`);
        const fullPath = path.join(config.artifactsRoot, relPath);
        await mkdir(path.dirname(fullPath), { recursive: true });
        await writeFile(fullPath, Buffer.from(body.contentBase64, 'base64'));

        const attachment = await bugReportRepository.createAttachment({
          id: attachmentId,
          bugReportId,
          fileType: body.mimeType,
          storageUrl: fullPath,
          createdAt: new Date().toISOString(),
        });

        const structured = toIntakeStructured(report.structuredJson);
        const nextStructured: IntakeStructured = {
          ...structured,
          attachments: [
            ...(structured.attachments ?? []),
            {
              id: attachment.id,
              fileType: attachment.fileType,
              storageUrl: attachment.storageUrl,
            },
          ],
          completenessScore: 0,
        };
        nextStructured.completenessScore = evaluateCompleteness(nextStructured);
        await bugReportRepository.updateStructuredJson(report.id, nextStructured);

        jsonResponse(res, 201, attachment);
        return;
      }

      const messageMatch = pathname.match(/^\/api\/bug-reports\/([^/]+)\/messages$/);
      if (req.method === 'POST' && messageMatch) {
        const bugReportId = messageMatch[1] as string;
        const report = await bugReportRepository.getById(bugReportId);
        if (!report) {
          jsonResponse(res, 404, { error: 'bug report not found' });
          return;
        }

        const ticketId = await bugReportRepository.getLinkedTicketId(bugReportId);
        if (!ticketId) {
          jsonResponse(res, 500, { error: 'linked ticket not found' });
          return;
        }

        const ticket = await ticketRepository.getById(ticketId);
        if (!ticket) {
          jsonResponse(res, 500, { error: 'ticket not found' });
          return;
        }

        const body = await parseJsonBody<FollowUpMessageBody>(req);
        const structured = mergeFollowUp(toIntakeStructured(report.structuredJson), body);
        await bugReportRepository.updateStructuredJson(report.id, structured);

        const followUpQuestion = nextFollowUpQuestion(structured);
        let status = ticket.status;
        let responseTicketId = ticket.id;
        let duplicateOfTicketId: string | null = null;
        let dedupeConfidence = 0;
        let dedupeRationale = '';

        if (!followUpQuestion && ticket.status === 'NEW_REPORT') {
          const finalized = await finalizeStructuredReport(bugReportId, ticketId, structured);
          status = finalized.ticketStatus;
          responseTicketId = finalized.ticketId;
          duplicateOfTicketId = finalized.duplicateOfTicketId;
          dedupeConfidence = finalized.dedupeConfidence;
          dedupeRationale = finalized.dedupeRationale;
        }

        jsonResponse(res, 200, {
          bugReportId,
          ticketId: responseTicketId,
          status,
          structured: status === 'DEDUPED' || status === 'STRUCTURED',
          followUpQuestion,
          completenessScore: structured.completenessScore,
          nextAction: followUpQuestion ? 'awaiting_followup' : 'structured',
          duplicateOfTicketId,
          dedupeConfidence,
          dedupeRationale,
        });
        return;
      }

      const statusMatch = pathname.match(/^\/api\/bug-reports\/([^/]+)\/status$/);
      if (req.method === 'GET' && statusMatch) {
        const bugReportId = statusMatch[1] as string;
        const report = await bugReportRepository.getById(bugReportId);
        if (!report) {
          jsonResponse(res, 404, { error: 'bug report not found' });
          return;
        }

        const ticketId = await bugReportRepository.getLinkedTicketId(bugReportId);
        const ticket = ticketId ? await ticketRepository.getById(ticketId) : null;
        const attachments = await bugReportRepository.listAttachments(bugReportId);

        jsonResponse(res, 200, {
          bugReportId,
          ticketId,
          ticketStatus: ticket?.status ?? null,
          createdAt: report.createdAt,
          rawText: report.rawText,
          structured: report.structuredJson,
          attachments,
        });
        return;
      }

      jsonResponse(res, 404, { error: 'not found' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error';
      jsonResponse(res, 500, { error: message });
    }
  });
}
