import { TweeterRequest } from "./TweeterRequest.js";
import { StatusDto } from "../../dto/StatusDto.js";

export interface PostStatusRequest extends TweeterRequest {
  readonly newStatus: StatusDto;
}
