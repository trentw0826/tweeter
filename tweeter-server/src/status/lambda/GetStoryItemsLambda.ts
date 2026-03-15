import { PagedStatusItemRequest, PagedStatusItemResponse } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService.js";

export const handler = async (
  request: PagedStatusItemRequest,
): Promise<PagedStatusItemResponse> => {
  const statusService = new StatusService();
  const [items, hasMore] = await statusService.retrievePageOfStoryItems(
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
