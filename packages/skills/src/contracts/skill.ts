export interface SkillContext {
  workspaceId?: string;
  actor: 'system' | 'worker' | 'api';
}

export interface Skill<Input, Output> {
  key: string;
  description: string;
  execute(input: Input, context: SkillContext): Promise<Output>;
}
