<div align="center">
<img src="https://raw.githubusercontent.com/ragavpr/seedr-js/refs/heads/main/docs/images/logo.svg" width="240px" />

# seedr-js

## Unofficial Node.JS API Wrapper for [seedr.cc](https://seedr.cc)

[![NPM Version](https://img.shields.io/npm/v/seedr-js)](https://www.npmjs.com/package/seedr-js)
[![GitHub Release Date](https://img.shields.io/github/release-date/ragavpr/seedr-js)](https://github.com/ragavpr/seedr-js/releases/latest)
![visitors](https://visitor-badge.laobi.icu/badge?page_id=ragavpr.seedr-js)

</div>

## Index

- [Setup](#setup)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
  - [Persistence](#persistence)
  - [Login with Username and Password](#login-with-username-and-password)
- [Examples](#examples)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [API Source](#api-source)

## Setup

Install `seedr-js` via [npm](https://www.npmjs.com/package/seedr-js) using your
favorite package manager.

```sh
npm i seedr-js
```

## Quick Start

To use the API, Authentication is required with Seedr, any of the methods can be
used as needed afterwards, refer to the complete list of available methods.
[below](#documentation).

Import in a JS module.

```ts
import { Seedr } from 'seedr-js';
```

Use it interactively in a node-js command line.

```ts
const { Seedr } = await import('seedr-js');
```

## Authentication

There is currently only one flow to get the access token.

- OAuth Login with username/password.

Login is handled automatically if the state file has required info,
interactively prompted if needed.

### Persistence

Authentication state can be stored by `save()` and `load()` methods implemented
from interface `IStore`

A local state file implementation is already provided as `FilePersistence`
export, which is demonstrated below.

> [!WARNING]  
> `FilePersistence` saves everything in plain-JSON without encryption, take
> extra care saving in a secure location.

### Login with Username and Password

Can be used without persistence too (uses `NoPersistence` by default)

```ts
import { Seedr, FilePersistence } from 'seedr-js';

const AUTH_STATE_PATH = './auth_state.json';

// Immediately saves any Auth State changes.
const auth_state = new FilePersistence(AUTH_STATE_PATH);

// Pass no parameters to use NoPersistence
const seedr = new Seedr(auth_state);

// optional, if not specified, will be prompted for credentials
await seedr.auth.loginOAuth('username/email', 'password' /* true */);

// ... use as needed
```

## Examples

```ts
import { Seedr, FilePersistence } from 'seedr-js';

const auth_state = new FilePersistence('./auth_state.json');
const seedr = new Seedr(auth_state);

// // Assuming previously authenticated, prompted otherwise.
// await seedr.auth.loginOAuth('username/email', 'password')

// Account Info
let response1 = await seedr.getAccountInfo();
console.log(response1);

// Adding Torrent
let response2 = await seedr.addTorrentMagnet('magnet-uri');
console.log(response2);

// List Folder Contents
// Without top-level await.
seedr.list().then((response3) => {
  console.log(response3);
});
```

> [!TIP]  
> Separate variables are used to assign returned types from the functions, which
> will help with auto-complete / Intellisense.

## Documentation

This package provides extensive Typescript and JSDoc support, configure your IDE
for better experience with completions / Intellisense.

A brief list of all methods is provided below for reference. (assuming `seedr`
is an instance of `Seedr` class)

**Resource**

- `seedr.callFunc(func, form?, body?)` ⭐
- `seedr.waitForProgress(progress_url, timeout?)`
- `seedr.torrentFlow(uri?)` ⭐ [Interactive]
- `seedr.addTorrentMagnet(torrent_magnet)`
- `seedr.addTorrentURL(torrent_url)`
- `seedr.addTorrentFromWishlist(wishlist_id)`
- `seedr.list(content_id?)` ⭐
- `seedr.searchFiles(search_query)`
- `seedr.fetchFile(folder_file_id)` ⭐
- `seedr.addFolder(name)`
- `seedr.renameFolder(id, rename_to)`
- `seedr.renameFile(id, rename_to)`
- `seedr.renameTorrent(id, rename_to)`
- `seedr.delete(ids: {folder: [], file: [], torrent: []})`
- `seedr.deleteAll()` ⭐
- `seedr.getWishlist()`
- `seedr.testToken()`
- `seedr.getDevices()`
- `seedr.getAccountInfo()`
- `seedr.getUsage()` ⭐

**Auth** (automatically handled)

- `seedr.auth.loginOAuth(username, password)`
- `seedr.auth.refreshTokenOAuth()`
- `seedr.auth.authFlowOAuth(username?, password?, save?)` [Interactive]
- `seedr.auth.getAccessToken(credentials?)` ⭐

## Contributing

Contributions are welcome.

1. Fork and Clone the Project
2. Create a branch. (eg. `feat/new` `fix/issue`)
3. Make your changes.
4. Commit and Push to your branch.
5. Open a Pull Request.

## API Source

> [!WARNING]  
> API is subject to availability from Seedr, you might want to check out premium
> Rest-APIs offerings from Seedr if you require guaranteed access in production.

There are several projects previously developed for the same purpose, this
refers to them a lot.

- [hemantapkh/seedrcc](https://github.com/hemantapkh/seedrcc)
- [DannyZB/seedr_chrome](https://github.com/DannyZB/seedr_chrome)
