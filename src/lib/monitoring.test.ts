import { afterEach, describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/react";
import { initMonitoring, reportError } from "./monitoring";
import { runApi } from "./apiResult";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  isInitialized: vi.fn(() => false),
  captureException: vi.fn(),
  captureConsoleIntegration: vi.fn(() => ({ name: "CaptureConsole" })),
  consoleLoggingIntegration: vi.fn(() => ({ name: "ConsoleLogging" })),
  browserTracingIntegration: vi.fn(() => ({ name: "BrowserTracing" })),
  contextLinesIntegration: vi.fn(() => ({ name: "ContextLines" })),
  logger: { error: vi.fn() },
}));

afterEach(() => vi.unstubAllEnvs());

describe("error monitoring", () => {
  it("does not initialize without a DSN or during tests", () => {
    vi.stubEnv("MODE", "production");
    vi.stubEnv("VITE_SENTRY_DSN", "");
    initMonitoring();
    vi.stubEnv("MODE", "test");
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@example.com/1");
    initMonitoring();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("initializes with the configured environment and release", () => {
    vi.stubEnv("MODE", "production");
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@example.com/1");
    vi.stubEnv("VITE_SENTRY_ENVIRONMENT", "staging");
    vi.stubEnv("VITE_SENTRY_RELEASE", "commit-sha");
    initMonitoring();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://public@example.com/1",
        environment: "staging",
        release: "commit-sha",
        dataCollection: expect.objectContaining({ userInfo: false }),
      }),
    );
  });

  it("does not report errors when monitoring is disabled", () => {
    reportError(new Error("offline"), "api");
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("reports returned API failures while preserving the UI result", async () => {
    vi.mocked(Sentry.isInitialized).mockReturnValueOnce(true);
    const error = { message: "Database unavailable", code: "503" };
    expect(await runApi(async () => ({ data: null, error }))).toEqual({
      data: null,
      error,
    });
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: error.message }),
      { tags: { operation: "api" } },
    );
  });

  it("reports thrown transport errors with the original stack", async () => {
    vi.mocked(Sentry.isInitialized).mockReturnValueOnce(true);
    const error = new Error("Network unavailable");
    const result = await runApi(async () => {
      throw error;
    });
    expect(result.error?.message).toBe(error.message);
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { operation: "api" },
    });
  });
});
