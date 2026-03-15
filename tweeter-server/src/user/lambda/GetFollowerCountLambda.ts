import { GetFollowCountRequest, GetFollowCountResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService.js";

export const handler = async (
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
