import { withAuth, type Accessory } from "@gamenite/shared";
import { AccessoryRepo, UserRepo } from "../repository.ts";
import type { RestAPI, SocketAPI } from "../types.ts";
import { buyAccessory } from "../services/accessory.service.ts";
import { enforceAuth } from "../services/auth.service.ts";
import { logSocketError } from "./socket.controller.ts";
import { z } from "zod";

export const getAccessories: RestAPI<Accessory[]> = async (req, res) => {
  const keys = await AccessoryRepo.getAllKeys();
  const accessories = await AccessoryRepo.getMany(keys);
  res.send(accessories);
};

export const socketBuyAccessory: SocketAPI = (socket) => async (body) => {
  try {
    const { auth, payload: accessoryId } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    await buyAccessory(accessoryId, user.userId);
    const updatedUser = await UserRepo.get(user.userId);
    socket.emit("balanceUpdated", { balance: updatedUser.balance });
  } catch (err) {
    logSocketError(socket, err);
  }
};
