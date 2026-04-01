import type { LoginRequest, AuthResponse } from "tweeter-shared";
import { AuthService } from "../../model/service/AuthService.js";
import { createApiGatewayHandler } from "../../lambda/ApiGatewayAdapter.js";
import {
  assertNonEmptyString,
  normalizeAlias,
} from "../../model/service/Validation.js";

const login = async (request: LoginRequest): Promise<AuthResponse> => {
  assertNonEmptyString(request.alias, "alias");
  assertNonEmptyString(request.password, "password");

  const alias = normalizeAlias(request.alias);
  const authService = new AuthService();
  const [user, authToken] = await authService.login(alias, request.password);

  return {
    success: true,
    message: null,
    user: user,
    authToken: authToken,
  };
};

export const handler = createApiGatewayHandler<LoginRequest, AuthResponse>(
  login,
);
