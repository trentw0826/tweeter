import type { UserDto } from "tweeter-shared";
import type { Dao } from "./Dao.js";

/**
 * UserDao handles data access for User entities.
 * Defines operations for user-related database interactions.
 */
export interface UserDao extends Dao {
  /**
   * Retrieves a user by their alias.
   * @param alias - The user's alias
   * @returns The user DTO or null if not found
   */
  getUser(alias: string): Promise<UserDto | null>;

  /**
   * Saves or updates a user.
   * @param user - The user DTO to save
   */
  createUser(user: UserDto, passwordHash: string): Promise<void>;

  /**
   * Deletes a user by their alias.
   * @param alias - The user's alias
   */
  deleteUser(alias: string): Promise<void>;

  getPasswordHash(alias: string): Promise<string | null>;

  createAuthToken(alias: string): Promise<string>;

  getAliasByAuthToken(token: string): Promise<string | null>;

  deleteAuthToken(token: string): Promise<void>;

  /**
   * Gets the follower count for a user.
   * @param alias - The user's alias
   * @returns The number of followers
   */
  getFollowerCount(alias: string): Promise<number>;

  /**
   * Gets the followee count for a user.
   * @param alias - The user's alias
   * @returns The number of followees
   */
  getFolloweeCount(alias: string): Promise<number>;

  updateFollowerCount(alias: string, delta: number): Promise<void>;

  updateFolloweeCount(alias: string, delta: number): Promise<void>;
}
