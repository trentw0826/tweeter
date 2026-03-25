import type { UserDao } from "./UserDao.js";
import type { StatusDao } from "./StatusDao.js";
import type { FollowDao } from "./FollowDao.js";
import type { BucketDao } from "./BucketDao.js";
import { DynamoDBUserDao } from "./DynamoDB/DynamoDBUserDao.js";
import { DynamoDBStatusDao } from "./DynamoDB/DynamoDBStatusDao.js";
import { DynamoDBFollowDao } from "./DynamoDB/DynamoDBFollowDao.js";
import { AWSS3Dao } from "./DynamoDB/AWSS3Dao.js";

/**
 * DaoFactory is responsible for creating and providing access to DAO instances.
 * This centralizes the creation of data access objects and manages their lifecycle.
 */
export class DaoFactory {
  private static instance: DaoFactory;

  private userDao: DynamoDBUserDao;
  private statusDao: DynamoDBStatusDao;
  private followDao: DynamoDBFollowDao;
  private s3Dao: AWSS3Dao;

  private constructor() {
    this.userDao = new DynamoDBUserDao();
    this.statusDao = new DynamoDBStatusDao();
    this.followDao = new DynamoDBFollowDao();
    this.s3Dao = new AWSS3Dao();
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
    await this.s3Dao.initialize();
  }

  /**
   * Closes all DAOs and cleans up resources.
   */
  public async close(): Promise<void> {
    await this.userDao.close();
    await this.statusDao.close();
    await this.followDao.close();
    await this.s3Dao.close();
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

  public getS3Dao(): BucketDao {
    return this.s3Dao;
  }
}
