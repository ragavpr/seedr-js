import * as T from './types';

import got from 'got';

const ENDPOINT = 'https://www.seedr.cc';

/**
 * Handles authentication and manages tokens for Seedr.
 */
export class Auth {
  #store: T.IStore;
  #auth?: T.AuthState;

  /**
   * Creates an instance of `Auth`.
   * @param {T.IStore} store - Auth State persistence handler.
   */
  constructor(store: T.IStore) {
    this.#store = store;
  }

  /**
   * Initiates an OAuth login process.
   * Can optionally accept `username` and `password`, if those are not already set in `state.credentials`.
   * Obtains both Access and Refresh Tokens.
   * @param {string} [username] - Email for login (optional).
   * @param {string} [password] - Password for login (optional).
   * @param {boolean} [save=false] - Whether to save the login credentials. Defaults to false.
   * @returns {Promise<T.RTokenFetch>} Promise resolving new Access and Refresh tokens.
   * @throws {Error} If the API returns a non-200 status code or an error key in the response object.
   */
  async loginOAuth(
    username?: string,
    password?: string,
    save: boolean = false
  ): Promise<T.RTokenFetch> {
    if (!this.#auth) this.#auth = await this.#store.load();
    username = this.#auth.credential?.username ?? username;
    password = this.#auth.credential?.password ?? password;

    if (username == undefined || password == undefined) {
      throw new Error('No username or password provided');
    }

    if (this.#auth.access) {
      if (Date.now() < this.#auth.access.expiry) {
        throw new Error('Valid Token already exists');
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
    await this.#store.save(this.#auth);
    return response.body;
  }

  /**
   * Obtains a new Access Token with Refresh Token if it exists.
   * @returns {Promise<T.RTokenRefresh>} Promise resolving new Access Token.
   * @throws {Error} If the API returns a non-200 status code or an error key in the response object.
   */
  async refreshTokenOAuth(): Promise<T.RTokenRefresh> {
    if (!this.#auth) this.#auth = await this.#store.load();
    if (!this.#auth.refresh) {
      throw new Error('Attempted to refresh without refresh token');
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
    await this.#store.save(this.#auth);
    return response.body;
  }

  /**
   * Initial Flow to Register XBMC device with Seedr.
   * Use the generated code to authorize in https://www.seedr.cc/devices
   * @returns {Promise<T.RDeviceGen>} Promise resolving newly generated XBMC Code.
   * @throws {Error} If the API returns a non-200 status code or an error key in the response object.
   */
  async obtainDeviceCode(): Promise<T.RDeviceGen> {
    if (!this.#auth) this.#auth = await this.#store.load();
    if (this.#auth.xbmc) {
      if (Date.now() < this.#auth.xbmc.expiry) {
        throw new Error(
          `Device code is valid, yet to be authorized, use ${
            this.#auth.xbmc.user_code
          } in https://www.seedr.cc/devices`
        );
      } else {
        throw new Error('Device Code already registered');
      }
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
    await this.#store.save(this.#auth);
    return response.body;
  }

  /**
   * Refreshes Access Token (XBMC) using Device Code.
   * Obtains a new long validity Access Token.
   * @returns {Promise<T.RTokenRefresh>} Promise resolving new Access Token.
   * @throws {Error} If the API returns a non-200 status code or an error key in the response object.
   */
  async refreshTokenXBMC(): Promise<T.RTokenRefresh> {
    if (!this.#auth) this.#auth = await this.#store.load();
    if (!this.#auth.xbmc) {
      throw new Error('No device code, generate code and authorize');
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
      throw new Error(
        `Device code is valid, yet to be authorized, use ${
          this.#auth.xbmc.user_code
        } in https://www.seedr.cc/devices`
      );
    } else
      Object.assign(this.#auth.xbmc, {
        expiry: undefined,
      });
    this.#auth.access = {
      token: response.body.access_token,
      expiry: Date.now() + response.body.expires_in * 1000,
    };
    await this.#store.save(this.#auth);
    return response.body;
  }

  /**
   * Makes sure an Access Token is available and valid, if not attempts to get a new one.
   * @returns {Promise<string>} Promise resolving new Access Token.
   * @throws {Error} If an existing token is invalid and a new Access Token cannot be obtained.
   */
  async getAccessToken(): Promise<string> {
    if (!this.#auth) this.#auth = await this.#store.load();
    if (this.#auth.access) {
      if (Date.now() < this.#auth.access?.expiry) {
        return this.#auth.access.token;
      } else {
        console.warn('Token expired');
      }
    }
    if (this.#auth.xbmc && !(this.#auth.xbmc.expiry < Date.now())) {
      console.log('Refreshing Token with XBMC');
      try {
        await this.refreshTokenXBMC();
      } catch (e) {
        console.warn(`Refresh (XBMC) failed: ${(e as Error).message}`);
      }
    }
    if (this.#auth.refresh) {
      console.log('Refreshing Token with OAuth');
      try {
        await this.refreshTokenOAuth();
      } catch (e) {
        console.warn(`Refresh failed: ${(e as Error).message}`);
      }
    }
    if (this.#auth.credential) {
      console.log('Logging in with OAuth');
      try {
        await this.loginOAuth();
      } catch (e) {
        console.warn(`Login failed: ${(e as Error).message}`);
      }
    }
    if (!this.#auth.access) {
      throw new Error(
        'Not Logged in / Registered for the first time, use loginOAuth() or obtainDeviceCode() with persistence'
      );
    }
    return this.#auth.access.token;
  }
}
