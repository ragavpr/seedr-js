import * as T from './types';
import { Seedr } from './Seedr';
import got from 'got';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Provides methods for interacting with the Seedr API.
 * Extends the base Seedr class, providing additional convenience methods.
 * @extends {Seedr}
 */
export class SeedrExtended extends Seedr {
  /**
   * Retrieves the user's wishlist items.
   * @returns {Promise<T.WishlistItem>} Promise resolving an array of wishlist items.
   */
  async getWishlist(): Promise<T.WishlistItem[]> {
    return (await super.getAccountInfo()).account.wishlist;
  }

  // // DISABLED: func not found.
  // /**
  //  * Clears all items from the user's wishlist.
  //  * @returns {Promise<void>} Promise resolving after completion.
  //  */
  // async clearWishlist(): Promise<void> {
  //   const wishlist = await this.getWishlist();
  //   await Promise.all(
  //     wishlist.map((wish) => super.deleteWishlistItem(wish.id))
  //   );
  // }

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
   * @param {number} id - The ID of the file to rename.
   * @param {string} rename_to - The new name for the file.
   * @returns {Promise<T.SeedrSuccess>} Promise resolving if successful.
   */
  renameFile(id: number, rename_to: string): Promise<T.SeedrSuccess> {
    return super.renameItem({ folder_file_id: id, rename_to });
  }

  /**
   * Renames a torrent.
   * @param {number} id - The ID of the torrent to rename.
   * @param {string} rename_to - The new name for the torrent.
   * @returns {Promise<T.SeedrSuccess>} Promise resolving if successful.
   */
  renameTorrent(id: number, rename_to: string): Promise<T.SeedrSuccess> {
    return super.renameItem({ torrent_id: id, rename_to });
  }

  /**
   * Deletes multiple items (folders, files, or torrents) specified by type and ID.
   * @param {object} ids - An object containing arrays of IDs to delete.
   * @param {number[]} [ids.folder] - An array of folder IDs to delete.
   * @param {number[]} [ids.file] - An array of file IDs (`folder_file_id`) to delete.
   * @param {number[]} [ids.torrent] - An array of torrent IDs to delete.
   * @returns {Promise<T.SeedrSuccess>} Promise resolving if successful.
   */
  async delete(ids: {
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
    if (items.length > 0) return await super.deleteItems(items);
    return { success: true };
  }

  /**
   * Deletes all top-level folders, files, and active torrents from the user's account.
   * @returns {Promise<void>} Promise resolving after completion.
   */
  async deleteAll(): Promise<void> {
    const folders = await this.list();
    await this.delete({
      folder: folders.folders.map((i) => i.id),
      file: folders.files.map((i) => i.folder_file_id),
      torrent: folders.torrents.map((i) => i.id),
    });
  }
}
