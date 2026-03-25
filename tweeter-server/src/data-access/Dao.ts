/**
 * Base Data Access Object interface.
 * Defines the contract for all data access operations.
 */
export interface Dao {
  /**
   * Initializes the DAO and establishes connection to the database.
   */
  initialize(): Promise<void>;

  /**
   * Closes the DAO and cleans up resources.
   */
  close(): Promise<void>;
}
