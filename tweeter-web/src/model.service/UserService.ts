import { AuthToken, User } from "tweeter-shared";
import { Service } from "./Service";
import serverFacade from "../network/ServerFacade";

export class UserService implements Service {
  public async getUser(
    authToken: AuthToken,
    alias: string,
  ): Promise<User | null> {
    const response = await serverFacade.getUser({
      token: authToken.token,
      alias,
    });
    return User.fromDto(response.user);
  }

  public async isFollower(
    authToken: AuthToken,
    user: User,
    selectedUser: User,
  ): Promise<boolean> {
    const response = await serverFacade.isFollower({
      token: authToken.token,
      user: user.dto,
      selectedUser: selectedUser.dto,
    });
    return response.isFollower;
  }

  public async getFolloweeCount(
    authToken: AuthToken,
    user: User,
  ): Promise<number> {
    const response = await serverFacade.getFolloweeCount({
      token: authToken.token,
      user: user.dto,
    });
    return response.count;
  }

  public async getFollowerCount(
    authToken: AuthToken,
    user: User,
  ): Promise<number> {
    const response = await serverFacade.getFollowerCount({
      token: authToken.token,
      user: user.dto,
    });
    return response.count;
  }
}

