import { Status } from "tweeter-shared";
import StatusItem from "../statusItem/StatusItem";
import { StatusItemPresenter } from "../../presenter/StatusItemPresenter";
import { PagedItemView } from "../../presenter/PagedItemPresenter";
import { useNavigateToUser } from "../userInfo/useNavigateToUser";
import ItemScroller from "./ItemScroller";

interface Props {
  featurePath: string;
  presenterFactory: (view: PagedItemView<Status>) => StatusItemPresenter;
}

const StatusItemScroller = (props: Props) => {
  const { navigateToUser } = useNavigateToUser(props.featurePath);

  return (
    <ItemScroller
      featurePath={props.featurePath}
      presenterFactory={props.presenterFactory}
      renderItem={(item, index) => (
        <StatusItem
          key={index}
          status={item}
          featurePath={props.featurePath}
          onUserClick={navigateToUser}
        />
      )}
    />
  );
};

export default StatusItemScroller;
