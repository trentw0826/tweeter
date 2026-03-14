import { TweeterResponse } from "./TweeterResponse.js";

// Used for operations that have no meaningful return value:
// logout, follow, unfollow, postStatus
export interface VoidResponse extends TweeterResponse {}
