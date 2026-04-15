export interface AppConfig {
  apiPort: number;
  webPort: number;
  workerPort: number;
  sqlitePath: string;
  artifactsRoot: string;
  githubProviderMode: 'local' | 'github_app';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    apiPort: Number(env.PORT ?? 4000),
    webPort: Number(env.WEB_PORT ?? 3000),
    workerPort: Number(env.WORKER_PORT ?? 4500),
    sqlitePath: env.SQLITE_PATH ?? './.local/data/bug_agent.sqlite',
    artifactsRoot: env.ARTIFACTS_ROOT ?? './.local/artifacts',
    githubProviderMode: env.GITHUB_PROVIDER_MODE === 'github_app' ? 'github_app' : 'local',
  };
}
