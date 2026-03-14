import { FakeData, User, type UserDto } from "tweeter-shared";
import type TweeterService from "./TweeterService.js";

export class FollowService implements TweeterService {
  public async retrievePageOfFollowers(
    token: string,
    userAlias: string,
    pageSize: number,
    lastFollower: UserDto | null,
  ): Promise<[UserDto[], boolean]> {
    // TODO: Replace with real DB call
    return this.getFakeData(lastFollower, pageSize, userAlias);
  }

  public async retrievePageOfFollowees(
    token: string,
    userAlias: string,
    pageSize: number,
    lastFollowee: UserDto | null,
  ): Promise<[UserDto[], boolean]> {
    // TODO: Replace with real DB call
    return this.getFakeData(lastFollowee, pageSize, userAlias);
  }

  public async follow(
    token: string,
    userToFollow: UserDto,
  ): Promise<void> {
    // TODO: Replace with real DB call
  }

  public async unfollow(
    token: string,
    userToUnfollow: UserDto,
  ): Promise<void> {
    // TODO: Replace with real DB call
  }

  private async getFakeData(
    lastItem: UserDto | null,
    pageSize: number,
    userAlias: string,
  ): Promise<[UserDto[], boolean]> {
    const [items, hasMore] = FakeData.instance.getPageOfUsers(
      User.fromDto(lastItem),
      pageSize,
      userAlias,
    );
    const dtos = items.map((user: User) => user.dto);
    return [dtos, hasMore];
  }
}

