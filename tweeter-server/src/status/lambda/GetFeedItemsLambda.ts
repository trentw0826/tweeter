import type {
  PagedStatusItemRequest,
  PagedStatusItemResponse,
} from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService.js";
import { createApiGatewayHandler } from "../../lambda/ApiGatewayAdapter.js";

const getFeedItems = async (
  request: PagedStatusItemRequest,
): Promise<PagedStatusItemResponse> => {
  const statusService = new StatusService();
  const [items, hasMore] = await statusService.retrievePageOfFeedItems(
    request.token,
    request.userAlias,
    request.pageSize,
    request.lastItem,
  );

  return {
    success: true,
    message: null,
    items: items,
    hasMore: hasMore,
  };
};

export const handler = createApiGatewayHandler<
  PagedStatusItemRequest,
  PagedStatusItemResponse
>(getFeedItems);
