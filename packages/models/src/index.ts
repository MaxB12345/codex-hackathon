export interface ModelProvider {
  runStructuredPrompt<T>(input: {
    prompt: string;
    schema: string;
    context: Record<string, unknown>;
  }): Promise<T>;
}

export class PlaceholderModelProvider implements ModelProvider {
  async runStructuredPrompt<T>(): Promise<T> {
    throw new Error('Model provider not implemented yet. Wire OpenAI backend execution in a later phase.');
  }
}
