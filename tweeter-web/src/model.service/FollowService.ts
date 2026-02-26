import { AuthToken, User } from "tweeter-shared";
import { FakeData } from "tweeter-shared/dist/util/FakeData";
import { Service } from "./Service";

export class FollowService implements Service {
  public async retrievePageOfFollowers(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: User | null,
  ): Promise<[User[], boolean]> {
    // TODO: Replace with the result of calling server
    return FakeData.instance.getPageOfUsers(lastItem, pageSize, userAlias);
  }

  public async retrievePageOfFollowees(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastFollower: User | null,
  ): Promise<[User[], boolean]> {
    // TODO: Replace with the result of calling server
    return FakeData.instance.getPageOfUsers(lastFollower, pageSize, userAlias);
  }

  public async follow(authToken: AuthToken, userToFollow: User): Promise<void> {
    // Pause so we can see the follow message. Remove when connected to the server
    await new Promise((f) => setTimeout(f, 2000));

    // TODO: Call the server
  }

  public async unfollow(
    authToken: AuthToken,
    userToUnfollow: User,
  ): Promise<void> {
    // Pause so we can see the unfollow message. Remove when connected to the server
    await new Promise((f) => setTimeout(f, 2000));

    // TODO: Call the server
  }
}
