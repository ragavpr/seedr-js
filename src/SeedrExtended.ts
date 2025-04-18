import { Seedr as SeedrVanilla } from './Seedr';

export class Seedr extends SeedrVanilla {
  addTorrent(options: {
    folder_id?: number;
    wishlist_id?: number;
    torrent_magnet?: string;
    torrent_file?: string;
    torrent_url?: string;
  }) {
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
    } else {
      throw new Error('Unreachable');
    }
  }

  async getWishlist() {
    return (await super.getAccountInfo()).account.wishlist;
  }

  async clearWishlist() {
    const wishlist = await this.getWishlist();
    await Promise.all(wishlist.map((wish) => super.removeWishlist(wish.id)));
  }

  renameFolder(id: number, name: string) {
    return super.renameItem({ rename_to: name, folder_id: id });
  }

  renameFile(id: number, name: string) {
    return super.renameItem({ rename_to: name, file_id: id });
  }

  delete(ids: { folder?: number[]; file?: number[]; torrent?: number[] }) {
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

  async deleteAll() {
    const folders = await this.listFolder('folder');
    await this.delete({
      folder: folders.folders.map((i) => i.id),
      file: folders.files.map((i) => i.folder_file_id),
      torrent: folders.torrents.map((i) => i.id),
    });
  }
}
