import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { BUG_REPORT_SKILL } from '../../../src/lib/bug-report-skill';
import type { ChatMessage } from '../../../src/lib/bug-chat-types';
import { normalizeBugChatResponse, tryParseJson } from '../../../src/lib/bug-chat-response';

interface ChatRequestBody {
  messages: ChatMessage[];
}

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

const SYSTEM_PROMPT = [
  'You are a bug intake agent for a web application.',
  'Use the following skill as your source of truth when collecting details:',
  BUG_REPORT_SKILL,
  'Rules:',
  '- Keep responses concise and ask one clear follow-up question at a time.',
  '- Prioritize missing fields from the skill checklist.',
  '- Never invent user details; keep unknown fields explicit.',
  '- Always respond as strict JSON with this exact shape and no markdown:',
  '{"reply":"string","snapshot":{"title":"string","description":"string","stepsToReproduce":["string"],"expectedBehavior":"string","actualBehavior":"string","device":"string","operatingSystem":"string","browser":"string","browserVersion":"string","evidence":"string","frequency":"string","additionalNotes":"string","completeness":0.0,"missingFields":["string"]}}',
  '- completeness must be between 0 and 1.',
].join('\n');

function toOpenAIInput(messages: ChatMessage[]) {
  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...messages.map((entry) => ({
      role: entry.role === 'agent' ? ('assistant' as const) : ('user' as const),
      content: entry.message,
    })),
  ];
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY in environment.' }, { status: 500 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: 'messages[] is required.' }, { status: 400 });
  }

  try {
    const response = await client.responses.create({
      model: MODEL,
      input: toOpenAIInput(messages),
      temperature: 0.2,
    });

    const outputText = response.output_text?.trim();
    if (!outputText) {
      return NextResponse.json({ error: 'Model returned no text response.' }, { status: 502 });
    }

    const parsed = tryParseJson(outputText);
    if (!parsed) {
      return NextResponse.json(
        normalizeBugChatResponse({
          reply: outputText,
          snapshot: {
            missingFields: ['title', 'description', 'stepsToReproduce', 'expectedBehavior', 'actualBehavior'],
          },
        }),
      );
    }

    return NextResponse.json(normalizeBugChatResponse(parsed));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OpenAI error.';
    return NextResponse.json({ error: `OpenAI request failed: ${message}` }, { status: 502 });
  }
}
