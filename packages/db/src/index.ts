export * from './schema.js';
export * from './repositories/ticket-repository.js';
export * from './repositories/workspace-repository.js';

export interface MigrationFile {
  version: string;
  name: string;
  path: string;
}

export function getMigrationFiles(): MigrationFile[] {
  return [
    {
      version: '0001',
      name: 'phase2_core',
      path: 'packages/db/src/migrations/0001_phase2_core.sql',
    },
  ];
}
