import type { RegisterRequest, AuthResponse } from "tweeter-shared";
import { AuthService } from "../../model/service/AuthService.js";
import { createApiGatewayHandler } from "../../lambda/ApiGatewayAdapter.js";
import {
  assertNonEmptyString,
  normalizeAlias,
} from "../../model/service/Validation.js";

const registerUser = async (
  request: RegisterRequest,
): Promise<AuthResponse> => {
  assertNonEmptyString(request.firstName, "firstName");
  assertNonEmptyString(request.lastName, "lastName");
  assertNonEmptyString(request.alias, "alias");
  assertNonEmptyString(request.password, "password");
  assertNonEmptyString(request.userImageBytes, "userImageBytes");
  assertNonEmptyString(request.imageFileExtension, "imageFileExtension");

  const alias = normalizeAlias(request.alias);
  const authService = new AuthService();
  const [user, authToken] = await authService.register(
    request.firstName,
    request.lastName,
    alias,
    request.password,
    request.userImageBytes,
    request.imageFileExtension,
  );

  return {
    success: true,
    message: null,
    user: user,
    authToken: authToken,
  };
};

export const handler = createApiGatewayHandler<RegisterRequest, AuthResponse>(
  registerUser,
);
