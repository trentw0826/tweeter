import { useContext } from "react";
import {
  UserInfoContext,
  UserInfoActionsContext,
  UserInfoActions,
} from "./UserInfoContexts";
import { UserInfo } from "./UserInfo";

export const useUserInfo = (): UserInfo => {
  return useContext(UserInfoContext);
};

export const useUserInfoActions = (): UserInfoActions => {
  return useContext(UserInfoActionsContext);
};
