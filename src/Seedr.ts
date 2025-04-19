import * as T from './types';
import { NoPersistence } from './State';
import { Auth } from './Auth';

import fs from 'fs';
import path from 'path';
import got from 'got';
import { FormData, File } from 'formdata-node';

const ENDPOINT = 'https://www.seedr.cc';

/**
 * Provides methods for interacting with the Seedr API.
 */
export class Seedr {
  auth: Auth;

  /**
   * Creates an instance of `Seedr`.
   * @param {T.IStore} [store] - (optional) Auth State persistence handler. Defaults to `NoPersistence`.
   */
  constructor(store?: T.IStore) {
    this.auth = new Auth(store ?? new NoPersistence());
  }

  /**
   * Internal method to make authenticated calls to the Seedr Resource API.
   * @protected
   * @template T The expected successful response type.
   * @param {string} func - Seedr API function name.
   * @param {Record<string, unknown>} [form] - (optional) Arguments sent in form.
   * @param {FormData} [body] - (optional) Arguments sent in body.
   * @returns {Promise<T>} Promise resolving the response JSON.
   * @throws {Error} If the API returns a non-200 status code or an error key in the response object.
   */
  protected async callFunc<T>(
    func: string,
    form?: Record<string, unknown>,
    body?: FormData
  ): Promise<T> {
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
    return response.body;
  }

  /**
   * Adds a torrent using a magnet link.
   * @param {string} torrent_magnet - The magnet URI.
   * @param {number} [folder_id] - (optional) ID of the folder to download the torrent into (defaults to root).
   * @returns {Promise<T.RAddTorrent>} Promise resolves if the torrent is added / saved in wishlist.
   */
  addTorrentMagnet(
    torrent_magnet: string,
    folder_id?: number
  ): Promise<T.RAddTorrent> {
    return this.callFunc<T.RAddTorrent>('add_torrent', {
      torrent_magnet,
      folder_id,
    });
  }

  /**
   * Adds a torrent using a URL pointing to a .torrent file.
   * @param {string} torrent_url - The URL of the .torrent file.
   * @param {number} [folder_id] - Optional ID of the folder to download the torrent into (defaults to root).
   * @returns {Promise<T.RAddTorrent>} Promise resolves if the torrent is added / saved in wishlist.
   */
  addTorrentURL(
    torrent_url: string,
    folder_id?: number
  ): Promise<T.RAddTorrent> {
    return this.callFunc<T.RAddTorrent>('add_torrent', {
      torrent_url,
      folder_id,
    });
  }

  /**
   * Adds a torrent by uploading a .torrent file.
   * @param {string} torrent_file - The local path to the .torrent file.
   * @returns {Promise<T.RAddTorrent>} Promise resolves if the torrent is added / saved in wishlist.
   */
  addTorrentFile(torrent_file: string): Promise<T.RAddTorrent> {
    const bytes = fs.readFileSync(torrent_file);
    const form = new FormData();
    // form.set('folder_id', folder_id)
    form.set('torrent_file', new File([bytes], path.basename(torrent_file)));
    return this.callFunc<T.RAddTorrent>('add_torrent', undefined, form);
  }

  /**
   * Adds a torrent from an existing wishlist item.
   * @param {number} wishlist_id - The Wishlist item ID.
   * @param {number} [folder_id] - Optional ID of the folder to download the torrent into (defaults to root).
   * @returns {Promise<T.RAddTorrent>} Promise resolves if the torrent is added / saved in wishlist.
   */
  addTorrentFromWishlist(
    wishlist_id: number,
    folder_id?: number
  ): Promise<T.RAddTorrent> {
    return this.callFunc<T.RAddTorrent>('add_torrent', {
      wishlist_id,
      folder_id,
    });
  }

  /**
   * Scans a webpage for magnet links or .torrent file links.
   * @param {string} url - The URL of the page to scan.
   * @returns {Promise<T.RScanResults>} Promise resolving the scan results.
   */
  scanPage(url: string): Promise<T.RScanResults> {
    return this.callFunc<T.RScanResults>('scan_page', { url });
  }

  /**
   * Lists the contents of a folder or the active torrents.
   * @param {'folder' | 'torrent'} [content_type='folder'] - Type of content to list ('folder' or 'torrent'). Defaults to 'folder'.
   * @param {number} [id] - The ID of the item to list. If `content_type` is 'folder' and `id` is omitted, lists the root folder. If `content_type` is 'torrent', lists the items under torrent.
   * @returns {Promise<T.RFolderDetails>} Promise resolving the sub-items.
   */
  list(
    content_type: 'folder' | 'torrent' = 'folder',
    id?: number
  ): Promise<T.RFolderDetails> {
    const body: Record<string, unknown> = { content_type };
    if (id) body.content_id = id;
    return this.callFunc<T.RFolderDetails>('list_contents', body);
  }

  /**
   * Searches for files within the user's Seedr account.
   * @param {string} search_query - The search term.
   * @returns {Promise<T.RSearchResults>} Promise resolving the search results.
   */
  searchFiles(search_query: string): Promise<T.RSearchResults> {
    return this.callFunc<T.RSearchResults>('search_files', { search_query });
  }

  /**
   * Fetches the direct download URL for a file.
   * @param {number} folder_file_id - The ID of the file (note: this is `folder_file_id` from the `list` results, not `file_id`).
   * @returns {Promise<T.RFetchFile>} Promise resolving the file details including the download URL.
   */
  fetchFile(folder_file_id: number): Promise<T.RFetchFile> {
    return this.callFunc<T.RFetchFile>('fetch_file', { folder_file_id });
  }

  /**
   * Creates a new empty folder in the root directory.
   * @param {string} name - The name for the new folder.
   * @returns {Promise<T.SeedrSuccess>} Promise resolving if successful.
   */
  addFolder(name: string): Promise<T.SeedrSuccess> {
    return this.callFunc<T.SeedrSuccess>('add_folder', { name });
  }

  /**
   * Renames a folder or a file.
   * Only one of `folder_id` or `file_id` should be provided.
   * @protected
   * @param {object} options - The rename options.
   * @param {string} options.rename_to - The new name for the item.
   * @param {number} [options.folder_id - The ID of the folder to rename.
   * @param {number} [options.file_id] - The ID of the file to rename (use `folder_file_id`).
   * @returns {Promise<T.SeedrSuccess>} Promise resolving if successful.
   * @throws {Error} Throws an error if both `folder_id` and `file_id` are provided.
   */
  protected renameItem(options: {
    rename_to: string;
    folder_id?: number;
    file_id?: number;
  }): Promise<T.SeedrSuccess> {
    if (options.folder_id && options.file_id)
      throw new Error('More Arguments supplied than expected');
    return this.callFunc<T.SeedrSuccess>('rename', options);
  }

  /**
   * Deletes multiple items (folders or files).
   * @protected
   * @param {Array<{type: 'folder' | 'file' | 'torrent', id: number}>} delete_arr - An array of objects specifying the type and ID of items to delete. For files, use `folder_file_id`.
   * @returns {Promise<T.SeedrSuccess>} Promise resolving if successful.
   */
  protected deleteItems(
    delete_arr: { type: string; id: number }[]
  ): Promise<T.SeedrSuccess> {
    return this.callFunc<T.SeedrSuccess>('delete', {
      delete_arr: JSON.stringify(delete_arr),
    });
  }

  /**
   * Removes an item from the user's wishlist.
   * @param {number} id - The ID of the wishlist item to remove.
   * @returns {Promise<{ result: true }>} Promise resolving if successful.
   */
  deleteWishlistItem(id: number): Promise<{ result: true }> {
    return this.callFunc<{ result: true }>('remove_wishlist', { id });
  }

  /**
   * Tests the validity of the current access token.
   * @returns {Promise<{ result: true }>} Promise resolving if successful.
   */
  testToken(): Promise<{ result: true }> {
    return this.callFunc<{ result: true }>('test');
  }

  /**
   * Gets a list of devices authorized with the user's account.
   * @returns {Promise<T.RDevices>} Promise resolving the list of devices.
   */
  getDevices(): Promise<T.RDevices> {
    return this.callFunc<T.RDevices>('get_devices');
  }

  /**
   * Gets the user's account settings and details.
   * @returns {Promise<T.RAccountSettings>} Promise resolving the account settings and info.
   */
  getAccountInfo(): Promise<T.RAccountSettings> {
    return this.callFunc<T.RAccountSettings>('get_settings');
  }

  /**
   * Gets the user's current storage space and bandwidth usage stats.
   * @returns {Promise<T.RMemoryBandwidth>} Promise resolving the storage and bandwidth details.
   */
  getUsage(): Promise<T.RMemoryBandwidth> {
    return this.callFunc<T.RMemoryBandwidth>('get_memory_bandwidth');
  }

  // // DISABLED: The Returned URL is invalid.
  // /**
  //  * Creates an archive (zip file) of specified folders and files.
  //  * Note: The Returned URL is invalid.
  //  * @param {object} ids - Object containing arrays of folder and file IDs.
  //  * @param {number[]} [ids.folder] - Array of folder IDs to include.
  //  * @param {number[]} [ids.file] - Array of file IDs (`folder_file_id`) to include.
  //  * @returns {Promise<T.RCreateArchive>} Promise resolving the archive ID and download URL.
  //  */
  // createArchive(ids: { folder?: number[]; file?: number[] }): Promise<T.RCreateArchive> {
  //   const items = [
  //     ...(ids.folder ?? []).map((id) => {
  //       return { type: 'folder', id };
  //     }),
  //     ...(ids.file ?? []).map((id) => {
  //       return { type: 'file', id };
  //     }),
  //   ];
  //   return this.callFunc<T.RCreateArchive>('create_empty_archive', {
  //     archive_arr: JSON.stringify(items),
  //   });
  // }

  // // DISABLED: Always returns failure
  // /**
  //  * Changes the user's full name. Requires current password.
  //  * @param {string} fullname - The new full name.
  //  * @param {string} password - The user's current password.
  //  * @returns {Promise<unknown>} Promise resolving if successful (API response type might be incorrect).
  //  */
  // changeName(fullname: string, password: string): Promise<unknown> {
  //   return this.callFunc('user_account_modify', {
  //     setting: 'fullname',
  //     fullname,
  //     password,
  //   });
  // }

  // // DISABLED: Returns error on success
  // /**
  //  * Changes the user's password.
  //  * Note: Works, but returns HTTP 500 Status.
  //  * @param {string} new_password - The new password.
  //  * @param {string} password - The user's current password.
  //  * @returns {Promise<T.RSearchResults>} Promise resolving if successful.
  //  */
  // changePassword(new_password: string, password: string): Promise<T.RSearchResults> {
  //   return this.callFunc<T.RSearchResults>('user_account_modify', {
  //     setting: 'password',
  //     new_password,
  //     new_password_repeat: new_password,
  //     password,
  //   });
  // }
}
