import { useState, useEffect, useRef, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate, useParams } from "react-router-dom";
import { useMessageActions } from "../toaster/messageHooks";
import { useUserInfo, useUserInfoActions } from "../userInfo/userInfoHooks";
import {
  PagedItemPresenter,
  PagedItemView,
} from "../../presenter/PagedItemPresenter";
import { Service } from "../../presenter/Presenter";

interface Props<T, U extends Service> {
  featurePath: string;
  presenterFactory: (view: PagedItemView<T>) => PagedItemPresenter<T, U>;
  renderItem: (item: T, index: number) => React.ReactNode;
}

function ItemScroller<T, U extends Service>(props: Props<T, U>) {
  const { displayErrorMessage } = useMessageActions();
  const [items, setItems] = useState<T[]>([]);

  const { displayedUser, authToken } = useUserInfo();
  const { setDisplayedUser } = useUserInfoActions();
  const { displayedUser: displayedUserAliasParam } = useParams();
  const navigate = useNavigate();

  const listener: PagedItemView<T> = {
    addItems: (newItems: T[]) =>
      setItems((previousItems) => [...previousItems, ...newItems]),
    displayErrorMessage: (message: string) => {
      displayErrorMessage(message);
    },
    navigateTo: (url: string) => {
      navigate(url);
    },
  };

  const presenterRef = useRef<PagedItemPresenter<T, U> | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = props.presenterFactory(listener);
  }

  // Update the displayed user context variable whenever the displayedUser url
  // parameter changes. This allows browser forward and back buttons to work correctly.
  useEffect(() => {
    if (
      authToken &&
      displayedUser &&
      displayedUserAliasParam &&
      displayedUserAliasParam != displayedUser.alias
    ) {
      presenterRef
        .current!.getUser(authToken, displayedUserAliasParam)
        .then((toUser) => {
          if (toUser) {
            setDisplayedUser(toUser);
          }
        });
    }
  }, [authToken, displayedUser, displayedUserAliasParam, setDisplayedUser]);

  const reset = useCallback(async () => {
    setItems(() => []);
    presenterRef.current!.reset();
  }, []);

  const loadMoreItems = useCallback(async () => {
    if (!authToken || !displayedUser) {
      return;
    }

    presenterRef.current!.loadMoreItems(authToken, displayedUser.alias);
  }, [authToken, displayedUser]);

  // Initialize the component whenever the displayed user changes
  useEffect(() => {
    void reset();
    void loadMoreItems();
  }, [displayedUser, loadMoreItems, reset]);

  return (
    <div className="container px-0 overflow-visible vh-100">
      <InfiniteScroll
        className="pr-0 mr-0"
        dataLength={items.length}
        next={loadMoreItems}
        hasMore={presenterRef.current!.hasMoreItems}
        loader={<h4>Loading...</h4>}
      >
        {items.map((item, index) => props.renderItem(item, index))}
      </InfiniteScroll>
    </div>
  );
}

export default ItemScroller;
