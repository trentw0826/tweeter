import type { PostStatusRequest, VoidResponse } from "tweeter-shared";
import { AWSSqsPublisher } from "../../data-access/index.js";
import { StatusService } from "../../model/service/StatusService.js";

type PostStatusQueueMessage = {
  status: PostStatusRequest["newStatus"];
};

export const handler = async (
  request: PostStatusRequest,
): Promise<VoidResponse> => {
  const statusService = new StatusService();
  await statusService.postStatus(request.token, request.newStatus);

  const queueUrl = process.env.POST_STATUS_QUEUE_URL;
  if (queueUrl === undefined || queueUrl.trim().length === 0) {
    throw new Error("Missing POST_STATUS_QUEUE_URL configuration");
  }

  const sqsPublisher = new AWSSqsPublisher();
  const payload: PostStatusQueueMessage = {
    status: request.newStatus,
  };

  await sqsPublisher.sendMessage(queueUrl, JSON.stringify(payload));

  return {
    success: true,
    message: null,
  };
};
