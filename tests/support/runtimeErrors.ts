import type { ConsoleMessage, Page, Response } from "@playwright/test";
type ErrorTracker = {
  pageErrors: string[];
  consoleErrors: string[];
  failedResponses: string[];
  stop: () => void;
};

export function attachErrorTracker(page: Page): ErrorTracker {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];

  const onPageError = (error: Error) => {
    pageErrors.push(error.message);
  };

  const onConsole = (message: ConsoleMessage) => {
    if (message.type() !== "error") {
      return;
    }

    const text = message.text();

    if (text.includes("favicon")) {
      return;
    }

    consoleErrors.push(text);
  };

  const onResponse = (response: Response) => {
    if (response.status() < 400) {
      return;
    }

    failedResponses.push(`${response.status()} ${response.url()}`);
  };

  page.on("pageerror", onPageError);

  page.on("console", onConsole);

  page.on("response", onResponse);

  return {
    pageErrors,
    consoleErrors,
    failedResponses,

    stop: () => {
      page.off("pageerror", onPageError);

      page.off("console", onConsole);

      page.off("response", onResponse);
    },
  };
}
