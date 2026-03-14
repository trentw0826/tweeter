import { TweeterRequest } from "./TweeterRequest.js";
import { UserDto } from "../../dto/UserDto.js";

export interface FollowActionRequest extends TweeterRequest {
  readonly user: UserDto;
}
