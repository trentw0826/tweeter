import { UserDto } from "../../dto/UserDto.js";
import { TweeterResponse } from "./TweeterResponse.js";

export interface PagedUserItemResponse extends TweeterResponse {
  readonly items: UserDto[] | null;
  readonly hasMore: boolean;
}
