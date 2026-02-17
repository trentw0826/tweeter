import { useState, useEffect, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useParams } from "react-router-dom";
import { User, AuthToken } from "tweeter-shared";
import { useMessageActions } from "../toaster/messageHooks";
import { useUserInfo, useUserInfoActions } from "../userInfo/userInfoHooks";
import UserItem from "../userItem/UserItem";
import {
  UserItemPresenter,
  UserItemView,
} from "../../presenter/UserItemPresenter";

interface Props {
  featurePath: string;
  presenterFactory: (view: UserItemView) => UserItemPresenter;
}

const UserItemScroller = (props: Props) => {
  const { displayErrorMessage } = useMessageActions();
  const [items, setItems] = useState<User[]>([]);

  const { displayedUser, authToken } = useUserInfo();
  const { setDisplayedUser } = useUserInfoActions();
  const { displayedUser: displayedUserAliasParam } = useParams();

  // The observer in the observer pattern that the presenter will call when it has new data to display or an error to display. The presenter is responsible for calling these functions at the appropriate times, and the component is responsible for implementing them in a way that updates the UI.
  const listener: UserItemView = {
    addItems: (newItems: User[]) =>
      setItems((previousItems) => [...previousItems, ...newItems]),
    displayErrorMessage: (message: string) => displayErrorMessage(message),
  };

  const presenterRef = useRef<UserItemPresenter | null>(null);
  // Initially called with an empty presenter, but the first time the component renders, the presenter will be created using the presenterFactory function passed in through props. The presenter is stored in a ref so that it persists across renders without causing re-renders when it changes.
  if (!presenterRef.current) {
    presenterRef.current = props.presenterFactory(listener);
  }

  // Update the displayed user context variable whenever the displayedUser url parameter changes. This allows browser forward and back buttons to work correctly.
  useEffect(() => {
    if (
      authToken &&
      displayedUserAliasParam &&
      displayedUserAliasParam != displayedUser!.alias
    ) {
      getUser(authToken!, displayedUserAliasParam!).then((toUser) => {
        if (toUser) {
          setDisplayedUser(toUser);
        }
      });
    }
  }, [displayedUserAliasParam]);

  // Whenever the displayed user changes, reset the scroller and load the first page of items for the new user.
  useEffect(() => {
    reset();
    loadMoreItems();
  }, [displayedUser]);

  const reset = async () => {
    // setItems(() => []);
    presenterRef.current!.reset();
  };

  const loadMoreItems = async () => {
    presenterRef.current!.loadMoreItems(authToken!, displayedUser!.alias);
  };

  const getUser = async (
    authToken: AuthToken,
    alias: string,
  ): Promise<User | null> => {
    return presenterRef.current!.getUser(authToken, alias);
  };

  return (
    <div className="container px-0 overflow-visible vh-100">
      <InfiniteScroll
        className="pr-0 mr-0"
        dataLength={items.length}
        next={loadMoreItems}
        hasMore={presenterRef.current!.hasMoreItems}
        loader={<h4>Loading...</h4>}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="row mb-3 mx-0 px-0 border rounded bg-white"
          >
            <UserItem user={item} featurePath={props.featurePath} />
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default UserItemScroller;
