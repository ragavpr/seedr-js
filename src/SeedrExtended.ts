import * as T from './types';
import { Seedr as SeedrVanilla } from './Seedr';

/**
 * Provides methods for interacting with the Seedr API.
 * Extends the base Seedr class, providing additional convenience methods.
 * @extends {SeedrVanilla}
 */
export class Seedr extends SeedrVanilla {
  /**
   * Adds a torrent using a magnet link, torrent URL, torrent file, or wishlist item ID.
   * Note: `folder_id` is ignored when uploading a `torrent_file`.
   * @param {object} options - The options for adding the torrent.
   * @param {number} [options.folder_id] - The ID of the folder to download the torrent into (defaults to root). Ignored if `torrent_file` is used.
   * @param {number} [options.wishlist_id] - The ID of a wishlist item to add.
   * @param {string} [options.torrent_magnet] - The magnet URI.
   * @param {string} [options.torrent_file] - The local path to the .torrent file to upload.
   * @param {string} [options.torrent_url] - The URL pointing to a .torrent file.
   * @returns {Promise<T.RAddTorrent>} Promise resolving with the result of the add operation.
   * @throws {Error} If not exactly one of `torrent_magnet`, `torrent_file`, `torrent_url`, or `wishlist_id` is defined.
   */
  addTorrent(options: {
    folder_id?: number;
    wishlist_id?: number;
    torrent_magnet?: string;
    torrent_file?: string;
    torrent_url?: string;
  }): Promise<T.RAddTorrent> {
    const definedOptions = [
      options.wishlist_id,
      options.torrent_magnet,
      options.torrent_file,
      options.torrent_url,
    ].filter((option) => option !== undefined);

    if (definedOptions.length !== 1) {
      throw new Error(
        'Exactly one of torrent_magnet, torrent_file, torrent_url or wishlist_id must be defined'
      );
    }

    if (options.torrent_magnet) {
      return super.addTorrentMagnet(options.torrent_magnet, options.folder_id);
    } else if (options.torrent_url) {
      return super.addTorrentURL(options.torrent_url, options.folder_id);
    } else if (options.torrent_file) {
      if (options.folder_id) {
        console.warn(
          'Folder IDs ignored when uploading a file, saved in root dir'
        );
      }
      return super.addTorrentFile(options.torrent_file);
    } else if (options.wishlist_id) {
      return super.addTorrentFromWishlist(
        options.wishlist_id,
        options.folder_id
      );
    } else {
      throw new Error('Unreachable');
    }
  }

  /**
   * Retrieves the user's wishlist items.
   * @returns {Promise<T.WishlistItem>} Promise resolving an array of wishlist items.
   */
  async getWishlist(): Promise<T.WishlistItem[]> {
    return (await super.getAccountInfo()).account.wishlist;
  }

  /**
   * Clears all items from the user's wishlist.
   * @returns {Promise<void>} Promise resolving after completion.
   */
  async clearWishlist(): Promise<void> {
    const wishlist = await this.getWishlist();
    await Promise.all(
      wishlist.map((wish) => super.deleteWishlistItem(wish.id))
    );
  }

  /**
   * Renames a folder.
   * @param {number} id - The ID of the folder to rename.
   * @param {string} rename_to - The new name for the folder.
   * @returns {Promise<T.SeedrSuccess>} Promise resolving if successful.
   */
  renameFolder(id: number, rename_to: string): Promise<T.SeedrSuccess> {
    return super.renameItem({ folder_id: id, rename_to });
  }

  /**
   * Renames a file.
   * @param {number} id - The ID of the file to rename (use `folder_file_id` from list results).
   * @param {string} rename_to - The new name for the file.
   * @returns {Promise<T.SeedrSuccess>} Promise resolving if successful.
   */
  renameFile(id: number, rename_to: string): Promise<T.SeedrSuccess> {
    return super.renameItem({ file_id: id, rename_to });
  }

  /**
   * Deletes multiple items (folders, files, or torrents) specified by type and ID.
   * @param {object} ids - An object containing arrays of IDs to delete.
   * @param {number[]} [ids.folder] - An array of folder IDs to delete.
   * @param {number[]} [ids.file] - An array of file IDs (`folder_file_id`) to delete.
   * @param {number[]} [ids.torrent] - An array of torrent IDs to delete.
   * @returns {Promise<T.SeedrSuccess>} Promise resolving if successful.
   */
  delete(ids: {
    folder?: number[];
    file?: number[];
    torrent?: number[];
  }): Promise<T.SeedrSuccess> {
    const items: { type: string; id: number }[] = [
      ...(ids.folder ?? []).map((id) => {
        return { type: 'folder', id };
      }),
      ...(ids.file ?? []).map((id) => {
        return { type: 'file', id };
      }),
      ...(ids.torrent ?? []).map((id) => {
        return { type: 'torrent', id };
      }),
    ];
    return super.deleteItems(items);
  }

  /**
   * Deletes all top-level folders, files, and active torrents from the user's account.
   * @returns {Promise<void>} Promise resolving after completion.
   */
  async deleteAll(): Promise<void> {
    const folders = await this.list('folder');
    await this.delete({
      folder: folders.folders.map((i) => i.id),
      file: folders.files.map((i) => i.folder_file_id),
      torrent: folders.torrents.map((i) => i.id),
    });
  }
}
