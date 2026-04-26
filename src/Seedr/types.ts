export type SeedrAuthError = {
  error: string;
  error_description: string;
};

export type SeedrApiError = {
  status_code?: number;
  reason_phrase: string;
};

export type SeedrAccessError = {
  result: boolean;
  error: string;
};

export type SeedrSuccess = {
  success: boolean;
  // code?: number;
};

export type RTokenFetch = RTokenRefresh & {
  refresh_token: string;
};

export type RTokenRefresh = {
  access_token: string;
  expires_in: number;
  token_type: 'Bearer' | string;
  scope: null;
};

export interface IStore {
  save(state: AuthState): void | Promise<void>;
  load(): AuthState | Promise<AuthState>;
}

export type AuthState = {
  oauth?: {
    access: {
      token: string;
      expiry: number;
    };
    refresh: {
      token: string;
      expiry?: number;
    };
  };
  credential?: {
    username: string;
    password: string;
  };
};

export type Folder = {
  id: number;
  path: string;
  size: number;
  last_update: string;
  name: string;
  fullname: string;
  // play_audio?: boolean;
  // play_video?: boolean;
  // is_shared?: boolean;
};

export type File = {
  id: number;
  name: string;
  size: number;
  hash: string;
  folder_id: number;
  last_update: string;
  is_audio: boolean;
  is_video: boolean;
  presentation_urls: {
    image: Record<string, string>;
    video: Record<string, string>;
  };
  thumb: string;
  folder_file_id: number; // id
  play_video: boolean;
  play_audio: boolean;
  stream_video: boolean;
  stream_audio: boolean;
  // video_progress?: string;
  // is_lost?: number;
};

export type Torrent = {
  id: number;
  name: string;
  size: number;
  hash: string;
  download_rate: number;
  torrent_quality: number;
  connected_to: number;
  downloading_from: number;
  uploading_to: number;
  seeders: number;
  leechers: number;
  warnings: unknown[];
  stopped: number;
  progress: number;
  progress_url: string;
  last_update: string; //DateTime
};

export type Task = Record<string, unknown>;

export type RAddTorrent = SeedrSuccess & {
  user_torrent_id: number;
  title: string;
  success: boolean;
  torrent_hash: string;
};

export type HProgress = {
  title: string;
  size: number;
  download_rate: number;
  torrent_quality: number;
  warnings: unknown[];
  stats: {
    torrent_hash: string;
    progress: number;
    title: string;
    downloading_from: number;
    uploading_to: number;
    warnings: unknown[];
    stopped: number;
    folder_created: number;
    download_rate: number;
    size: number;
    torrent_quality: number;
    seeders: number;
    leechers: number;
    seed_ratio: number;
  };
  stopped: number;
  progress: number;
  hash: string;
  folder_created: number;
  files_progress: unknown[];
};

export type RListingDetails = {
  space_max: number;
  space_used: number;
  space_scope: 'user' | string;
  saw_walkthrough: number;
  id: number;
  // t?: number[];
  timestamp: string;
  path: string;
  size: number;
  parent: number;
  folders: Folder[];
  files: File[];
  torrents: Torrent[];
  tasks: Task[];
  // folder_id?: number;
  // fullname?: string;
  // type?: 'folder' | 'file' | 'torrent' | string;
  // name?: string;
  // indexes?: number[];
};

export type RFetchFile = SeedrSuccess & {
  url: string;
  name: string;
  result: boolean;
};

export type WishlistItem = {
  id: number;
  user_id: number;
  title: string;
  size: number;
  torrent_hash: string;
  torrent_magnet: string;
  // torrent_meta?: string;
  created: string;
  added: number;
  is_private: number;
};

export type UserAccount = {
  username: string;
  email: string;
  user_id: number;
  premium: boolean;
  space_used: number;
  space_max: number;
  space_scope: 'user' | string;
  bandwidth_used: number;
  package_id: number;
  package_name: 'NON-PREMIUM' | string;
  wishlist: WishlistItem[];
  invites: number;
  invites_accepted: number;
  // max_invites?: number;
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

export type RMemoryBandwidth = SeedrSuccess & {
  bandwidth_used: number;
  bandwidth_max: number;
  space_used: number;
  space_max: number;
  space_scope: 'user' | string;
  is_premium: boolean;
};

// export type RScanResults = SeedrSuccess & {
//   torrents: {
//     hash: string;
//     magnet: string;
//     filenames?: string[];
//     filesizes?: number[];
//     title: string;
//     size?: number;
//     is_private: boolean;
//     pct: number;
//   }[];
// };

export type RDevices = SeedrSuccess & {
  devices: {
    client_id: string;
    client_name: string;
    device_code: string;
    tk: string | null;
  }[];
};

// export type RCreateArchive = SeedrSuccess & {
//   archive_id: number;
//   archive_url: string;
// };

export type RSearchResults = {
  max_space: number;
  used_space: number;
  fullname: string;
  name: string;
  torrents: Torrent[];
  folders: Folder[];
  files: File[];
};
