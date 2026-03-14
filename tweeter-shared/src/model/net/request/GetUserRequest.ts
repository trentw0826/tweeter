import { TweeterRequest } from "./TweeterRequest.js";

export interface GetUserRequest extends TweeterRequest {
  readonly alias: string;
}
