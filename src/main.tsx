import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./instrument";
import "../scss/style.scss";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Application root element is missing.");

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
      <HashRouter>
        <App />
      </HashRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
