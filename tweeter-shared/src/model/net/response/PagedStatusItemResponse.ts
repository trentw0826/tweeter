import { TweeterResponse } from "./TweeterResponse.js";
import { StatusDto } from "../../dto/StatusDto.js";

export interface PagedStatusItemResponse extends TweeterResponse {
  readonly items: StatusDto[] | null;
  readonly hasMore: boolean;
}
