import type { FollowActionRequest, VoidResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService.js";
import { createApiGatewayHandler } from "../../lambda/ApiGatewayAdapter.js";

const unfollow = async (
  request: FollowActionRequest,
): Promise<VoidResponse> => {
  const followService = new FollowService();
  await followService.unfollow(request.token, request.user);

  return {
    success: true,
    message: null,
  };
};

export const handler = createApiGatewayHandler<
  FollowActionRequest,
  VoidResponse
>(unfollow);
