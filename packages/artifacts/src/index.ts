export interface ArtifactStore {
  save(path: string, contents: string): Promise<string>;
}

export class LocalArtifactStore implements ArtifactStore {
  async save(path: string): Promise<string> {
    return Promise.resolve(path);
  }
}
