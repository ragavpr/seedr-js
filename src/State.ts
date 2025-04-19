import * as T from './types';

import fs from 'fs-extra';

export class NoPersistence implements T.IStore {
  state: T.AuthState;

  constructor(state?: T.AuthState) {
    this.state = state || {};
  }

  save(state: T.AuthState): void {
    return;
  }

  load(): T.AuthState {
    return this.state;
  }
}

export class FilePersistence implements T.IStore {
  path: string;

  constructor(path: string) {
    this.path = path;
  }

  save(state: T.AuthState): void {
    fs.writeJSONSync(this.path, state);
  }

  load(): T.AuthState {
    if (!fs.existsSync(this.path)) {
      fs.ensureFileSync(this.path);
      fs.writeJSONSync(this.path, {});
    }
    return fs.readJSONSync(this.path);
  }
}
