import { TweeterResponse } from "./TweeterResponse.js";
import { UserDto } from "../../dto/UserDto.js";
import { AuthTokenDto } from "../../dto/AuthTokenDto.js";

export interface AuthResponse extends TweeterResponse {
  readonly user: UserDto | null;
  readonly authToken: AuthTokenDto | null;
}
