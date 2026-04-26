import * as T from './types';

import inquirer from 'inquirer';
import got from 'got';

const ENDPOINT_AUTH = 'https://www.seedr.cc/api/token';
const TIME_BUFFER = 10000; //ms

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
   * @param {string} [username] - Email for login (can be provided by state-file instead).
   * @param {string} [password] - Password for login (can be provided by state-file instead).
   * @param {boolean} [save=false] - Whether to save the login credentials. Defaults to false.
   * @returns {Promise<T.RTokenFetch>} Promise resolving new Access and Refresh tokens.
   * @throws {Error} If the API returns a non-200 status code or an error key in the response object.
   */
  async loginOAuth(username: string, password: string): Promise<T.RTokenFetch> {
    if (!this.#auth) this.#auth = await this.#store.load();

    const response = await got.post<T.Either<T.RTokenFetch, T.SeedrError>>(
      ENDPOINT_AUTH,
      {
        form: {
          client_id: 'seedr_chrome',
          type: 'login',
          grant_type: 'password',
          username,
          password,
        },
        responseType: 'json',
        throwHttpErrors: false,
      }
    );
    if (response.statusCode != 200) {
      throw new Error(response.body.error_description);
    }

    this.#auth.oauth = {
      access: {
        token: response.body.access_token,
        expiry: response.body.expires_in * 1000 + Date.now() - TIME_BUFFER,
      },
      refresh: {
        token: response.body.refresh_token,
      },
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

    if (!this.#auth.oauth?.refresh?.token) {
      throw new Error('Attempted to refresh without refresh token');
    }

    const response = await got.post<T.Either<T.RTokenRefresh, T.SeedrError>>(
      ENDPOINT_AUTH,
      {
        form: {
          client_id: 'seedr_chrome',
          grant_type: 'refresh_token',
          refresh_token: this.#auth.oauth.refresh.token,
        },
        responseType: 'json',
        throwHttpErrors: false,
      }
    );
    if (response.statusCode != 200) {
      throw new Error(response.body.error_description);
    }

    this.#auth.oauth.access = {
      token: response.body.access_token,
      expiry: response.body.expires_in * 1000 + Date.now() - TIME_BUFFER,
    };

    await this.#store.save(this.#auth);
    return response.body;
  }

  /**
   * The full OAuth flow to obtain access token.
   * @returns {Promise<string>} Promise resolving new Access Token.
   * @throws {Error} If an existing token is invalid and a new Access Token cannot be obtained.
   */
  async authFlowOAuth(
    username?: string,
    password?: string,
    save = false
  ): Promise<string> {
    if (!this.#auth) this.#auth = await this.#store.load();

    if (Date.now() < (this.#auth.oauth?.access?.expiry ?? 0)) {
      throw new Error('Valid Token already exists');
    }

    if (this.#auth.oauth?.refresh) {
      console.log('Refreshing Token with OAuth');
      try {
        await this.refreshTokenOAuth();
        return this.#auth.oauth.access.token;
      } catch (e) {
        console.warn(`Refresh failed: ${(e as Error).message}`);
      }
    }

    if (username == undefined || password == undefined) {
      ({ username, password } = this.#auth.credential ?? {});
    }

    if (username == undefined || password == undefined) {
      ({ username, password, save } = await inquirer.prompt([
        {
          type: 'input',
          name: 'username',
          message: 'Enter email/username:',
          validate: (input) => {
            if (input.trim() === '') {
              return 'Cannot be empty';
            }
            return true;
          },
        },
        {
          type: 'password',
          name: 'password',
          message: 'Enter password:',
          validate: (input) => {
            if (input.trim() === '') {
              return 'Cannot be empty';
            }
            return true;
          },
        },
        {
          type: 'confirm',
          name: 'save',
          message: 'Store credentials in state?',
          default: false,
        },
      ]));
    } else {
      console.log('Using saved login credentials');
    }

    if (username == undefined || password == undefined) {
      throw new Error('No username or password provided');
    }

    await this.loginOAuth(username, password);

    if (save) {
      this.#auth.credential = {
        username,
        password,
      };
      console.warn('Login credentials stored in state as plain-text');
    }

    await this.#store.save(this.#auth);
    return this.#auth.oauth!.access.token;
  }

  /**
   * Makes sure an Access Token is available and valid, if not attempts to get a new one.
   * @returns {Promise<string>} Promise resolving new Access Token.
   * @throws {Error} If an existing token is invalid and a new Access Token cannot be obtained.
   */
  async getAccessToken(
    credentials?: T.AuthState['credential']
  ): Promise<string> {
    if (!this.#auth) this.#auth = await this.#store.load();

    if (Date.now() < (this.#auth.oauth?.access?.expiry ?? 0)) {
      return this.#auth.oauth!.access.token;
    } else {
      console.warn('Token expired');
    }

    console.log('Attempting OAuth Flow');
    try {
      await this.authFlowOAuth(credentials?.username, credentials?.password);
    } catch (e) {
      console.warn(`OAuth Flow Failed: ${(e as Error).message}`);
    }

    if (!this.#auth.oauth?.access) {
      throw new Error('All Authentication flows failed');
    }
    return this.#auth.oauth.access.token;
  }

  async expireAccessToken() {
    if (!this.#auth) this.#auth = await this.#store.load();

    if (this.#auth.oauth?.access) {
      this.#auth.oauth.access.expiry = 0;
    }

    await this.#store.save(this.#auth);
  }
}
