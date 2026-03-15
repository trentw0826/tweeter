import { TweeterRequest } from "./TweeterRequest.js";
import { StatusDto } from "../../dto/StatusDto.js";

export interface PagedStatusItemRequest extends TweeterRequest {
  readonly userAlias: string;
  readonly pageSize: number;
  readonly lastItem: StatusDto | null;
}
