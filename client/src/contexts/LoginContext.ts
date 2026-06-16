import type { SafeUserInfo } from "@gamegalaxy/shared";
import { createContext } from "react";
import type { GameSocket } from "@gamegalaxy/client/src/util/types.ts";

/**
 * The user information held as part of a login context
 *
 * - user - the current user
 * - pass - the user's password
 * - reset - a callback that logs out the user
 */
export interface AuthContext {
  user: SafeUserInfo;
  pass: string;
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
