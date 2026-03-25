import type { UserDto, AuthTokenDto } from "tweeter-shared";
import type TweeterService from "./TweeterService.js";
import {
  assertAlias,
  assertNonEmptyString,
  assertToken,
  normalizeAlias,
} from "./Validation.js";
import { DaoFactory } from "../../data-access/index.js";
import type { UserDao } from "../../data-access/index.js";

export class AuthService implements TweeterService {
  private userDao: UserDao;

  public constructor() {
    const daoFactory = DaoFactory.getInstance();
    this.userDao = daoFactory.getUserDao();
  }

  public async login(
    alias: string,
    password: string,
  ): Promise<[UserDto, AuthTokenDto]> {
    alias = normalizeAlias(alias);
    assertAlias(alias);
    assertNonEmptyString(password, "password");

    // TODO: Verify password and retrieve user from DAO
    const user = await this.userDao.getUser(alias);
    if (user === null) {
      throw new Error("[bad-request] Invalid alias or password");
    }

    // TODO: Generate auth token and store in DB
    const authToken: AuthTokenDto = {
      token: "[generated-token]",
      expiration: Date.now() + 3600000,
    };

    return [user, authToken];
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: string,
    imageFileExtension: string,
  ): Promise<[UserDto, AuthTokenDto]> {
    assertNonEmptyString(firstName, "firstName");
    assertNonEmptyString(lastName, "lastName");
    alias = normalizeAlias(alias);
    assertAlias(alias);
    assertNonEmptyString(password, "password");
    assertNonEmptyString(userImageBytes, "userImageBytes");
    assertNonEmptyString(imageFileExtension, "imageFileExtension");

    // TODO: Upload image to S3, hash password, and persist user to DB via DAO
    const newUser: UserDto = {
      alias,
      firstName,
      lastName,
      imageUrl: "[s3-image-url]",
    };

    await this.userDao.saveUser(newUser);

    // TODO: Generate auth token and store in DB
    const authToken: AuthTokenDto = {
      token: "[generated-token]",
      expiration: Date.now() + 3600000,
    };

    return [newUser, authToken];
  }

  public async logout(token: string): Promise<void> {
    assertToken(token);

    // TODO: Invalidate the auth token in DB via DAO
  }
}
