import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useMessageActions } from "../toaster/messageHooks";
import { IconName } from "@fortawesome/fontawesome-svg-core";

interface OAuthProps {
  heading: string;
}

interface OAuthProvider {
  name: string;
  icon: IconName;
}

const OAuth = ({ heading }: OAuthProps) => {
  const { displayInfoMessage } = useMessageActions();

  const providers: OAuthProvider[] = [
    { name: "Google", icon: "google" },
    { name: "Facebook", icon: "facebook" },
    { name: "Twitter", icon: "twitter" },
    { name: "LinkedIn", icon: "linkedin" },
    { name: "GitHub", icon: "github" },
  ];

  const displayInfoMessageWithDarkBackground = (message: string): void => {
    displayInfoMessage(message, 3000, "text-white bg-primary");
  };

  const handleOAuthClick = (providerName: string) => {
    displayInfoMessageWithDarkBackground(
      `${providerName} registration is not implemented.`,
    );
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
