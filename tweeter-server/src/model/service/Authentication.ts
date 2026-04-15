import type { UserDao } from "../../data-access/index.js";
import { assertToken } from "./Validation.js";

/**
 * Validates an auth token and returns the authenticated user's alias.
 * Throws an unauthorized error when the token is invalid or inactive.
 */
export async function requireAuthenticatedAlias(
  userDao: UserDao,
  token: string,
): Promise<string> {
  assertToken(token);

  const alias = await userDao.getAliasByAuthToken(token);
  if (alias === null) {
    throw new Error("[unauthorized] Invalid auth token");
  }

  return alias;
}
