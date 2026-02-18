import { AuthToken, User } from "tweeter-shared";
import { FakeData } from "tweeter-shared/dist/util/FakeData";
import { Buffer } from "buffer";

export class AuthService {
  public async login(
    alias: string,
    password: string,
  ): Promise<[User, AuthToken]> {
    // TODO: Replace with the result of calling the server
    const user = FakeData.instance.firstUser;

    if (user === null) {
      throw new Error("Invalid alias or password");
    }

    return [user, FakeData.instance.authToken];
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: Uint8Array,
    imageFileExtension: string,
  ): Promise<[User, AuthToken]> {
    const imageStringBase64: string =
      Buffer.from(userImageBytes).toString("base64");
    void imageStringBase64;

    // TODO: Replace with the result of calling the server
    const user = FakeData.instance.firstUser;

    if (user === null) {
      throw new Error("Invalid registration");
    }

    return [user, FakeData.instance.authToken];
  }

  public async logout(authToken: AuthToken): Promise<void> {
    void authToken;
    // TODO: Replace with the result of calling the server
    await new Promise((res) => setTimeout(res, 1000));
  }

  public async oauthLogin(providerName: string): Promise<boolean> {
    void providerName;
    // TODO: Replace with the result of calling the server
    return false;
  }
}
