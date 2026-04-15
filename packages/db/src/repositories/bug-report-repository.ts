import type Database from 'better-sqlite3';

export interface BugReportRecord {
  id: string;
  workspaceId: string;
  rawText: string;
  structuredJson: unknown;
  reporterIdentifier?: string;
  createdAt: string;
}

export interface AttachmentRecord {
  id: string;
  bugReportId: string;
  fileType: string;
  storageUrl: string;
  createdAt: string;
}

export interface BugReportRepository {
  create(report: BugReportRecord): Promise<BugReportRecord>;
  getById(id: string): Promise<BugReportRecord | null>;
  updateStructuredJson(id: string, structuredJson: unknown): Promise<void>;
  createAttachment(attachment: AttachmentRecord): Promise<AttachmentRecord>;
  listAttachments(bugReportId: string): Promise<AttachmentRecord[]>;
  linkReportToTicket(ticketId: string, bugReportId: string): Promise<void>;
  getLinkedTicketId(bugReportId: string): Promise<string | null>;
}

export class InMemoryBugReportRepository implements BugReportRepository {
  private reports = new Map<string, BugReportRecord>();
  private attachments = new Map<string, AttachmentRecord[]>();
  private ticketLinks = new Map<string, string>();

  async create(report: BugReportRecord): Promise<BugReportRecord> {
    this.reports.set(report.id, report);
    return report;
  }

  async getById(id: string): Promise<BugReportRecord | null> {
    return this.reports.get(id) ?? null;
  }

  async updateStructuredJson(id: string, structuredJson: unknown): Promise<void> {
    const report = this.reports.get(id);
    if (!report) return;
    this.reports.set(id, { ...report, structuredJson });
  }

  async createAttachment(attachment: AttachmentRecord): Promise<AttachmentRecord> {
    const current = this.attachments.get(attachment.bugReportId) ?? [];
    current.push(attachment);
    this.attachments.set(attachment.bugReportId, current);
    return attachment;
  }

  async listAttachments(bugReportId: string): Promise<AttachmentRecord[]> {
    return this.attachments.get(bugReportId) ?? [];
  }

  async linkReportToTicket(ticketId: string, bugReportId: string): Promise<void> {
    this.ticketLinks.set(bugReportId, ticketId);
  }

  async getLinkedTicketId(bugReportId: string): Promise<string | null> {
    return this.ticketLinks.get(bugReportId) ?? null;
  }
}

export class SqliteBugReportRepository implements BugReportRepository {
  constructor(private readonly db: Database.Database) {}

  async create(report: BugReportRecord): Promise<BugReportRecord> {
    this.db
      .prepare(
        `insert into bug_reports (id, workspace_id, raw_text, structured_json, reporter_identifier, created_at)
         values (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        report.id,
        report.workspaceId,
        report.rawText,
        JSON.stringify(report.structuredJson),
        report.reporterIdentifier ?? null,
        report.createdAt,
      );

    return report;
  }

  async getById(id: string): Promise<BugReportRecord | null> {
    const row = this.db
      .prepare(
        `select id, workspace_id, raw_text, structured_json, reporter_identifier, created_at
         from bug_reports
         where id = ?`,
      )
      .get(id) as
      | {
          id: string;
          workspace_id: string;
          raw_text: string;
          structured_json: string;
          reporter_identifier: string | null;
          created_at: string;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      workspaceId: row.workspace_id,
      rawText: row.raw_text,
      structuredJson: JSON.parse(row.structured_json),
      reporterIdentifier: row.reporter_identifier ?? undefined,
      createdAt: row.created_at,
    };
  }

  async updateStructuredJson(id: string, structuredJson: unknown): Promise<void> {
    this.db
      .prepare('update bug_reports set structured_json = ? where id = ?')
      .run(JSON.stringify(structuredJson), id);
  }

  async createAttachment(attachment: AttachmentRecord): Promise<AttachmentRecord> {
    this.db
      .prepare(
        `insert into attachments (id, bug_report_id, file_type, storage_url, created_at)
         values (?, ?, ?, ?, ?)`,
      )
      .run(
        attachment.id,
        attachment.bugReportId,
        attachment.fileType,
        attachment.storageUrl,
        attachment.createdAt,
      );

    return attachment;
  }

  async listAttachments(bugReportId: string): Promise<AttachmentRecord[]> {
    const rows = this.db
      .prepare(
        `select id, bug_report_id, file_type, storage_url, created_at
         from attachments where bug_report_id = ? order by created_at asc`,
      )
      .all(bugReportId) as {
      id: string;
      bug_report_id: string;
      file_type: string;
      storage_url: string;
      created_at: string;
    }[];

    return rows.map((row) => ({
      id: row.id,
      bugReportId: row.bug_report_id,
      fileType: row.file_type,
      storageUrl: row.storage_url,
      createdAt: row.created_at,
    }));
  }

  async linkReportToTicket(ticketId: string, bugReportId: string): Promise<void> {
    this.db
      .prepare('insert into ticket_reports (ticket_id, bug_report_id, created_at) values (?, ?, CURRENT_TIMESTAMP)')
      .run(ticketId, bugReportId);
  }

  async getLinkedTicketId(bugReportId: string): Promise<string | null> {
    const row = this.db
      .prepare('select ticket_id from ticket_reports where bug_report_id = ? order by created_at asc limit 1')
      .get(bugReportId) as { ticket_id: string } | undefined;

    return row?.ticket_id ?? null;
  }
}
