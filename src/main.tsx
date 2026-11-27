import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import HostConfirmation from "./features/host-access/HostConfirmation";
import InstallPromptController from "./features/install/InstallPromptController";
import "./instrument";
import "../scss/style.scss";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Application root element is missing.");
// Supabase's confirmation tokens use the hash, so process them before routing.
const isHostConfirmation =
  new URLSearchParams(window.location.search).get("host_confirmation") === "1";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  void navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`)
    .catch((error: unknown) => {
      console.error("Could not register the offline page.", error);
    });
}

ReactDOM.createRoot(rootElement, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <main role="alert">
          <h1>Something went wrong</h1>
          <p>Reload the page to return to the game.</p>
          <button onClick={() => window.location.reload()}>Reload page</button>
        </main>
      }
    >
      {isHostConfirmation ? (
        <HostConfirmation />
      ) : (
        <>
          <InstallPromptController />
          <HashRouter>
            <App />
          </HashRouter>
        </>
      )}
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
