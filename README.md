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
  - [Authorizing Device](#authorizing-device)
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

To use the API, Authentication is required with Seedr, any of the methods can be used as needed afterwards, refer to the complete list of available methods [below](#documentation).

```ts
import { Seedr } from 'seedr-js';
```

## Authentication

There are two flows to get the access token.

- Login with username/password.
- Authorizing with device code.

Token refresh is handled automatically.

### Persistence

Authentication state can be stored by `save()` and `load()` methods implemented from interface `IStore`

A local file save implementation is already provided as `FilePersistence`
export, which is demonstrated below.

> [!WARNING]  
> `FilePersistence` saves everything in plain-JSON without encryption, take
> extra care saving in a secure location.

```ts
import { Seedr, FilePersistence } from 'seedr-js';

const AUTH_STATE_PATH = './auth_state.json';

// Immediately saves any Auth State changes.
const auth_state = new FilePersistence(AUTH_STATE_PATH);
const seedr = new Seedr(auth_state);

// ... use as needed
```

### Login with Username and Password

Can be used without persistence too (uses `NoPersistence` by default)

```ts
import { Seedr } from 'seedr-js';

// Auth State is not saved.
const seedr = new Seedr();

await seedr.auth.loginOAuth('username/email', 'password');

// ... use as needed
```

### Authorizing Device

This flow requires persistence.

> [!WARNING]  
> Authentication with device code grants long validity tokens (1 year), extra
> care is needed to prevent compromise.

```ts
import { Seedr, FilePersistence } from 'seedr-js';

const auth_state = new FilePersistence('./auth_state.json');
const seedr = new Seedr(auth_state);

await seedr.auth.obtainDeviceCode();

// delay / stop until the Code is Authorized in Seedr Devices for the first time.

// ... use as needed
```

## Examples

```ts
import { Seedr, FilePersistence } from 'seedr-js';

const auth_state = new FilePersistence('./auth_state.json');
const seedr = new Seedr(auth_state);

// // Assuming previously authenticated.
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

**Auth**

- `seedr.auth.loginOAuth(username?, password?)`
- `seedr.auth.refreshTokenOAuth()`
- `seedr.auth.obtainDeviceCode()`
- `seedr.auth.refreshTokenXBMC()`
- `seedr.auth.getAccessToken()`

**Resource**

- `seedr.addTorrentMagnet(torrent_magnet, folder_id?)`
- `seedr.addTorrentURL(torrent_url, folder_id?`
- `seedr.addTorrentFile(torrent_file)`
- `seedr.addTorrentFromWishlist(wishlist_id, folder_id?)`
- `seedr.addTorrent(options)`
- `seedr.scanPage(url)`
- `seedr.list(content_type?, id?)`
- `seedr.searchFiles(search_query)`
- `seedr.fetchFile(folder_file_id)`
- `seedr.addFolder(name)`
- `seedr.renameFolder(id, rename_to)`
- `seedr.renameFile(id, rename_to)`
- `seedr.delete(ids: {folder: [], file: [], torrent: []})`
- `seedr.deleteAll()`
- `seedr.getWishlist()`
- `seedr.deleteWishlistItem(id)`
- `seedr.clearWishlist()`
- `seedr.testToken()`
- `seedr.getDevices()`
- `seedr.getAccountInfo()`
- `seedr.getUsage()`

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
- [theabbie/seedr-api](https://github.com/theabbie/seedr-api)
- [DannyZB/seedr_chrome](https://github.com/DannyZB/seedr_chrome)
- [DannyZB/seedr_kodi](https://github.com/DannyZB/seedr_kodi)
