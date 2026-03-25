import type { UserDto } from "tweeter-shared";
import type { Dao } from "./Dao.js";

/**
 * UserDao handles data access for User entities.
 * Future implementation will connect to DynamoDB for user operations.
 */
export interface UserDao extends Dao {
  // TODO: Implement DynamoDB operations for users
  // - getUser(alias: string): Promise<UserDto | null>
  // - saveUser(user: UserDto): Promise<void>
  // - deleteUser(alias: string): Promise<void>
}
