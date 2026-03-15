import {
  LoginRequest,
  RegisterRequest,
  LogoutRequest,
  GetUserRequest,
  IsFollowerRequest,
  GetFollowCountRequest,
  PagedUserItemRequest,
  PagedStatusItemRequest,
  FollowActionRequest,
  PostStatusRequest,
  AuthResponse,
  GetUserResponse,
  IsFollowerResponse,
  GetFollowCountResponse,
  PagedUserItemResponse,
  PagedStatusItemResponse,
  VoidResponse,
} from "tweeter-shared";
import { ClientCommunicator } from "./ClientCommunicator";

export class ServerFacade {
  private readonly clientCommunicator: ClientCommunicator;

  constructor(serverUrl?: string, clientCommunicator?: ClientCommunicator) {
    this.clientCommunicator =
      clientCommunicator ?? new ClientCommunicator(serverUrl);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  async login(request: LoginRequest): Promise<AuthResponse> {
    return this.clientCommunicator.doPost<LoginRequest, AuthResponse>(
      "/auth/login",
      request,
    );
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    return this.clientCommunicator.doPost<RegisterRequest, AuthResponse>(
      "/auth/register",
      request,
    );
  }

  async logout(request: LogoutRequest): Promise<VoidResponse> {
    return this.clientCommunicator.doPost<LogoutRequest, VoidResponse>(
      "/auth/logout",
      request,
    );
  }

  // ─── User ────────────────────────────────────────────────────────────────

  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    return this.clientCommunicator.doPost<GetUserRequest, GetUserResponse>(
      "/user/get",
      request,
    );
  }

  async isFollower(request: IsFollowerRequest): Promise<IsFollowerResponse> {
    return this.clientCommunicator.doPost<
      IsFollowerRequest,
      IsFollowerResponse
    >("/user/isfollower", request);
  }

  async getFolloweeCount(
    request: GetFollowCountRequest,
  ): Promise<GetFollowCountResponse> {
    return this.clientCommunicator.doPost<
      GetFollowCountRequest,
      GetFollowCountResponse
    >("/user/getfolloweecount", request);
  }

  async getFollowerCount(
    request: GetFollowCountRequest,
  ): Promise<GetFollowCountResponse> {
    return this.clientCommunicator.doPost<
      GetFollowCountRequest,
      GetFollowCountResponse
    >("/user/getfollowercount", request);
  }

  // ─── Follow ──────────────────────────────────────────────────────────────

  async getFollowees(
    request: PagedUserItemRequest,
  ): Promise<PagedUserItemResponse> {
    return this.clientCommunicator.doPost<
      PagedUserItemRequest,
      PagedUserItemResponse
    >("/follow/getfollowees", request);
  }

  async getFollowers(
    request: PagedUserItemRequest,
  ): Promise<PagedUserItemResponse> {
    return this.clientCommunicator.doPost<
      PagedUserItemRequest,
      PagedUserItemResponse
    >("/follow/getfollowers", request);
  }

  async follow(request: FollowActionRequest): Promise<VoidResponse> {
    return this.clientCommunicator.doPost<FollowActionRequest, VoidResponse>(
      "/follow/follow",
      request,
    );
  }

  async unfollow(request: FollowActionRequest): Promise<VoidResponse> {
    return this.clientCommunicator.doPost<FollowActionRequest, VoidResponse>(
      "/follow/unfollow",
      request,
    );
  }

  // ─── Status ──────────────────────────────────────────────────────────────

  async getFeedItems(
    request: PagedStatusItemRequest,
  ): Promise<PagedStatusItemResponse> {
    return this.clientCommunicator.doPost<
      PagedStatusItemRequest,
      PagedStatusItemResponse
    >("/status/getfeeditems", request);
  }

  async getStoryItems(
    request: PagedStatusItemRequest,
  ): Promise<PagedStatusItemResponse> {
    return this.clientCommunicator.doPost<
      PagedStatusItemRequest,
      PagedStatusItemResponse
    >("/status/getstoryitems", request);
  }

  async postStatus(request: PostStatusRequest): Promise<VoidResponse> {
    return this.clientCommunicator.doPost<PostStatusRequest, VoidResponse>(
      "/status/poststatus",
      request,
    );
  }
}

let defaultServerFacade: ServerFacade | null = null;

const getDefaultServerFacade = (): ServerFacade => {
  if (!defaultServerFacade) {
    defaultServerFacade = new ServerFacade();
  }

  return defaultServerFacade;
};

// Singleton — all services share a single instance
export default new Proxy({} as ServerFacade, {
  get(_target, property, receiver) {
    const facade = getDefaultServerFacade();
    const value = Reflect.get(facade, property, receiver);

    return typeof value === "function" ? value.bind(facade) : value;
  },
});
