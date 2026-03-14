import { LogoutRequest, VoidResponse } from "tweeter-shared";
import { AuthService } from "../../model/service/AuthService.js";

export const handler = async (
  request: LogoutRequest,
): Promise<VoidResponse> => {
  const authService = new AuthService();
  await authService.logout(request.token);

  return {
    success: true,
    message: null,
  };
};
