import type {
  GetFollowCountRequest,
  GetFollowCountResponse,
} from "tweeter-shared";
import { UserService } from "../../model/service/UserService.js";
import { createApiGatewayHandler } from "../../lambda/ApiGatewayAdapter.js";

const getFollowerCount = async (
  request: GetFollowCountRequest,
): Promise<GetFollowCountResponse> => {
  const userService = new UserService();
  const count = await userService.getFollowerCount(request.token, request.user);

  return {
    success: true,
    message: null,
    count: count,
  };
};

export const handler = createApiGatewayHandler<
  GetFollowCountRequest,
  GetFollowCountResponse
>(getFollowerCount);
