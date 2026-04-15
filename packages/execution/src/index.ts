export interface ExecutionRunner {
  name: string;
  run(command: string): Promise<{ exitCode: number; stdout: string; stderr: string }>;
}

export class LocalExecutionRunner implements ExecutionRunner {
  name = 'local-execution-runner';

  async run(command: string) {
    return {
      exitCode: 0,
      stdout: `placeholder execution for: ${command}`,
      stderr: '',
    };
  }
}
