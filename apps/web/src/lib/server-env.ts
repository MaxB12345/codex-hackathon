import fs from 'node:fs';
import path from 'node:path';

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env: Record<string, string> = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    const raw = trimmed.slice(eqIndex + 1).trim();
    const value = raw.replace(/^['\"]|['\"]$/g, '');
    env[key] = value;
  }

  return env;
}

function candidateDirectories(): string[] {
  const roots = [process.cwd()];
  const candidates = new Set<string>();

  for (const root of roots) {
    let current = root;
    for (let i = 0; i < 7; i += 1) {
      candidates.add(current);
      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }
  }

  return Array.from(candidates);
}

export function readServerEnv(key: string): string | undefined {
  const direct = process.env[key];
  if (direct && direct.trim().length > 0) {
    return direct;
  }

  for (const dir of candidateDirectories()) {
    for (const file of ['.env.local', '.env']) {
      const filePath = path.join(dir, file);
      const parsed = parseEnvFile(filePath);
      const value = parsed[key];
      if (value && value.trim().length > 0) {
        return value;
      }
    }
  }

  return undefined;
}
