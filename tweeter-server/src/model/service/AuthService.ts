import bcrypt from "bcryptjs";
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
import type { BucketDao } from "../../data-access/index.js";

export class AuthService implements TweeterService {
  private userDao: UserDao;
  private bucketDao: BucketDao;

  public constructor(daoFactory: DaoFactory = DaoFactory.getInstance()) {
    this.userDao = daoFactory.getUserDao();
    this.bucketDao = daoFactory.getBucketDao();
  }

  public async login(
    alias: string,
    password: string,
  ): Promise<[UserDto, AuthTokenDto]> {
    alias = normalizeAlias(alias);
    assertAlias(alias);
    assertNonEmptyString(password, "password");

    const passwordHash = await this.userDao.getPasswordHash(alias);
    const user = await this.userDao.getUser(alias);
    if (user === null || passwordHash === null) {
      throw new Error("[bad-request] Invalid alias or password");
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash);
    if (!isValidPassword) {
      throw new Error("[bad-request] Invalid alias or password");
    }

    const token = await this.userDao.createAuthToken(alias);
    const authToken: AuthTokenDto = {
      token,
      timestamp: Date.now(),
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

    const existingUser = await this.userDao.getUser(alias);
    if (existingUser !== null) {
      throw new Error("[bad-request] Alias already exists");
    }

    const normalizedExtension = imageFileExtension
      .replace(/^\./, "")
      .toLowerCase();
    const contentType = this.toImageContentType(normalizedExtension);
    const imageKey = `users/${alias}.${normalizedExtension}`;
    const imageUrl = await this.bucketDao.uploadFile(
      imageKey,
      Buffer.from(userImageBytes, "base64"),
      contentType,
    );

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: UserDto = {
      alias,
      firstName,
      lastName,
      imageUrl,
    };

    await this.userDao.createUser(newUser, passwordHash);

    const token = await this.userDao.createAuthToken(alias);
    const authToken: AuthTokenDto = {
      token,
      timestamp: Date.now(),
    };

    return [newUser, authToken];
  }

  public async logout(token: string): Promise<void> {
    assertToken(token);

    await this.userDao.deleteAuthToken(token);
  }

  private toImageContentType(extension: string): string {
    if (extension === "jpg" || extension === "jpeg") {
      return "image/jpeg";
    }

    if (extension === "png") {
      return "image/png";
    }

    if (extension === "gif") {
      return "image/gif";
    }

    return "application/octet-stream";
  }
}
