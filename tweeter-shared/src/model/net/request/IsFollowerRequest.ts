import { TweeterRequest } from "./TweeterRequest.js";
import { UserDto } from "../../dto/UserDto.js";

export interface IsFollowerRequest extends TweeterRequest {
  readonly user: UserDto;
  readonly selectedUser: UserDto;
}
