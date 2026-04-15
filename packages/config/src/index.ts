export interface AppConfig {
  apiPort: number;
  webPort: number;
  workerPort: number;
  databaseUrl: string;
  redisUrl: string;
  artifactsRoot: string;
  githubProviderMode: 'local' | 'github_app';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    apiPort: Number(env.PORT ?? 4000),
    webPort: Number(env.WEB_PORT ?? 3000),
    workerPort: Number(env.WORKER_PORT ?? 4500),
    databaseUrl: env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/bug_agent',
    redisUrl: env.REDIS_URL ?? 'redis://localhost:6379',
    artifactsRoot: env.ARTIFACTS_ROOT ?? './.local/artifacts',
    githubProviderMode: env.GITHUB_PROVIDER_MODE === 'github_app' ? 'github_app' : 'local',
  };
}
