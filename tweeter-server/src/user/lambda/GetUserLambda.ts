import { GetUserRequest, GetUserResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService.js";

export const handler = async (
  request: GetUserRequest,
): Promise<GetUserResponse> => {
  const userService = new UserService();
  const user = await userService.getUser(request.token, request.alias);

  return {
    success: true,
    message: null,
    user: user,
  };
};
