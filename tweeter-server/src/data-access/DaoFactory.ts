import type { UserDao } from "./UserDao.js";
import type { StatusDao } from "./StatusDao.js";
import type { FollowDao } from "./FollowDao.js";

/**
 * DaoFactory is responsible for creating and providing access to DAO instances.
 * This centralizes the creation of data access objects and manages their lifecycle.
 * Future implementation will handle DynamoDB client initialization and configuration.
 */
export class DaoFactory {
  private static instance: DaoFactory;

  private userDao: UserDao | null = null;
  private statusDao: StatusDao | null = null;
  private followDao: FollowDao | null = null;

  private constructor() {
    // TODO: Initialize DynamoDB client and DAOs
  }

  public static getInstance(): DaoFactory {
    if (!DaoFactory.instance) {
      DaoFactory.instance = new DaoFactory();
    }
    return DaoFactory.instance;
  }

  public getUserDao(): UserDao {
    if (!this.userDao) {
      throw new Error("UserDao not initialized");
    }
    return this.userDao;
  }

  public getStatusDao(): StatusDao {
    if (!this.statusDao) {
      throw new Error("StatusDao not initialized");
    }
    return this.statusDao;
  }

  public getFollowDao(): FollowDao {
    if (!this.followDao) {
      throw new Error("FollowDao not initialized");
    }
    return this.followDao;
  }
}
