export interface GitProvider {
  mode: 'local' | 'github_app';
  connect(): Promise<void>;
}

export class LocalGitProvider implements GitProvider {
  mode: 'local' = 'local';

  async connect(): Promise<void> {
    return Promise.resolve();
  }
}
