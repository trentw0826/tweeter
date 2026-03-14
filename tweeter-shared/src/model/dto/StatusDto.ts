import { UserDto } from "./UserDto.js";

export interface StatusDto {
  readonly post: string;
  readonly user: UserDto;
  readonly timestamp: number;
}
