import * as T from './types';

import got from 'got';

const ENDPOINT = 'https://www.seedr.cc';

export class Auth {
  #state: T.IState;
  #auth?: T.AuthState;
  constructor(state: T.IState) {
    this.#state = state;
  }

  async loginOAuth(
    username?: string,
    password?: string,
    save: boolean = false
  ) {
    if (!this.#auth) this.#auth = await this.#state.load();
    username = this.#auth.credential?.username ?? username;
    password = this.#auth.credential?.password ?? password;

    if (username == undefined || password == undefined) {
      throw new Error('No username or password provided');
    }

    if (this.#auth.access) {
      if (Date.now() < this.#auth.access.expiry) {
        console.warn('Valid Token already exists');
        return;
      }
    }
    const response = await got.post<T.Either<T.RTokenFetch, T.SeedrError>>(
      `${ENDPOINT}/oauth_test/token.php`,
      {
        form: {
          grant_type: 'password',
          username,
          password,
          client_id: 'seedr_chrome',
        },
        responseType: 'json',
        throwHttpErrors: false,
      }
    );
    if (response.statusCode != 200) {
      throw new Error(response.body.error_description);
    }
    if (save) {
      console.warn('Username/Password stored in state as plain-text');
      this.#auth.credential = {
        username,
        password,
      };
    }
    this.#auth.access = {
      token: response.body.access_token,
      expiry: response.body.expires_in * 1000 + Date.now(),
    };
    this.#auth.refresh = {
      token: response.body.refresh_token,
    };
    await this.#state.save(this.#auth);
    return response.body;
  }

  async refreshTokenOAuth() {
    if (!this.#auth) this.#auth = await this.#state.load();
    if (!this.#auth.refresh) {
      console.warn("Refresh Token doesn't exist, try obtaining new ones");
      return;
    }
    const response = await got.post<T.Either<T.RTokenRefresh, T.SeedrError>>(
      `${ENDPOINT}/oauth_test/token.php`,
      {
        form: {
          grant_type: 'refresh_token',
          refresh_token: this.#auth.refresh.token,
          client_id: 'seedr_chrome',
        },
        responseType: 'json',
        throwHttpErrors: false,
      }
    );
    if (response.statusCode != 200) {
      throw new Error(response.body.error_description);
    }
    this.#auth.access = {
      token: response.body.access_token,
      expiry: response.body.expires_in * 1000 + Date.now(),
    };
    await this.#state.save(this.#auth);
    return response.body;
  }

  async obtainDeviceCode() {
    if (!this.#auth) this.#auth = await this.#state.load();
    if (this.#auth.xbmc) {
      if (Date.now() < this.#auth.xbmc.expiry) {
        console.warn(
          `Authorize Device by visiting https://www.seedr.cc/devices and entering the following code: ${
            this.#auth.xbmc.user_code
          }`
        );
      } else {
        console.warn('Device Code already registered');
      }
      return;
    }
    const response = await got.get<T.Either<T.RDeviceGen, unknown>>(
      `${ENDPOINT}/api/device/code`,
      {
        searchParams: {
          client_id: 'seedr_xbmc',
        },
        responseType: 'json',
      }
    );
    if (response.statusCode != 200) {
      throw new Error(JSON.stringify(response.body));
    }
    this.#auth.xbmc = {
      device_code: response.body.device_code,
      user_code: response.body.user_code,
      expiry: response.body.expires_in * 1000 + Date.now(),
    };
    await this.#state.save(this.#auth);
    return response.body;
  }

  async refreshTokenXBMC() {
    if (!this.#auth) this.#auth = await this.#state.load();
    if (!this.#auth.xbmc) {
      console.warn('No device code, generate code and authorize');
      return;
    }
    const response = await got.get<T.Either<T.RTokenRefresh, T.SeedrError>>(
      'https://www.seedr.cc/api/device/authorize',
      {
        searchParams: {
          device_code: this.#auth.xbmc.device_code,
          client_id: 'seedr_xbmc',
        },
        responseType: 'json',
      }
    );
    if (response.body.error == 'authorization_pending') {
      console.warn(
        `Verify Device here https://www.seedr.cc/devices\nuser_code: ${
          this.#auth.xbmc.user_code
        }`
      );
      throw new Error('Authorization Pending');
    } else
      Object.assign(this.#auth.xbmc, {
        expiry: undefined,
      });
    this.#auth.access = {
      token: response.body.access_token,
      expiry: Date.now() + response.body.expires_in * 1000,
    };
    await this.#state.save(this.#auth);
    return response.body;
  }

  async getAccessToken() {
    if (!this.#auth) this.#auth = await this.#state.load();
    if (this.#auth.access) {
      if (Date.now() < this.#auth.access?.expiry) {
        return this.#auth.access.token;
      } else {
        console.log('Token expired');
      }
    }
    if (this.#auth.xbmc && !(this.#auth.xbmc.expiry < Date.now())) {
      try {
        console.log('Refreshing Token with XBMC');
        await this.refreshTokenXBMC();
      } catch (e) {
        console.warn('XBMC Configured, but invalid');
      }
    }
    if (this.#auth.refresh) {
      console.log('Refreshing Token with OAuth');
      await this.refreshTokenOAuth();
    }
    if (this.#auth.credential) {
      console.log('Logging in with OAuth');
      await this.loginOAuth();
    }
    if (!this.#auth.access)
      throw new Error('Not Logged in / Registered for the first time');
    return this.#auth.access?.token;
  }
}
