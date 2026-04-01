import type { LogoutRequest, VoidResponse } from "tweeter-shared";
import { AuthService } from "../../model/service/AuthService.js";
import { createApiGatewayHandler } from "../../lambda/ApiGatewayAdapter.js";

const logout = async (request: LogoutRequest): Promise<VoidResponse> => {
  const authService = new AuthService();
  await authService.logout(request.token);

  return {
    success: true,
    message: null,
  };
};

export const handler = createApiGatewayHandler<LogoutRequest, VoidResponse>(
  logout,
);
