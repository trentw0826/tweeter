import { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useParams } from "react-router-dom";
import { Status, AuthToken, User, FakeData } from "tweeter-shared";
import { useMessageActions } from "../toaster/messageHooks";
import { useUserInfo, useUserInfoActions } from "../userInfo/userInfoHooks";
import { useNavigateToUser } from "../userInfo/useNavigateToUser";
import StatusItem from "../statusItem/StatusItem";

export const PAGE_SIZE = 10;

interface Props {
  itemDescription: string;
  featurePath: string;
  retrieveItemsPage: (
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: Status | null,
  ) => Promise<[Status[], boolean]>;
}

const StatusItemScroller = (props: Props) => {
  const { displayErrorMessage } = useMessageActions();
  const [items, setItems] = useState<Status[]>([]);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [lastItem, setLastItem] = useState<Status | null>(null);
  const { navigateToUser, getUser } = useNavigateToUser(props.featurePath);

  const addItems = (newItems: Status[]) =>
    setItems((previousItems) => [...previousItems, ...newItems]);

  const { displayedUser, authToken } = useUserInfo();
  const { setDisplayedUser } = useUserInfoActions();
  const { displayedUser: displayedUserAliasParam } = useParams();

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

  // Initialize the component whenever the displayed user changes
  useEffect(() => {
    reset();
    loadMoreItems(null);
  }, [displayedUser]);

  const reset = async () => {
    setItems(() => []);
    setLastItem(() => null);
    setHasMoreItems(() => true);
  };

  const loadMoreItems = async (lastItem: Status | null) => {
    try {
      const [newItems, hasMore] = await props.retrieveItemsPage(
        authToken!,
        displayedUser!.alias,
        PAGE_SIZE,
        lastItem,
      );

      setHasMoreItems(() => hasMore);
      setLastItem(() => newItems[newItems.length - 1]);
      addItems(newItems);
    } catch (error) {
      displayErrorMessage(
        `Failed to load ${props.itemDescription} because of exception: ${error}`,
      );
    }
  };

  return (
    <div className="container px-0 overflow-visible vh-100">
      <InfiniteScroll
        className="pr-0 mr-0"
        dataLength={items.length}
        next={() => loadMoreItems(lastItem)}
        hasMore={hasMoreItems}
        loader={<h4>Loading...</h4>}
      >
        {items.map((item, index) => (
          <StatusItem
            key={index}
            status={item}
            featurePath={props.featurePath}
            onUserClick={navigateToUser}
          />
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default StatusItemScroller;
