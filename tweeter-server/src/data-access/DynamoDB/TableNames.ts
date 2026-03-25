export const TABLE_ENV = {
  users: "USERS_TABLE",
  authTokens: "AUTH_TOKENS_TABLE",
  follows: "FOLLOWS_TABLE",
  story: "STORY_TABLE",
  feed: "FEED_TABLE",
} as const;

export const TABLE_DEFAULT = {
  users: "tweeter-users",
  authTokens: "tweeter-auth-tokens",
  follows: "tweeter-follows",
  story: "tweeter-story",
  feed: "tweeter-feed",
} as const;

export const INDEX_NAMES = {
  followeeIndex: "FolloweeIndex",
} as const;
