import type { PostStatusRequest, VoidResponse } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService.js";
import { createApiGatewayHandler } from "../../lambda/ApiGatewayAdapter.js";

const postStatus = async (
  request: PostStatusRequest,
): Promise<VoidResponse> => {
  const statusService = new StatusService();
  await statusService.postStatus(request.token, request.newStatus);

  return {
    success: true,
    message: null,
  };
};

export const handler = createApiGatewayHandler<PostStatusRequest, VoidResponse>(
  postStatus,
);
