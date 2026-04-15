import { useCallback, useMemo, useState } from "react";
import { User, AuthToken } from "tweeter-shared";
import { UserInfoContext, UserInfoActionsContext } from "./UserInfoContexts";
import { UserInfo } from "./UserInfo";
import {
  saveAuthSession,
  restoreAuthSession,
  clearAuthSession,
} from "../../session/AuthSession";

interface Props {
  children: React.ReactNode;
}

const UserInfoProvider: React.FC<Props> = ({ children }) => {
  const retrieveFromLocalStorage = (): UserInfo => {
    const { currentUser: loggedInUser, authToken } = restoreAuthSession();

    if (!!loggedInUser && !!authToken) {
      return {
        currentUser: loggedInUser,
        displayedUser: loggedInUser,
        authToken: authToken,
      };
    } else {
      return { currentUser: null, displayedUser: null, authToken: null };
    }
  };

  const [userInfo, setUserInfo] = useState({
    ...retrieveFromLocalStorage(),
  });

  const updateUserInfo = useCallback(
    (
      currentUser: User,
      displayedUser: User | null,
      authToken: AuthToken,
      remember: boolean = false,
    ) => {
      setUserInfo(() => {
        return {
          currentUser: currentUser,
          displayedUser: displayedUser,
          authToken: authToken,
        };
      });

      if (remember) {
        saveAuthSession(currentUser, authToken);
      }
    },
    [],
  );

  const clearUserInfo = useCallback(() => {
    setUserInfo(() => {
      return {
        currentUser: null,
        displayedUser: null,
        authToken: null,
      };
    });

    clearAuthSession();
  }, []);

  const setDisplayedUser = useCallback((user: User) => {
    setUserInfo((previous) => {
      return { ...previous, displayedUser: user };
    });
  }, []);

  const userInfoActions = useMemo(
    () => ({
      updateUserInfo,
      clearUserInfo,
      setDisplayedUser,
    }),
    [updateUserInfo, clearUserInfo, setDisplayedUser],
  );

  return (
    <UserInfoContext.Provider value={userInfo}>
      <UserInfoActionsContext.Provider value={userInfoActions}>
        {children}
      </UserInfoActionsContext.Provider>
    </UserInfoContext.Provider>
  );
};

export default UserInfoProvider;
