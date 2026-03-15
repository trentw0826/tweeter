import { PagedUserItemRequest, PagedUserItemResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService.js";

export const handler = async (
  request: PagedUserItemRequest,
): Promise<PagedUserItemResponse> => {
  const followService = new FollowService();
  const [items, hasMore] = await followService.retrievePageOfFollowers(
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
