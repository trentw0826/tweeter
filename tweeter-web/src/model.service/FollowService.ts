import { AuthToken, User } from "tweeter-shared";
import { Service } from "./Service";
import serverFacade from "../network/ServerFacade";

export class FollowService implements Service {
  public async retrievePageOfFollowers(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: User | null,
  ): Promise<[User[], boolean]> {
    const response = await serverFacade.getFollowers({
      token: authToken.token,
      userAlias,
      pageSize,
      lastItem: lastItem ? lastItem.dto : null,
    });
    const users = (response.items ?? []).map((dto) => User.fromDto(dto)!);
    return [users, response.hasMore];
  }

  public async retrievePageOfFollowees(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastFollower: User | null,
  ): Promise<[User[], boolean]> {
    const response = await serverFacade.getFollowees({
      token: authToken.token,
      userAlias,
      pageSize,
      lastItem: lastFollower ? lastFollower.dto : null,
    });
    const users = (response.items ?? []).map((dto) => User.fromDto(dto)!);
    return [users, response.hasMore];
  }

  public async follow(authToken: AuthToken, userToFollow: User): Promise<void> {
    await serverFacade.follow({
      token: authToken.token,
      user: userToFollow.dto,
    });
  }

  public async unfollow(
    authToken: AuthToken,
    userToUnfollow: User,
  ): Promise<void> {
    await serverFacade.unfollow({
      token: authToken.token,
      user: userToUnfollow.dto,
    });
  }
}

