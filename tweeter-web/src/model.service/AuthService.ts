import { AuthToken, User } from "tweeter-shared";
import { Buffer } from "buffer";
import { Service } from "./Service";
import serverFacade from "../network/ServerFacade";

export class AuthService implements Service {
  public async login(
    alias: string,
    password: string,
  ): Promise<[User, AuthToken]> {
    const response = await serverFacade.login({ alias, password });
    const user = User.fromDto(response.user!);
    const authToken = AuthToken.fromDto(response.authToken!);
    if (!user || !authToken) {
      throw new Error("Invalid server response");
    }
    return [user, authToken];
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: Uint8Array,
    imageFileExtension: string,
  ): Promise<[User, AuthToken]> {
    const userImageBase64 = Buffer.from(userImageBytes).toString("base64");

    const response = await serverFacade.register({
      firstName,
      lastName,
      alias,
      password,
      userImageBytes: userImageBase64,
      imageFileExtension,
    });

    const user = User.fromDto(response.user!);
    const authToken = AuthToken.fromDto(response.authToken!);
    if (!user || !authToken) {
      throw new Error("Invalid server response");
    }
    return [user, authToken];
  }

  public async logout(authToken: AuthToken): Promise<void> {
    await serverFacade.logout({ token: authToken.token });
  }

  public async oauthLogin(providerName: string): Promise<boolean> {
    void providerName;
    return false;
  }
}
