import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useRef } from "react";
import { useMessageActions } from "../toaster/messageHooks";
import {
  OAuthPresenter,
  OAuthProps,
  OAuthView,
} from "../../presenter/OAuthPresenter";

const OAuth = ({ heading }: OAuthProps) => {
  const { displayInfoMessage } = useMessageActions();
  const { displayErrorMessage } = useMessageActions();

  const listener: OAuthView = {
    displayInfoMessage: (
      message: string,
      duration: number,
      bootstrapClasses?: string,
    ) => displayInfoMessage(message, duration, bootstrapClasses),
    displayErrorMessage: (message: string) => displayErrorMessage(message),
  };

  const presenterRef = useRef<OAuthPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = new OAuthPresenter(listener);
  }

  return (
    <>
      <h1 className="h4 mb-3 fw-normal">Or</h1>
      <h1 className="h5 mb-3 fw-normal">{heading}</h1>

      <div className="text-center mb-3">
        {presenterRef.current!.getProviders().map((provider) => (
          <button
            key={provider.name}
            type="button"
            className="btn btn-link btn-floating mx-1"
            onClick={() => presenterRef.current!.handleOAuthClick(provider)}
          >
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id={`${provider.name.toLowerCase()}Tooltip`}>
                  {provider.name}
                </Tooltip>
              }
            >
              <FontAwesomeIcon icon={["fab", provider.icon]} />
            </OverlayTrigger>
          </button>
        ))}
      </div>
    </>
  );
};

export default OAuth;
