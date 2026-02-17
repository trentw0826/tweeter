import { AuthToken, User } from "tweeter-shared";
import { FakeData } from "tweeter-shared/dist/util/FakeData";

export class UserService {
  public async getUser(
    authToken: AuthToken,
    alias: string,
  ): Promise<User | null> {
    // TODO: Replace with the result of calling server
    return FakeData.instance.findUserByAlias(alias);
  }
}
