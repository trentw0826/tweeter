import { TweeterResponse } from "./TweeterResponse.js";
import { UserDto } from "../../dto/UserDto.js";

export interface GetUserResponse extends TweeterResponse {
  readonly user: UserDto | null;
}
