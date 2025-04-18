export type Either<L, R> =
  | ({ [K in keyof L]: L[K] } & { [K in keyof R]: never })
  | ({ [K in keyof L]: never } & { [K in keyof R]: R[K] });

export type SeedrError = {
  error: string;
  error_description: string;
};

export type SeedrSuccess = {
  result: boolean;
  code?: number;
};

export type RDeviceGen = {
  expires_in: number;
  interval: number;
  device_code: string;
  user_code: string;
  verification_url: string;
};

export type RTokenFetch = RTokenRefresh & {
  refresh_token: string;
};

export type RTokenRefresh = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

export interface IState {
  save(state: AuthState): void | Promise<void>;
  load(): AuthState | Promise<AuthState>;
}

export type AuthState = {
  access?: {
    token: string;
    expiry: number;
  };
  refresh?: {
    token: string;
    expiry?: number;
  };
  xbmc?: {
    device_code: string;
    user_code: string;
    expiry: number;
  };
  credential?: {
    username: string;
    password: string;
  };
};

export type Folder = {
  id: number;
  name: string;
  fullname: string;
  size: number;
  play_audio: boolean;
  play_video: boolean;
  is_shared: boolean;
  last_update: string;
};

export type File = {
  name: string;
  size: number;
  hash: string;
  folder_id: number;
  folder_file_id: number;
  file_id: number;
  last_update: string;
  play_audio: boolean;
  play_video: boolean;
  video_progress: string;
  is_lost: number;
  thumb: string;
};

export type Torrent = {
  id: number;
  name: string;
  folder: string;
  size: number;
  hash: string;
  download_rate: number;
  torrent_quality: number;
  connected_to: number;
  downloading_from: number;
  uploading_to: number;
  seeders: number;
  leechers: number;
  warnings: null | any;
  stopped: number;
  progress: string;
  progress_url: string;
  last_update: string;
};

export type RAddTorrent = SeedrSuccess & {
  user_torrent_id: number;
  title: string;
  torrent_hash: string;
};

export type RFolderDetails = {
  space_max: number;
  space_used: number;
  saw_walkthrough: number;
  t: number[];
  timestamp: string;
  folder_id: number;
  fullname: string;
  type: 'folder' | 'file' | 'torrent';
  name: string;
  parent: number;
  indexes: number[];
  torrents: Torrent[];
  folders: Folder[];
  files: File[];
};

export type RFetchFile = SeedrSuccess & {
  url: string;
  name: string;
};

export type WishlistItem = {
  id: number;
  user_id: number;
  title: string;
  size: number;
  torrent_hash: string;
  torrent_magnet: string;
  torrent_meta: string;
  created: string;
  added: number;
  is_private: number;
};

export type UserAccount = {
  username: string;
  user_id: number;
  premium: number;
  package_id: number;
  package_name: string;
  space_used: number;
  space_max: number;
  bandwidth_used: number;
  email: string;
  wishlist: WishlistItem[];
  invites: number;
  invites_accepted: number;
  max_invites: number;
};

export type AccountSettings = {
  allow_remote_access: boolean;
  site_language: string;
  subtitles_language: string;
  email_announcements: boolean;
  email_newsletter: boolean;
};

export type RAccountSettings = SeedrSuccess & {
  settings: AccountSettings;
  account: UserAccount;
  country: string;
};

export type RMemoryBandwidth = {
  bandwidth_used: number;
  bandwidth_max: number;
  space_used: number;
  space_max: number;
  is_premium: number;
};

export type RScanResults = SeedrSuccess & {
  torrents: {
    hash: string;
    magnet: string;
    filenames?: string[];
    filesizes?: number[];
    title: string;
    size?: number;
    is_private: boolean;
    pct: number;
  }[];
};

export type RDevices = SeedrSuccess & {
  devices: {
    client_id: string;
    client_name: string;
    device_code: string;
    tk: string;
  }[];
};

export type RCreateArchive = SeedrSuccess & {
  archive_id: number;
  archive_url: string;
};

export type RSearchResults = {
  max_space: number;
  used_space: number;
  fullname: string;
  name: string;
  torrents: Torrent[];
  folders: Folder[];
  files: File[];
};
