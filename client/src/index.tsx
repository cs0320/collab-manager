import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./components/App";
import { ClerkProvider } from "@clerk/clerk-react";
import { RecoilRoot } from "recoil";
import { VITE_CLERK_PUBLISHABLE_KEY } from "./private/ClerkKey";
import { ConvexProvider, ConvexReactClient } from "convex/react";


const PUBLISHABLE_KEY = VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const convex = new ConvexReactClient("https://intent-crane-160.convex.cloud"); // get this from convex dashboard

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <RecoilRoot>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
    </ClerkProvider>
  </RecoilRoot>
);
