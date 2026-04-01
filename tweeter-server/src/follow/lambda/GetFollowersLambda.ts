import type {
  PagedUserItemRequest,
  PagedUserItemResponse,
} from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService.js";
import { createApiGatewayHandler } from "../../lambda/ApiGatewayAdapter.js";

const getFollowers = async (
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

export const handler = createApiGatewayHandler<
  PagedUserItemRequest,
  PagedUserItemResponse
>(getFollowers);
