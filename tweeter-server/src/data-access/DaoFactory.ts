import type { UserDao } from "./UserDao.js";
import type { StatusDao } from "./StatusDao.js";
import type { FollowDao } from "./FollowDao.js";
import { DynamoDBUserDao } from "./DynamoDB/DynamoDBUserDao.js";
import { DynamoDBStatusDao } from "./DynamoDB/DynamoDBStatusDao.js";
import { DynamoDBFollowDao } from "./DynamoDB/DynamoDBFollowDao.js";

/**
 * DaoFactory is responsible for creating and providing access to DAO instances.
 * This centralizes the creation of data access objects and manages their lifecycle.
 */
export class DaoFactory {
  private static instance: DaoFactory;

  private userDao: DynamoDBUserDao;
  private statusDao: DynamoDBStatusDao;
  private followDao: DynamoDBFollowDao;

  private constructor() {
    this.userDao = new DynamoDBUserDao();
    this.statusDao = new DynamoDBStatusDao();
    this.followDao = new DynamoDBFollowDao();
  }

  public static getInstance(): DaoFactory {
    if (!DaoFactory.instance) {
      DaoFactory.instance = new DaoFactory();
    }
    return DaoFactory.instance;
  }

  /**
   * Initializes all DAOs.
   */
  public async initialize(): Promise<void> {
    await this.userDao.initialize();
    await this.statusDao.initialize();
    await this.followDao.initialize();
  }

  /**
   * Closes all DAOs and cleans up resources.
   */
  public async close(): Promise<void> {
    await this.userDao.close();
    await this.statusDao.close();
    await this.followDao.close();
  }

  public getUserDao(): UserDao {
    return this.userDao;
  }

  public getStatusDao(): StatusDao {
    return this.statusDao;
  }

  public getFollowDao(): FollowDao {
    return this.followDao;
  }
}
