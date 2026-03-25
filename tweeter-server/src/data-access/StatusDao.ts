import type { StatusDto } from "tweeter-shared";
import type { Dao } from "./Dao.js";

/**
 * StatusDao handles data access for Status entities.
 * Defines operations for status-related database interactions.
 */
export interface StatusDao extends Dao {
  /**
   * Retrieves a status by its ID.
   * @param statusId - The status ID
   * @returns The status DTO or null if not found
   */
  getStatus(statusId: string): Promise<StatusDto | null>;

  /**
   * Saves or updates a status.
   * @param status - The status DTO to save
   */
  saveStatus(status: StatusDto): Promise<void>;

  /**
   * Deletes a status by its ID.
   * @param statusId - The status ID
   */
  deleteStatus(statusId: string): Promise<void>;

  /**
   * Retrieves all statuses for a specific user.
   * @param userAlias - The user's alias
   * @returns Array of status DTOs
   */
  getStatusesByUser(userAlias: string): Promise<StatusDto[]>;
}
