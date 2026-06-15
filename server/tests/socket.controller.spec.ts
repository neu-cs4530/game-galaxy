import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameServerSocket } from "../src/types.ts";
import { logSocketError } from "../src/controllers/socket.controller.ts";

const MockGameServerSocket = vi.fn(
  class {
    id = "mockGameServerSocket";
  },
);

const mockSocket = new MockGameServerSocket() as unknown as GameServerSocket;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logSocketError", () => {
  it("should log the message of an Error", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    logSocketError(mockSocket, new Error("boom"));
    expect(log).toHaveBeenCalledExactlyOnceWith(
      `ERR! [mockGameServerSocket] error message: "boom"`,
    );
  });

  it("should stringify a non-Error value", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    logSocketError(mockSocket, { code: 42 });
    expect(log).toHaveBeenCalledExactlyOnceWith(
      `ERR! [mockGameServerSocket] unexpected error ${JSON.stringify({ code: 42 })}`,
    );
  });
});
