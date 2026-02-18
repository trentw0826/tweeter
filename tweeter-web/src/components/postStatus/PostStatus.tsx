import "./PostStatus.css";
import { useRef, useState } from "react";
import { useUserInfo } from "../userInfo/userInfoHooks";
import { useMessageActions } from "../toaster/messageHooks";
import {
  PostStatusView,
  PostStatusPresenter,
} from "../../presenter/StatusPresenter";

const PostStatus = () => {
  const { displayInfoMessage, displayErrorMessage, deleteMessage } =
    useMessageActions();

  const { currentUser, authToken } = useUserInfo();
  const [post, setPost] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const listener: PostStatusView = {
    displayInfoMessage: (
      message: string,
      duration: number,
      bootstrapClasses?: string,
    ) => displayInfoMessage(message, duration, bootstrapClasses),
    displayErrorMessage: (message: string) => displayErrorMessage(message),
    deleteMessage: (toastId: string) => deleteMessage(toastId),
    setIsLoading: (value: boolean) => setIsLoading(value),
    clearPost: () => setPost(""),
  };

  const presenterRef = useRef<PostStatusPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = new PostStatusPresenter(listener);
  }

  const submitPost = async (event: React.MouseEvent) => {
    event.preventDefault();
    await presenterRef.current!.submitPost(post, authToken!, currentUser!);
  };

  const clearPost = (event: React.MouseEvent) => {
    event.preventDefault();
    setPost("");
  };

  const isPostButtonDisabled = (): boolean => {
    return presenterRef.current!.isPostButtonDisabled(
      post,
      authToken,
      currentUser,
    );
  };

  return (
    <form>
      <div className="form-group mb-3">
        <textarea
          className="form-control"
          id="postStatusTextArea"
          rows={10}
          placeholder="What's on your mind?"
          value={post}
          onChange={(event) => {
            setPost(event.target.value);
          }}
        />
      </div>
      <div className="form-group">
        <button
          id="postStatusButton"
          className="btn btn-md btn-primary me-1"
          type="button"
          disabled={isPostButtonDisabled()}
          style={{ width: "8em" }}
          onClick={submitPost}
        >
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            <div>Post Status</div>
          )}
        </button>
        <button
          id="clearStatusButton"
          className="btn btn-md btn-secondary"
          type="button"
          disabled={isPostButtonDisabled()}
          onClick={clearPost}
        >
          Clear
        </button>
      </div>
    </form>
  );
};

export default PostStatus;
