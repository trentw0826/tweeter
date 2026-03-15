import { FakeData, type UserDto } from "tweeter-shared";
import type TweeterService from "./TweeterService.js";
import { assertAlias, assertToken, assertUserDto } from "./Validation.js";

export class UserService implements TweeterService {
  public async getUser(token: string, alias: string): Promise<UserDto | null> {
    assertToken(token);
    assertAlias(alias);

    // TODO: Replace with real DB call
    const user = FakeData.instance.findUserByAlias(alias);
    return user ? user.dto : null;
  }

  public async isFollower(
    token: string,
    user: UserDto,
    selectedUser: UserDto,
  ): Promise<boolean> {
    assertToken(token);
    assertUserDto(user, "user");
    assertUserDto(selectedUser, "selectedUser");

    // TODO: Replace with real DB call
    return FakeData.instance.isFollower();
  }

  public async getFolloweeCount(token: string, user: UserDto): Promise<number> {
    assertToken(token);
    assertUserDto(user, "user");

    // TODO: Replace with real DB call
    return FakeData.instance.getFolloweeCount(user.alias);
  }

  public async getFollowerCount(token: string, user: UserDto): Promise<number> {
    assertToken(token);
    assertUserDto(user, "user");

    // TODO: Replace with real DB call
    return FakeData.instance.getFollowerCount(user.alias);
  }
}
