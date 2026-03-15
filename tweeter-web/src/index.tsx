import "./index.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import UserInfoProvider from "./components/userInfo/UserInfoProvider";
import ToastInfoProvider from "./components/toaster/ToastInfoProvider";

library.add(fab);

(
  globalThis as typeof globalThis & {
    __APP_CONFIG__?: { VITE_API_BASE_URL?: string };
  }
).__APP_CONFIG__ = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
};

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <UserInfoProvider>
    <ToastInfoProvider>
      <App />
    </ToastInfoProvider>
  </UserInfoProvider>,
);
