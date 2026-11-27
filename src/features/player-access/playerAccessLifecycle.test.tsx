import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import PlayerAccess from "./PlayerAccess";
import { joinGameSession } from "../../lib/playerAccess";

vi.mock("../../lib/playerAccess", () => ({ joinGameSession: vi.fn() }));
vi.mock("./recoveryVault", () => ({
  pendingRecoveryCredential: vi.fn(async () => "sample-recovery"),
  clearPendingRecovery: vi.fn(async () => {}),
}));
type Reply = Awaited<ReturnType<typeof joinGameSession>>;
const credentialKey = "chaos-crawl-session-player:123456";
const success: Reply = {
  data: {
    join_code: "123456",
    player_token: "original-token",
    player_name: "Pat",
    resumed: false,
  },
  error: null,
};

function deferred() {
  let resolve: (reply: Reply) => void = () => {
    throw new Error("Deferred request not initialized");
  };
  let reject: (error: Error) => void = () => {
    throw new Error("Deferred request not initialized");
  };
  const promise = new Promise<Reply>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
function form() {
  const element = document.querySelector("form");
  if (!element) throw new Error("Join form is missing");
  return element;
}
async function beginJoin() {
  fireEvent.submit(form());
  await act(async () => {});
  fireEvent.change(screen.getByLabelText("Your name?"), {
    target: { value: "Pat" },
  });
  fireEvent.change(screen.getByLabelText("Your phone number?"), {
    target: { value: "0712345678" },
  });
  fireEvent.submit(form());
  await act(async () => {});
  expect(
    screen.getByRole("button", { name: "Joining…" }).hasAttribute("disabled"),
  ).toBe(true);
}

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("does not store credentials or redirect when a successful join finishes after unmount", async () => {
  const request = deferred();
  vi.mocked(joinGameSession).mockReturnValue(request.promise);
  const onJoined = vi.fn();
  const { unmount } = render(
    <StrictMode>
      <PlayerAccess
        codeFromUrl="123456"
        initialMode="join"
        onJoined={onJoined}
      />
    </StrictMode>,
  );
  await beginJoin();
  unmount();
  await act(async () => {
    request.resolve(success);
    await request.promise;
  });
  expect(onJoined).not.toHaveBeenCalled();
  expect(localStorage.getItem(credentialKey)).toBeNull();
});

it.each(["database", "transport"] as const)(
  "ignores a late %s failure after unmount",
  async (failure) => {
    const request = deferred();
    vi.mocked(joinGameSession).mockReturnValue(request.promise);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onJoined = vi.fn();
    const { unmount } = render(
      <PlayerAccess
        codeFromUrl="123456"
        initialMode="join"
        onJoined={onJoined}
      />,
    );
    await beginJoin();
    unmount();
    await act(async () => {
      if (failure === "transport")
        request.reject(new Error("Late transport failure"));
      else
        request.resolve({
          data: null,
          error: { message: "Late database failure" },
        });
      await request.promise.catch(() => {});
    });
    expect(consoleError).not.toHaveBeenCalled();
    expect(onJoined).not.toHaveBeenCalled();
    expect(localStorage.getItem(credentialKey)).toBeNull();
  },
);

it("discards the previous target response, unlocks the current form and allows a fresh join", async () => {
  const request = deferred();
  vi.mocked(joinGameSession).mockReturnValueOnce(request.promise);
  const onJoined = vi.fn();
  const { rerender } = render(
    <PlayerAccess
      codeFromUrl="123456"
      initialMode="join"
      onJoined={onJoined}
    />,
  );
  await beginJoin();
  rerender(
    <PlayerAccess
      codeFromUrl="654321"
      initialMode="join"
      onJoined={onJoined}
    />,
  );
  expect(screen.getByText("654321", {})).toBeTruthy();
  await act(async () => {
    request.resolve(success);
    await request.promise;
  });
  expect(onJoined).not.toHaveBeenCalled();
  expect(localStorage.getItem(credentialKey)).toBeNull();
  expect(
    screen.getByRole("button", { name: "Join game" }).hasAttribute("disabled"),
  ).toBe(false);
  const next: Reply = {
    data: {
      ...success.data,
      join_code: "654321",
      player_token: "new-token",
      player_name: "Pat",
      resumed: false,
    },
    error: null,
  };
  vi.mocked(joinGameSession).mockResolvedValueOnce(next);
  await act(async () => {
    fireEvent.submit(form());
  });
  expect(vi.mocked(joinGameSession).mock.calls[1][0]).toEqual({
    action: "register",
    join_code: "654321",
    credential: "sample-recovery",
    name: "Pat",
    mobile: "0712345678",
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Continue without saving" }),
  );
  await act(async () => {});
  expect(onJoined).toHaveBeenCalledExactlyOnceWith(next.data);
  expect(localStorage.getItem("chaos-crawl-session-player:654321")).toBe(
    "new-token",
  );
});

it("does not resurrect a pending result when the query code changes away and back", async () => {
  const request = deferred();
  vi.mocked(joinGameSession).mockReturnValue(request.promise);
  const onJoined = vi.fn();
  const { rerender } = render(
    <PlayerAccess
      codeFromUrl="123456"
      initialMode="join"
      onJoined={onJoined}
    />,
  );
  await beginJoin();
  rerender(
    <PlayerAccess
      codeFromUrl="654321"
      initialMode="join"
      onJoined={onJoined}
    />,
  );
  rerender(
    <PlayerAccess
      codeFromUrl="123456"
      initialMode="join"
      onJoined={onJoined}
    />,
  );
  await act(async () => {
    request.resolve(success);
    await request.promise;
  });
  expect(onJoined).not.toHaveBeenCalled();
  expect(localStorage.getItem(credentialKey)).toBeNull();
});

it.each(["code", "mode"] as const)(
  "invalidates a pending join when Back changes the %s",
  async (change) => {
    const request = deferred();
    vi.mocked(joinGameSession).mockReturnValue(request.promise);
    const onJoined = vi.fn();
    render(
      <PlayerAccess
        codeFromUrl="123456"
        initialMode="join"
        onJoined={onJoined}
      />,
    );
    await beginJoin();
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    if (change === "code") {
      fireEvent.change(
        screen.getByRole("textbox", { name: "Enter six digit game code" }),
        { target: { value: "654321" } },
      );
      fireEvent.change(
        screen.getByRole("textbox", { name: "Enter six digit game code" }),
        { target: { value: "123456" } },
      );
    } else {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Already joined? Rejoin",
        }),
      );
    }
    await act(async () => {
      request.resolve(success);
      await request.promise;
    });
    expect(onJoined).not.toHaveBeenCalled();
    expect(localStorage.getItem(credentialKey)).toBeNull();
    expect(
      screen.getByRole("button", {
        name:
          change === "mode"
            ? "New player? Join game"
            : "Already joined? Rejoin",
      }),
    ).toBeTruthy();
  },
);

it("keeps pending name/mobile edits compatible with the captured request and current success", async () => {
  const request = deferred();
  vi.mocked(joinGameSession).mockReturnValue(request.promise);
  const onJoined = vi.fn();
  render(
    <StrictMode>
      <PlayerAccess
        codeFromUrl="123456"
        initialMode="join"
        onJoined={onJoined}
      />
    </StrictMode>,
  );
  await beginJoin();
  fireEvent.change(screen.getByLabelText("Your name?"), {
    target: { value: "Changed name" },
  });
  fireEvent.change(screen.getByLabelText("Your phone number?"), {
    target: { value: "0799999999" },
  });
  await act(async () => {
    request.resolve(success);
    await request.promise;
  });
  expect(joinGameSession).toHaveBeenCalledExactlyOnceWith({
    action: "register",
    join_code: "123456",
    credential: "sample-recovery",
    name: "Pat",
    mobile: "0712345678",
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Continue without saving" }),
  );
  await act(async () => {});
  expect(onJoined).toHaveBeenCalledExactlyOnceWith(success.data);
  expect(localStorage.getItem(credentialKey)).toBe("original-token");
});

it("locks repeated submissions synchronously while the same join is pending", async () => {
  const request = deferred();
  vi.mocked(joinGameSession).mockReturnValue(request.promise);
  render(
    <PlayerAccess codeFromUrl="123456" initialMode="join" onJoined={vi.fn()} />,
  );
  fireEvent.submit(form());
  fireEvent.change(screen.getByLabelText("Your name?"), {
    target: { value: "Pat" },
  });
  fireEvent.change(screen.getByLabelText("Your phone number?"), {
    target: { value: "0712345678" },
  });
  act(() => {
    fireEvent.submit(form());
    fireEvent.submit(form());
  });
  await act(async () => {});
  expect(joinGameSession).toHaveBeenCalledTimes(1);
  await act(async () => {
    request.resolve(success);
    await request.promise;
  });
});

it.each(["database", "transport"] as const)(
  "discards a late %s failure after changing the query target",
  async (failure) => {
    const request = deferred();
    vi.mocked(joinGameSession).mockReturnValue(request.promise);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onJoined = vi.fn();
    const { rerender } = render(
      <PlayerAccess
        codeFromUrl="123456"
        initialMode="join"
        onJoined={onJoined}
      />,
    );
    await beginJoin();
    rerender(
      <PlayerAccess
        codeFromUrl="654321"
        initialMode="join"
        onJoined={onJoined}
      />,
    );
    await act(async () => {
      if (failure === "transport")
        request.reject(new Error("Obsolete transport failure"));
      else
        request.resolve({
          data: null,
          error: { message: "Obsolete database failure" },
        });
      await request.promise.catch(() => {});
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    expect(onJoined).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole("button", { name: "Join game" })
        .hasAttribute("disabled"),
    ).toBe(false);
  },
);

it("does not let an old instance authorize a newly mounted form for the same code", async () => {
  const oldRequest = deferred();
  const newRequest = deferred();
  vi.mocked(joinGameSession)
    .mockReturnValueOnce(oldRequest.promise)
    .mockReturnValueOnce(newRequest.promise);
  const oldJoined = vi.fn();
  const nextJoined = vi.fn();
  const old = render(
    <PlayerAccess
      codeFromUrl="123456"
      initialMode="join"
      onJoined={oldJoined}
    />,
  );
  await beginJoin();
  old.unmount();
  render(
    <PlayerAccess
      codeFromUrl="123456"
      initialMode="join"
      onJoined={nextJoined}
    />,
  );
  await beginJoin();
  await act(async () => {
    oldRequest.resolve(success);
    await oldRequest.promise;
  });
  expect(oldJoined).not.toHaveBeenCalled();
  expect(nextJoined).not.toHaveBeenCalled();
  expect(localStorage.getItem(credentialKey)).toBeNull();
  expect(
    screen.getByRole("button", { name: "Joining…" }).hasAttribute("disabled"),
  ).toBe(true);
  const latest: Reply = {
    data: {
      join_code: "123456",
      player_token: "latest-token",
      player_name: "Pat",
      resumed: true,
    },
    error: null,
  };
  await act(async () => {
    newRequest.resolve(latest);
    await newRequest.promise;
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Continue without saving" }),
  );
  await act(async () => {});
  expect(nextJoined).toHaveBeenCalledExactlyOnceWith(latest.data);
  expect(localStorage.getItem(credentialKey)).toBe("latest-token");
});
