import { withAuth } from "@gamenite/shared";
import { z } from "zod";
import { enforceAuth } from "../services/auth.service.ts";
import type { SocketAPI } from "../types.ts";
import { logSocketError } from "./socket.controller.ts";
import { changeColor } from "../services/avatar.service.ts";

/**
 * Handles the socket request sent by a user when they try to change their avatar's color.
 *
 */
export const socketChangeColor: SocketAPI = (socket) => async (body) => {
  try {
    const { auth, payload: color } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    await changeColor(color, user.userId);
  } catch (err) {
    logSocketError(socket, err);
  }
};
