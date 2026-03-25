import type { UserDao } from "./UserDao.js";
import type { StatusDao } from "./StatusDao.js";
import type { FollowDao } from "./FollowDao.js";
import type { BucketDao } from "./BucketDao.js";
import { DynamoDBUserDao } from "./DynamoDB/DynamoDBUserDao.js";
import { DynamoDBStatusDao } from "./DynamoDB/DynamoDBStatusDao.js";
import { DynamoDBFollowDao } from "./DynamoDB/DynamoDBFollowDao.js";
import { AWSS3Dao } from "./DynamoDB/AWSS3Dao.js";

export interface DaoDependencies {
  userDao: UserDao;
  statusDao: StatusDao;
  followDao: FollowDao;
  bucketDao: BucketDao;
}

function defaultDependencies(): DaoDependencies {
  return {
    userDao: new DynamoDBUserDao(),
    statusDao: new DynamoDBStatusDao(),
    followDao: new DynamoDBFollowDao(),
    bucketDao: new AWSS3Dao(),
  };
}

/**
 * DaoFactory is responsible for creating and providing access to DAO instances.
 * This centralizes the creation of data access objects and manages their lifecycle.
 */
export class DaoFactory {
  private static instance: DaoFactory;

  private readonly userDao: UserDao;
  private readonly statusDao: StatusDao;
  private readonly followDao: FollowDao;
  private readonly bucketDao: BucketDao;

  public constructor(dependencies: DaoDependencies = defaultDependencies()) {
    this.userDao = dependencies.userDao;
    this.statusDao = dependencies.statusDao;
    this.followDao = dependencies.followDao;
    this.bucketDao = dependencies.bucketDao;
  }

  public static configureInstance(dependencies: DaoDependencies): void {
    DaoFactory.instance = new DaoFactory(dependencies);
  }

  public static getInstance(): DaoFactory {
    if (!DaoFactory.instance) {
      DaoFactory.instance = new DaoFactory();
    }
    return DaoFactory.instance;
  }

  public static resetInstance(): void {
    DaoFactory.instance = new DaoFactory();
  }

  /**
   * Initializes all DAOs.
   */
  public async initialize(): Promise<void> {
    await this.userDao.initialize();
    await this.statusDao.initialize();
    await this.followDao.initialize();
    await this.bucketDao.initialize();
  }

  /**
   * Closes all DAOs and cleans up resources.
   */
  public async close(): Promise<void> {
    await this.userDao.close();
    await this.statusDao.close();
    await this.followDao.close();
    await this.bucketDao.close();
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

  public getBucketDao(): BucketDao {
    return this.bucketDao;
  }
}
