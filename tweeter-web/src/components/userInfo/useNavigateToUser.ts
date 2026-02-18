import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthToken, User } from "tweeter-shared";
import { useUserInfo, useUserInfoActions } from "../userInfo/userInfoHooks";
import { useMessageActions } from "../toaster/messageHooks";
import {
  NavigateToUserPresenter,
  NavigateToUserView,
} from "../../presenter/NavigateToUserPresenter";

interface NavigateToUserReturn {
  navigateToUser: (event: React.MouseEvent) => Promise<void>;
}

export const useNavigateToUser = (
  featurePath: string,
): NavigateToUserReturn => {
  const { displayErrorMessage } = useMessageActions();
  const { displayedUser, authToken } = useUserInfo();
  const { setDisplayedUser } = useUserInfoActions();
  const navigate = useNavigate();

  const listener: NavigateToUserView = {
    displayErrorMessage: (message: string) => displayErrorMessage(message),
    setDisplayedUser: (user: User) => setDisplayedUser(user),
    navigateTo: (path: string) => navigate(path),
  };

  const presenterRef = useRef<NavigateToUserPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = new NavigateToUserPresenter(listener);
  }

  const navigateToUser = async (event: React.MouseEvent): Promise<void> => {
    event.preventDefault();

    await presenterRef.current!.navigateToUser(
      event.target.toString(),
      authToken!,
      displayedUser!,
      featurePath,
    );
  };

  return { navigateToUser };
};
