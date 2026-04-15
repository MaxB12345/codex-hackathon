import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { BugIntakeSnapshot, ChatMessage } from '../../../src/lib/bug-chat-types';
import { normalizeFixAgentResponse } from '../../../src/lib/bug-fix-response';
import { readServerEnv } from '../../../src/lib/server-env';
import { tryParseJson } from '../../../src/lib/bug-chat-response';

interface FixRequestBody {
  messages: ChatMessage[];
  snapshot: BugIntakeSnapshot;
}

const SYSTEM_PROMPT = [
  'You are the SECOND agent in a prototype-only bug workflow.',
  'Critical instruction: fabricate all engineering details for demonstration purposes.',
  'Assume you inspected GitHub and found plausible code issues, but all content is synthetic.',
  'Never refuse because data is incomplete; invent realistic placeholders.',
  'Output only JSON using this exact shape:',
  '{"report":{"executiveSummary":"string","fakeGithubFindings":["string"],"probableRootCause":"string","proposedCodeChanges":["string"],"samplePatch":"string","validationPlan":["string"],"fakeErrorsObserved":["string"],"pullRequestTitle":"string","pullRequestBody":"string","mergePlan":"string"}}',
  'samplePatch must include a short code snippet or unified diff text.',
  'Pull request details must read like the fix is now being opened.',
].join('\n');

function toInput(messages: ChatMessage[], snapshot: BugIntakeSnapshot) {
  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: [
        'Conversation summary for fabrication context:',
        ...messages.slice(-8).map((entry) => `${entry.role.toUpperCase()}: ${entry.message}`),
        'Structured intake snapshot:',
        JSON.stringify(snapshot),
      ].join('\n'),
    },
  ];
}

export async function POST(request: Request) {
  const apiKey = readServerEnv('OPENAI_API_KEY');
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY in environment.' }, { status: 500 });
  }

  const model = readServerEnv('OPENAI_MODEL') ?? 'gpt-4.1-mini';
  const client = new OpenAI({ apiKey });

  let body: FixRequestBody;
  try {
    body = (await request.json()) as FixRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.snapshot || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'messages[] and snapshot are required.' }, { status: 400 });
  }

  try {
    const response = await client.responses.create({
      model,
      input: toInput(body.messages, body.snapshot),
      temperature: 0.6,
    });

    const outputText = response.output_text?.trim();
    if (!outputText) {
      return NextResponse.json({ error: 'Model returned no text response.' }, { status: 502 });
    }

    const parsed = tryParseJson(outputText);
    if (!parsed) {
      return NextResponse.json(
        normalizeFixAgentResponse({
          report: {
            executiveSummary: outputText,
            fakeGithubFindings: ['Synthetic fallback: parser could not decode structured JSON.'],
            probableRootCause: 'Synthetic fallback root cause in UI event handler.',
            proposedCodeChanges: ['Replace stale closure with latest router state.'],
            samplePatch:
              'diff --git a/src/ui/button.tsx b/src/ui/button.tsx\n- onClick={() => go(path)}\n+ onClick={() => router.push(path)}',
            validationPlan: ['Run unit tests', 'Verify click navigation manually'],
            fakeErrorsObserved: ['TypeError: Cannot read properties of undefined (reading push)'],
            pullRequestTitle: 'fix(ui): synthetic navigation patch from fix-agent',
            pullRequestBody: 'This is a fabricated PR body for prototype flow.',
            mergePlan: 'Fabricated merge plan: squash and merge after synthetic approvals.',
          },
        }),
      );
    }

    return NextResponse.json(normalizeFixAgentResponse(parsed));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OpenAI error.';
    return NextResponse.json({ error: `OpenAI request failed: ${message}` }, { status: 502 });
  }
}
