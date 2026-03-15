import { FakeData, User, AuthToken, type UserDto, type AuthTokenDto } from "tweeter-shared";
import type TweeterService from "./TweeterService.js";

export class AuthService implements TweeterService {
  public async login(
    alias: string,
    password: string,
  ): Promise<[UserDto, AuthTokenDto]> {
    // TODO: Replace with real auth + DB call
    const user = FakeData.instance.firstUser;
    if (user === null) {
      throw new Error("[bad-request] Invalid alias or password");
    }
    const authToken = FakeData.instance.authToken;
    return [user.dto, authToken.dto];
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: string,
    imageFileExtension: string,
  ): Promise<[UserDto, AuthTokenDto]> {
    // TODO: Upload image to S3 and persist user to DB
    const user = FakeData.instance.firstUser;
    if (user === null) {
      throw new Error("[bad-request] Invalid registration");
    }
    const authToken = FakeData.instance.authToken;
    return [user.dto, authToken.dto];
  }

  public async logout(token: string): Promise<void> {
    // TODO: Invalidate the auth token in DB
  }
}
