import type { SafeUserInfo } from "@gamenite/shared";
import { createContext } from "react";
import type { GameSocket } from "../util/types.ts";

/**
 * The user information held as part of a login context
 *
 * - user - the current user
 * - pass - the user's password
 * - setUser - updates the current user (e.g. after a purchase)
 * - reset - a callback that logs out the user
 */
export interface AuthContext {
  user: SafeUserInfo;
  pass: string;
  setUser: (user: SafeUserInfo) => void;
  reset: () => void;
}

/**
 * See useLoginContext()
 */
export const LoginContext = createContext<
  | (AuthContext & {
      socket: GameSocket;
      subscribedThreads: string[];
      addThreadSubscription: (threadId: string) => void;
    })
  | null
>(null);
