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
