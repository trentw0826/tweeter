import type { IsFollowerRequest, IsFollowerResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService.js";
import { createApiGatewayHandler } from "../../lambda/ApiGatewayAdapter.js";

const isFollower = async (
  request: IsFollowerRequest,
): Promise<IsFollowerResponse> => {
  const userService = new UserService();
  const isFollower = await userService.isFollower(
    request.token,
    request.user,
    request.selectedUser,
  );

  return {
    success: true,
    message: null,
    isFollower: isFollower,
  };
};

export const handler = createApiGatewayHandler<
  IsFollowerRequest,
  IsFollowerResponse
>(isFollower);
