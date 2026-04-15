import type Database from 'better-sqlite3';

export interface WorkspaceRecord {
  id: string;
  name: string;
  createdAt: string;
}

export interface RepoRecord {
  id: string;
  workspaceId: string;
  provider: 'github';
  owner: string;
  name: string;
  defaultBranch: string;
  installationId?: string;
  setupConfigJson: Record<string, unknown>;
  createdAt: string;
}

export interface WorkspaceRepository {
  createWorkspace(workspace: WorkspaceRecord): Promise<WorkspaceRecord>;
  getWorkspaceById(id: string): Promise<WorkspaceRecord | null>;
  upsertRepo(repo: RepoRecord): Promise<RepoRecord>;
  getRepoByWorkspaceId(workspaceId: string): Promise<RepoRecord | null>;
}

export class InMemoryWorkspaceRepository implements WorkspaceRepository {
  private workspaces = new Map<string, WorkspaceRecord>();
  private repos = new Map<string, RepoRecord>();

  async createWorkspace(workspace: WorkspaceRecord): Promise<WorkspaceRecord> {
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  async getWorkspaceById(id: string): Promise<WorkspaceRecord | null> {
    return this.workspaces.get(id) ?? null;
  }

  async upsertRepo(repo: RepoRecord): Promise<RepoRecord> {
    this.repos.set(repo.workspaceId, repo);
    return repo;
  }

  async getRepoByWorkspaceId(workspaceId: string): Promise<RepoRecord | null> {
    return this.repos.get(workspaceId) ?? null;
  }
}

export class SqliteWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly db: Database.Database) {}

  async createWorkspace(workspace: WorkspaceRecord): Promise<WorkspaceRecord> {
    this.db
      .prepare('insert into workspaces (id, name, created_at) values (?, ?, ?)')
      .run(workspace.id, workspace.name, workspace.createdAt);
    return workspace;
  }

  async getWorkspaceById(id: string): Promise<WorkspaceRecord | null> {
    const row = this.db
      .prepare('select id, name, created_at from workspaces where id = ?')
      .get(id) as { id: string; name: string; created_at: string } | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  async upsertRepo(repo: RepoRecord): Promise<RepoRecord> {
    this.db
      .prepare(
        `insert into repos (
          id, workspace_id, provider, owner, name, default_branch, installation_id, setup_config_json, created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
        on conflict(workspace_id) do update set
          provider = excluded.provider,
          owner = excluded.owner,
          name = excluded.name,
          default_branch = excluded.default_branch,
          installation_id = excluded.installation_id,
          setup_config_json = excluded.setup_config_json`,
      )
      .run(
        repo.id,
        repo.workspaceId,
        repo.provider,
        repo.owner,
        repo.name,
        repo.defaultBranch,
        repo.installationId ?? null,
        JSON.stringify(repo.setupConfigJson),
        repo.createdAt,
      );

    return repo;
  }

  async getRepoByWorkspaceId(workspaceId: string): Promise<RepoRecord | null> {
    const row = this.db
      .prepare(
        `select id, workspace_id, provider, owner, name, default_branch, installation_id, setup_config_json, created_at
         from repos where workspace_id = ?`,
      )
      .get(workspaceId) as
      | {
          id: string;
          workspace_id: string;
          provider: 'github';
          owner: string;
          name: string;
          default_branch: string;
          installation_id: string | null;
          setup_config_json: string;
          created_at: string;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      workspaceId: row.workspace_id,
      provider: row.provider,
      owner: row.owner,
      name: row.name,
      defaultBranch: row.default_branch,
      installationId: row.installation_id ?? undefined,
      setupConfigJson: JSON.parse(row.setup_config_json),
      createdAt: row.created_at,
    };
  }
}
