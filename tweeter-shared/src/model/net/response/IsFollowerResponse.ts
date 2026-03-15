import { TweeterResponse } from "./TweeterResponse.js";

export interface IsFollowerResponse extends TweeterResponse {
  readonly isFollower: boolean;
}
