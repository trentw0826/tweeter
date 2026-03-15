import { TweeterResponse } from "./TweeterResponse.js";

export interface GetFollowCountResponse extends TweeterResponse {
  readonly count: number;
}
