import {
  TweeterResponse,
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

class ServerFacade {
  private readonly SERVER_URL: string;

  constructor() {
    const serverUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

    if (!serverUrl) {
      throw new Error(
        "API base URL not set. Please set VITE_API_BASE_URL in your .env file.",
      );
    }

    this.SERVER_URL = serverUrl;
  }

  private async doPost<Req, Res extends TweeterResponse>(
    endpoint: string,
    request: Req,
  ): Promise<Res> {
    const response = await fetch(`${this.SERVER_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? `Server error: ${response.status}`);
    }

    const data: Res = await response.json();

    if (!data.success) {
      throw new Error(data.message ?? "Unknown server error");
    }

    return data;
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  async login(request: LoginRequest): Promise<AuthResponse> {
    return this.doPost<LoginRequest, AuthResponse>("/auth/login", request);
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    return this.doPost<RegisterRequest, AuthResponse>(
      "/auth/register",
      request,
    );
  }

  async logout(request: LogoutRequest): Promise<VoidResponse> {
    return this.doPost<LogoutRequest, VoidResponse>("/auth/logout", request);
  }

  // ─── User ────────────────────────────────────────────────────────────────

  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    return this.doPost<GetUserRequest, GetUserResponse>("/user/get", request);
  }

  async isFollower(request: IsFollowerRequest): Promise<IsFollowerResponse> {
    return this.doPost<IsFollowerRequest, IsFollowerResponse>(
      "/user/isfollower",
      request,
    );
  }

  async getFolloweeCount(
    request: GetFollowCountRequest,
  ): Promise<GetFollowCountResponse> {
    return this.doPost<GetFollowCountRequest, GetFollowCountResponse>(
      "/user/getfolloweecount",
      request,
    );
  }

  async getFollowerCount(
    request: GetFollowCountRequest,
  ): Promise<GetFollowCountResponse> {
    return this.doPost<GetFollowCountRequest, GetFollowCountResponse>(
      "/user/getfollowercount",
      request,
    );
  }

  // ─── Follow ──────────────────────────────────────────────────────────────

  async getFollowees(
    request: PagedUserItemRequest,
  ): Promise<PagedUserItemResponse> {
    return this.doPost<PagedUserItemRequest, PagedUserItemResponse>(
      "/follow/getfollowees",
      request,
    );
  }

  async getFollowers(
    request: PagedUserItemRequest,
  ): Promise<PagedUserItemResponse> {
    return this.doPost<PagedUserItemRequest, PagedUserItemResponse>(
      "/follow/getfollowers",
      request,
    );
  }

  async follow(request: FollowActionRequest): Promise<VoidResponse> {
    return this.doPost<FollowActionRequest, VoidResponse>(
      "/follow/follow",
      request,
    );
  }

  async unfollow(request: FollowActionRequest): Promise<VoidResponse> {
    return this.doPost<FollowActionRequest, VoidResponse>(
      "/follow/unfollow",
      request,
    );
  }

  // ─── Status ──────────────────────────────────────────────────────────────

  async getFeedItems(
    request: PagedStatusItemRequest,
  ): Promise<PagedStatusItemResponse> {
    return this.doPost<PagedStatusItemRequest, PagedStatusItemResponse>(
      "/status/getfeeditems",
      request,
    );
  }

  async getStoryItems(
    request: PagedStatusItemRequest,
  ): Promise<PagedStatusItemResponse> {
    return this.doPost<PagedStatusItemRequest, PagedStatusItemResponse>(
      "/status/getstoryitems",
      request,
    );
  }

  async postStatus(request: PostStatusRequest): Promise<VoidResponse> {
    return this.doPost<PostStatusRequest, VoidResponse>(
      "/status/poststatus",
      request,
    );
  }
}

// Singleton — all services share a single instance
export default new ServerFacade();
