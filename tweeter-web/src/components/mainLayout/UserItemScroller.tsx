import { User } from "tweeter-shared";
import UserItem from "../userItem/UserItem";
import { UserItemPresenter } from "../../presenter/UserItemPresenter";
import { PagedItemView } from "../../presenter/PagedItemPresenter";
import ItemScroller from "./ItemScroller";

interface Props {
  featurePath: string;
  presenterFactory: (view: PagedItemView<User>) => UserItemPresenter;
}

const UserItemScroller = (props: Props) => {
  return (
    <ItemScroller
      featurePath={props.featurePath}
      presenterFactory={props.presenterFactory}
      renderItem={(item, index) => (
        <div key={index} className="row mb-3 mx-0 px-0 border rounded bg-white">
          <UserItem user={item} featurePath={props.featurePath} />
        </div>
      )}
    />
  );
};

export default UserItemScroller;
