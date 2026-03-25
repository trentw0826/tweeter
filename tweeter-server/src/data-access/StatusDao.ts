import type { StatusDto } from "tweeter-shared";
import type { Dao } from "./Dao.js";

/**
 * StatusDao handles data access for Status entities.
 * Future implementation will connect to DynamoDB for status operations.
 */
export interface StatusDao extends Dao {
  // TODO: Implement DynamoDB operations for statuses
  // - getStatus(statusId: string): Promise<StatusDto | null>
  // - saveStatus(status: StatusDto): Promise<void>
  // - deleteStatus(statusId: string): Promise<void>
  // - getStatusesByUser(userAlias: string): Promise<StatusDto[]>
}
