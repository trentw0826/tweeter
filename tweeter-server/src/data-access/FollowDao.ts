import type { Dao } from "./Dao.js";

/**
 * FollowDao handles data access for Follow relationships.
 * Future implementation will connect to DynamoDB for follow operations.
 */
export interface FollowDao extends Dao {
  // TODO: Implement DynamoDB operations for follow relationships
  // - addFollow(followerAlias: string, followeeAlias: string): Promise<void>
  // - removeFollow(followerAlias: string, followeeAlias: string): Promise<void>
  // - getFollowers(userAlias: string): Promise<string[]>
  // - getFollowees(userAlias: string): Promise<string[]>
  // - isFollowing(followerAlias: string, followeeAlias: string): Promise<boolean>
}
