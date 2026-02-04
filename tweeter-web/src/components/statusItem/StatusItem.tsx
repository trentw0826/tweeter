import { Link } from "react-router-dom";
import { Status } from "tweeter-shared";
import Post from "./Post";

interface StatusItemProps {
  status: Status;
  featurePath: string;
  onUserClick: (event: React.MouseEvent) => void;
}

const StatusItem = ({ status, featurePath, onUserClick }: StatusItemProps) => {
  return (
    <div className="col bg-light mx-0 px-0">
      <div className="container px-0">
        <div className="row mx-0 px-0">
          <div className="col-auto p-3">
            <img
              src={status.user.imageUrl}
              className="img-fluid"
              width="80"
              alt="Posting user"
            />
          </div>
          <div className="col">
            <h2>
              <b>
                {status.user.firstName} {status.user.lastName}
              </b>{" "}
              -{" "}
              <Link to={`/feed/${status.user.alias}`} onClick={onUserClick}>
                {status.user.alias}
              </Link>
            </h2>
            {status.formattedDate}
            <br />
            <Post status={status} featurePath={featurePath} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusItem;
