import { TweeterRequest } from "./TweeterRequest.js";
import { UserDto } from "../../dto/UserDto.js";

export interface GetFollowCountRequest extends TweeterRequest {
  readonly user: UserDto;
}
