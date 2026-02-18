import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useRef } from "react";
import { useMessageActions } from "../toaster/messageHooks";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { OAuthPresenter, OAuthView } from "../../presenter/OAuthPresenter";

interface OAuthProps {
  heading: string;
}

interface OAuthProvider {
  name: string;
  icon: IconName;
}

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

  const providers: OAuthProvider[] = [
    { name: "Google", icon: "google" },
    { name: "Facebook", icon: "facebook" },
    { name: "Twitter", icon: "twitter" },
    { name: "LinkedIn", icon: "linkedin" },
    { name: "GitHub", icon: "github" },
  ];

  const handleOAuthClick = (providerName: string) => {
    presenterRef.current!.handleOAuthClick(providerName);
  };

  return (
    <>
      <h1 className="h4 mb-3 fw-normal">Or</h1>
      <h1 className="h5 mb-3 fw-normal">{heading}</h1>

      <div className="text-center mb-3">
        {providers.map((provider) => (
          <button
            key={provider.name}
            type="button"
            className="btn btn-link btn-floating mx-1"
            onClick={() => handleOAuthClick(provider.name)}
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
