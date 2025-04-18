import * as T from './types';
import { NoPersistence } from './State';
import { Auth } from './Auth';

import fs from 'fs';
import path from 'path';
import got from 'got';
import { FormData, File } from 'formdata-node';

const ENDPOINT = 'https://www.seedr.cc';

export class Seedr {
  auth: Auth;
  constructor(state?: T.IState) {
    this.auth = new Auth(state ?? new NoPersistence());
  }

  protected async callFunc<T>(
    func: string,
    form?: Record<string, unknown>,
    body?: FormData
  ) {
    const token = await this.auth.getAccessToken();
    const response = await got.post<T.Either<T, T.SeedrError>>(
      `${ENDPOINT}/oauth_test/resource.php`,
      {
        searchParams: { func },
        body,
        form,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'json',
        throwHttpErrors: false,
      }
    );
    if (response.statusCode !== 200 || response.body.error)
      throw new Error(
        `Unexpected Response (${response.statusCode}): ${JSON.stringify(
          response.body
        )}`
      );
    return response.body as T;
  }

  addTorrentMagnet(torrent_magnet: string, folder_id?: number) {
    return this.callFunc<T.RAddTorrent>('add_torrent', {
      torrent_magnet,
      folder_id,
    });
  }

  addTorrentURL(torrent_url: string, folder_id?: number) {
    return this.callFunc<T.RAddTorrent>('add_torrent', {
      torrent_url,
      folder_id,
    });
  }

  addTorrentFile(torrent_file: string) {
    const bytes = fs.readFileSync(torrent_file);
    const form = new FormData();
    // form.set('folder_id', folder_id)
    form.set('torrent_file', new File([bytes], path.basename(torrent_file)));
    return this.callFunc<T.RAddTorrent>('add_torrent', undefined, form);
  }

  scanPage(url: string) {
    return this.callFunc<T.RScanResults>('scan_page', { url });
  }

  listFolder(content_type: 'folder', id?: number) {
    const body: Record<string, unknown> = { content_type };
    if (id) body.content_id = id;
    return this.callFunc<T.RFolderDetails>('list_contents', body);
  }

  searchFiles(search_query: string) {
    return this.callFunc<T.RSearchResults>('search_files', { search_query });
  }

  fetchFile(folder_file_id: number) {
    return this.callFunc<T.RFetchFile>('fetch_file', { folder_file_id });
  }

  addFolder(name: string) {
    return this.callFunc<T.SeedrSuccess>('add_folder', { name });
  }

  protected renameItem(options: {
    rename_to: string;
    folder_id?: number;
    file_id?: number;
  }) {
    if (options.folder_id && options.file_id)
      throw new Error('More Arguments supplied than expected');
    return this.callFunc<T.SeedrSuccess>('rename', options);
  }

  protected deleteItems(delete_arr: { type: string; id: number }[]) {
    return this.callFunc<T.SeedrSuccess>('delete', {
      delete_arr: JSON.stringify(delete_arr),
    });
  }

  removeWishlist(id: number) {
    return this.callFunc('remove_wishlist', { id });
  }

  testToken() {
    return this.callFunc<{ result: true }>('test');
  }

  getDevices() {
    return this.callFunc<T.RDevices>('get_devices');
  }

  getAccountInfo() {
    return this.callFunc<T.RAccountSettings>('get_settings');
  }

  getMemoryBandwidth() {
    return this.callFunc<T.RMemoryBandwidth>('get_memory_bandwidth');
  }

  // //DISABLED: Successful result not useful
  // createArchive(ids: {folder?: number[], file?: number[]}) {
  //   const items = [
  //     ...(ids.folder ?? []).map((id) => { return {type: "folder", id}}),
  //     ...(ids.file ?? []).map((id) => { return {type: "file", id}}),
  //   ]
  //   return this.#callFunc<T.RCreateArchive>('create_empty_archive', {
  //     archive_arr: JSON.stringify(items)
  //   })
  // }

  // //DISABLED: Broken
  // changeName(fullname: string, password: string) {
  //   return this.#callFunc<T.RSearchResults>('user_account_modify', {
  //     setting: 'fullname',
  //     fullname,
  //     password,
  //   })
  // }

  // //DISABLED: Returns error on success
  // changePassword(new_password: string, password: string) {
  //   return this.#callFunc<T.RSearchResults>('user_account_modify', {
  //     setting: 'password',
  //     new_password,
  //     new_password_repeat: new_password,
  //     password
  //   })
  // }
}
