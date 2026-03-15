import type { PostStatusRequest, VoidResponse } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService.js";

export const handler = async (
  request: PostStatusRequest,
): Promise<VoidResponse> => {
  const statusService = new StatusService();
  await statusService.postStatus(request.token, request.newStatus);

  return {
    success: true,
    message: null,
  };
};
