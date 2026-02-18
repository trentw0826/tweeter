import "./UserInfoComponent.css";
import { useUserInfo, useUserInfoActions } from "./userInfoHooks";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMessageActions } from "../toaster/messageHooks";
import { User } from "tweeter-shared";
import {
  UserInfoPresenter,
  UserInfoView,
} from "../../presenter/UserInfoPresenter";

const UserInfo = () => {
  const [isFollower, setIsFollower] = useState(false);
  const [followeeCount, setFolloweeCount] = useState(-1);
  const [followerCount, setFollowerCount] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const { displayInfoMessage, displayErrorMessage, deleteMessage } =
    useMessageActions();

  const { currentUser, authToken, displayedUser } = useUserInfo();
  const { setDisplayedUser } = useUserInfoActions();
  const navigate = useNavigate();
  const location = useLocation();

  const listener: UserInfoView = {
    displayInfoMessage: (
      message: string,
      duration: number,
      bootstrapClasses?: string,
    ) => displayInfoMessage(message, duration, bootstrapClasses),
    displayErrorMessage: (message: string) => displayErrorMessage(message),
    deleteMessage: (toastId: string) => deleteMessage(toastId),
    setIsFollower: (value: boolean) => setIsFollower(value),
    setFolloweeCount: (count: number) => setFolloweeCount(count),
    setFollowerCount: (count: number) => setFollowerCount(count),
    setIsLoading: (value: boolean) => setIsLoading(value),
    setDisplayedUser: (user: User) => setDisplayedUser(user),
    navigateTo: (path: string) => navigate(path),
  };

  const presenterRef = useRef<UserInfoPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = new UserInfoPresenter(listener);
  }

  if (!displayedUser) {
    setDisplayedUser(currentUser!);
  }

  useEffect(() => {
    presenterRef.current!.loadFollowerStatus(
      authToken!,
      currentUser!,
      displayedUser!,
    );
    presenterRef.current!.loadFolloweeCount(authToken!, displayedUser!);
    presenterRef.current!.loadFollowerCount(authToken!, displayedUser!);
  }, [displayedUser]);

  const switchToLoggedInUser = (event: React.MouseEvent): void => {
    event.preventDefault();
    setDisplayedUser(currentUser!);
    const baseUrl = presenterRef.current!.getBaseUrl(location.pathname);
    navigate(`${baseUrl}/${currentUser!.alias}`);
  };

  const followDisplayedUser = async (
    event: React.MouseEvent,
  ): Promise<void> => {
    event.preventDefault();
    await presenterRef.current!.follow(authToken!, displayedUser!);
  };

  const unfollowDisplayedUser = async (
    event: React.MouseEvent,
  ): Promise<void> => {
    event.preventDefault();
    await presenterRef.current!.unfollow(authToken!, displayedUser!);
  };

  return (
    <>
      {currentUser === null || displayedUser === null || authToken === null ? (
        <></>
      ) : (
        <div className="container">
          <div className="row">
            <div className="col-auto p-3">
              <img
                src={displayedUser.imageUrl}
                className="img-fluid"
                width="100"
                alt="Posting user"
              />
            </div>
            <div className="col p-3">
              {!displayedUser.equals(currentUser) && (
                <p id="returnToLoggedInUser">
                  Return to{" "}
                  <Link
                    to={`./${currentUser.alias}`}
                    onClick={switchToLoggedInUser}
                  >
                    logged in user
                  </Link>
                </p>
              )}
              <h2>
                <b>{displayedUser.name}</b>
              </h2>
              <h3>{displayedUser.alias}</h3>
              <br />
              {followeeCount > -1 && followerCount > -1 && (
                <div>
                  Followees: {followeeCount} Followers: {followerCount}
                </div>
              )}
            </div>
            <form>
              {!displayedUser.equals(currentUser) && (
                <div className="form-group">
                  {isFollower ? (
                    <button
                      id="unFollowButton"
                      className="btn btn-md btn-secondary me-1"
                      type="submit"
                      style={{ width: "6em" }}
                      onClick={unfollowDisplayedUser}
                    >
                      {isLoading ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : (
                        <div>Unfollow</div>
                      )}
                    </button>
                  ) : (
                    <button
                      id="followButton"
                      className="btn btn-md btn-primary me-1"
                      type="submit"
                      style={{ width: "6em" }}
                      onClick={followDisplayedUser}
                    >
                      {isLoading ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : (
                        <div>Follow</div>
                      )}
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UserInfo;
