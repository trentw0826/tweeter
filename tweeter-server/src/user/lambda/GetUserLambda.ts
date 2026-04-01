import type { GetUserRequest, GetUserResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService.js";
import { createApiGatewayHandler } from "../../lambda/ApiGatewayAdapter.js";

const getUser = async (request: GetUserRequest): Promise<GetUserResponse> => {
  const userService = new UserService();
  const user = await userService.getUser(request.token, request.alias);

  return {
    success: true,
    message: null,
    user: user,
  };
};

export const handler = createApiGatewayHandler<GetUserRequest, GetUserResponse>(
  getUser,
);
