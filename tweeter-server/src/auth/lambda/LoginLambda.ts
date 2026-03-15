import type { LoginRequest, AuthResponse } from "tweeter-shared";
import { AuthService } from "../../model/service/AuthService.js";

export const handler = async (request: LoginRequest): Promise<AuthResponse> => {
  const authService = new AuthService();
  const [user, authToken] = await authService.login(
    request.alias,
    request.password,
  );

  return {
    success: true,
    message: null,
    user: user,
    authToken: authToken,
  };
};
