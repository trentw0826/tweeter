import { ServerFacade } from "../../src/network/ServerFacade";
import { handleUnauthorizedSession } from "../../src/session/AuthSession";

jest.mock("../../src/session/AuthSession", () => ({
  handleUnauthorizedSession: jest.fn(),
}));

describe("ServerFacade", () => {
  const baseUrl = "https://api.example.com/prod";
  const userDto = {
    firstName: "Test",
    lastName: "User",
    alias: "@testuser",
    imageUrl: "https://example.com/profile.png",
  };
  const authTokenDto = {
    token: "token-123",
    timestamp: 1700000000000,
  };
  const statusDto = {
    post: "Hello, Tweeter!",
    user: userDto,
    timestamp: 1700000001000,
  };

  let facade: ServerFacade;
  let fetchMock: jest.Mock;

  const mockFetchResponse = (
    ok: boolean,
    status: number,
    payload: unknown,
  ) => ({
    ok,
    status,
    json: jest.fn().mockResolvedValue(payload),
  });

  beforeEach(() => {
    fetchMock = jest.fn();
    Object.defineProperty(globalThis, "fetch", {
      writable: true,
      value: fetchMock,
    });

    facade = new ServerFacade(baseUrl);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const expectPostRequest = (endpoint: string, request: unknown) => {
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  };

  it("throws when constructed without a configured API base URL", () => {
    expect(() => new ServerFacade(undefined)).toThrow(
      "API base URL not set. Please set VITE_API_BASE_URL in your .env file.",
    );
  });

  it.each([
    {
      name: "login",
      endpoint: "/auth/login",
      request: { alias: "@testuser", password: "password" },
      response: {
        success: true,
        message: null,
        user: userDto,
        authToken: authTokenDto,
      },
      call: (serverFacade: ServerFacade) =>
        serverFacade.login({ alias: "@testuser", password: "password" }),
    },
    {
      name: "register",
      endpoint: "/auth/register",
      request: {
        firstName: "Test",
        lastName: "User",
        alias: "@testuser",
        password: "password",
        userImageBytes: "ZmFrZS1pbWFnZQ==",
        imageFileExtension: "png",
      },
      response: {
        success: true,
        message: null,
        user: userDto,
        authToken: authTokenDto,
      },
      call: (serverFacade: ServerFacade) =>
        serverFacade.register({
          firstName: "Test",
          lastName: "User",
          alias: "@testuser",
          password: "password",
          userImageBytes: "ZmFrZS1pbWFnZQ==",
          imageFileExtension: "png",
        }),
    },
    {
      name: "logout",
      endpoint: "/auth/logout",
      request: { token: "token-123" },
      response: { success: true, message: null },
      call: (serverFacade: ServerFacade) =>
        serverFacade.logout({ token: "token-123" }),
    },
    {
      name: "getUser",
      endpoint: "/user/get",
      request: { token: "token-123", alias: "@testuser" },
      response: { success: true, message: null, user: userDto },
      call: (serverFacade: ServerFacade) =>
        serverFacade.getUser({ token: "token-123", alias: "@testuser" }),
    },
    {
      name: "isFollower",
      endpoint: "/user/isfollower",
      request: { token: "token-123", user: userDto, selectedUser: userDto },
      response: { success: true, message: null, isFollower: true },
      call: (serverFacade: ServerFacade) =>
        serverFacade.isFollower({
          token: "token-123",
          user: userDto,
          selectedUser: userDto,
        }),
    },
    {
      name: "getFolloweeCount",
      endpoint: "/user/getfolloweecount",
      request: { token: "token-123", user: userDto },
      response: { success: true, message: null, count: 12 },
      call: (serverFacade: ServerFacade) =>
        serverFacade.getFolloweeCount({ token: "token-123", user: userDto }),
    },
    {
      name: "getFollowerCount",
      endpoint: "/user/getfollowercount",
      request: { token: "token-123", user: userDto },
      response: { success: true, message: null, count: 34 },
      call: (serverFacade: ServerFacade) =>
        serverFacade.getFollowerCount({ token: "token-123", user: userDto }),
    },
    {
      name: "getFollowees",
      endpoint: "/follow/getfollowees",
      request: {
        token: "token-123",
        userAlias: "@testuser",
        pageSize: 10,
        lastItem: null,
      },
      response: {
        success: true,
        message: null,
        items: [userDto],
        hasMore: true,
      },
      call: (serverFacade: ServerFacade) =>
        serverFacade.getFollowees({
          token: "token-123",
          userAlias: "@testuser",
          pageSize: 10,
          lastItem: null,
        }),
    },
    {
      name: "getFollowers",
      endpoint: "/follow/getfollowers",
      request: {
        token: "token-123",
        userAlias: "@testuser",
        pageSize: 10,
        lastItem: userDto,
      },
      response: {
        success: true,
        message: null,
        items: [userDto],
        hasMore: false,
      },
      call: (serverFacade: ServerFacade) =>
        serverFacade.getFollowers({
          token: "token-123",
          userAlias: "@testuser",
          pageSize: 10,
          lastItem: userDto,
        }),
    },
    {
      name: "follow",
      endpoint: "/follow/follow",
      request: { token: "token-123", user: userDto },
      response: { success: true, message: null },
      call: (serverFacade: ServerFacade) =>
        serverFacade.follow({ token: "token-123", user: userDto }),
    },
    {
      name: "unfollow",
      endpoint: "/follow/unfollow",
      request: { token: "token-123", user: userDto },
      response: { success: true, message: null },
      call: (serverFacade: ServerFacade) =>
        serverFacade.unfollow({ token: "token-123", user: userDto }),
    },
    {
      name: "getFeedItems",
      endpoint: "/status/getfeeditems",
      request: {
        token: "token-123",
        userAlias: "@testuser",
        pageSize: 5,
        lastItem: statusDto,
      },
      response: {
        success: true,
        message: null,
        items: [statusDto],
        hasMore: true,
      },
      call: (serverFacade: ServerFacade) =>
        serverFacade.getFeedItems({
          token: "token-123",
          userAlias: "@testuser",
          pageSize: 5,
          lastItem: statusDto,
        }),
    },
    {
      name: "getStoryItems",
      endpoint: "/status/getstoryitems",
      request: {
        token: "token-123",
        userAlias: "@testuser",
        pageSize: 5,
        lastItem: null,
      },
      response: {
        success: true,
        message: null,
        items: [statusDto],
        hasMore: false,
      },
      call: (serverFacade: ServerFacade) =>
        serverFacade.getStoryItems({
          token: "token-123",
          userAlias: "@testuser",
          pageSize: 5,
          lastItem: null,
        }),
    },
    {
      name: "postStatus",
      endpoint: "/status/poststatus",
      request: { token: "token-123", newStatus: statusDto },
      response: { success: true, message: null },
      call: (serverFacade: ServerFacade) =>
        serverFacade.postStatus({ token: "token-123", newStatus: statusDto }),
    },
  ])(
    "sends a POST request for $name and returns the parsed response",
    async ({ endpoint, request, response, call }) => {
      fetchMock.mockResolvedValue(mockFetchResponse(true, 200, response));

      const result = await call(facade);

      expectPostRequest(endpoint, request);
      expect(result).toEqual(response);
    },
  );

  it("throws the server error message when the HTTP response is not ok", async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse(false, 400, { error: "Bad request" }),
    );

    await expect(
      facade.login({ alias: "@testuser", password: "password" }),
    ).rejects.toThrow("Bad request");
  });

  it("falls back to the HTTP status when a non-ok response has no error message", async () => {
    fetchMock.mockResolvedValue(mockFetchResponse(false, 500, {}));

    await expect(
      facade.login({ alias: "@testuser", password: "password" }),
    ).rejects.toThrow("Server error: 500");
  });

  it("handles unauthorized responses by triggering centralized session recovery", async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse(false, 401, { error: "Invalid auth token" }),
    );

    await expect(
      facade.login({ alias: "@testuser", password: "password" }),
    ).rejects.toThrow("Invalid auth token");

    expect(handleUnauthorizedSession).toHaveBeenCalledTimes(1);
  });

  it("throws the response message when the server returns success false", async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse(true, 200, {
        success: false,
        message: "Operation failed",
      }),
    );

    await expect(
      facade.login({ alias: "@testuser", password: "password" }),
    ).rejects.toThrow("Operation failed");
  });

  it("falls back to a generic message when success is false and no message is returned", async () => {
    fetchMock.mockResolvedValue(
      mockFetchResponse(true, 200, {
        success: false,
        message: null,
      }),
    );

    await expect(
      facade.login({ alias: "@testuser", password: "password" }),
    ).rejects.toThrow("Unknown server error");
  });
});
