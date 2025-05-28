import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./components/App";
import { ClerkProvider } from "@clerk/clerk-react";
import { RecoilRoot } from "recoil";
import { VITE_CLERK_PUBLISHABLE_KEY } from "./private/ClerkKey";

const PUBLISHABLE_KEY = VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <RecoilRoot>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </RecoilRoot>
);
