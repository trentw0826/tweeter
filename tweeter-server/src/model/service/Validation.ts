import type { StatusDto, UserDto } from "tweeter-shared";

const BAD_REQUEST_PREFIX = "[bad-request]";

export function throwBadRequest(message: string): never {
  throw new Error(`${BAD_REQUEST_PREFIX} ${message}`);
}

export function assertNonEmptyString(
  value: unknown,
  fieldName: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throwBadRequest(`Invalid ${fieldName}`);
  }
}

export function normalizeAlias(alias: string): string {
  const trimmed = alias.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function assertAlias(
  value: unknown,
  fieldName = "alias",
): asserts value is string {
  assertNonEmptyString(value, fieldName);

  const trimmed = value.trim();
  if (!trimmed.startsWith("@") || trimmed.length < 2) {
    throwBadRequest(`Invalid ${fieldName}`);
  }
}

export function assertToken(token: unknown): asserts token is string {
  assertNonEmptyString(token, "token");
}

export function assertPageSize(pageSize: unknown): asserts pageSize is number {
  if (
    typeof pageSize !== "number" ||
    !Number.isInteger(pageSize) ||
    pageSize <= 0
  ) {
    throwBadRequest("Invalid pageSize");
  }
}

export function assertUserDto(
  user: UserDto | null | undefined,
  fieldName = "user",
): asserts user is UserDto {
  if (user === null || user === undefined || typeof user !== "object") {
    throwBadRequest(`Invalid ${fieldName}`);
  }

  assertNonEmptyString(user.firstName, `${fieldName}.firstName`);
  assertNonEmptyString(user.lastName, `${fieldName}.lastName`);
  assertAlias(user.alias, `${fieldName}.alias`);
  assertNonEmptyString(user.imageUrl, `${fieldName}.imageUrl`);
}

export function assertStatusDto(
  status: StatusDto | null | undefined,
  fieldName = "status",
): asserts status is StatusDto {
  if (status === null || status === undefined || typeof status !== "object") {
    throwBadRequest(`Invalid ${fieldName}`);
  }

  assertNonEmptyString(status.post, `${fieldName}.post`);
  assertUserDto(status.user, `${fieldName}.user`);

  if (
    typeof status.timestamp !== "number" ||
    !Number.isFinite(status.timestamp)
  ) {
    throwBadRequest(`Invalid ${fieldName}.timestamp`);
  }
}
