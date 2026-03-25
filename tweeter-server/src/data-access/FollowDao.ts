import type { Dao } from "./Dao.js";

/**
 * FollowDao handles data access for Follow relationships.
 * Defines operations for managing follower/followee relationships.
 */
export interface FollowDao extends Dao {
  /**
   * Adds a follow relationship.
   * @param followerAlias - The follower's alias
   * @param followeeAlias - The followee's alias
   */
  addFollow(followerAlias: string, followeeAlias: string): Promise<void>;

  /**
   * Removes a follow relationship.
   * @param followerAlias - The follower's alias
   * @param followeeAlias - The followee's alias
   */
  removeFollow(followerAlias: string, followeeAlias: string): Promise<void>;

  /**
   * Retrieves all followers of a user.
   * @param userAlias - The user's alias
   * @returns Array of follower aliases
   */
  getFollowers(userAlias: string): Promise<string[]>;

  /**
   * Retrieves all users that a user is following.
   * @param userAlias - The user's alias
   * @returns Array of followee aliases
   */
  getFollowees(userAlias: string): Promise<string[]>;

  /**
   * Checks if one user is following another.
   * @param followerAlias - The potential follower's alias
   * @param followeeAlias - The potential followee's alias
   * @returns True if followerAlias follows followeeAlias
   */
  isFollowing(followerAlias: string, followeeAlias: string): Promise<boolean>;
}
