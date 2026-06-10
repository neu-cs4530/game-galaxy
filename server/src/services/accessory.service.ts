import { AccessoryRepo, UserRepo } from "../repository.ts";
import { updateCoinCount } from "./user.service.ts";

/**
 * purchase an accessory from the store, and add it to the user's closet
 * @param accessoryId - the id of the accessory to be worn
 * @param userId - the id of the user
 */
export async function buyAccessory(accessoryId: string, userId: string) {
  const accessory = await AccessoryRepo.get(accessoryId);
  const user = await UserRepo.get(userId);
  if (accessoryId in user.avatar.accessories) {
    throw new Error(`User already owns accessory ${accessory.name}`);
  }
  if (user.balance < accessory.cost) {
    throw new Error(`You do not have enough coins to buy this accessory!`);
  }
  user.avatar.accessories[accessoryId] = false;
  await UserRepo.set(userId, user);
  await updateCoinCount(userId, -accessory.cost);
}

/**
 * put the given accessory onto the avatar
 * @param accessoryId - the id of the accessory to be worn
 * @param userId - the id of the user
 */
export async function wearAccessory(accessoryId: string, userId: string) {
  const user = await UserRepo.get(userId);
  if (!(accessoryId in user.avatar.accessories)) {
    throw new Error(`User ${userId} does not own accessory`);
  }
  user.avatar.accessories[accessoryId] = true;
  await UserRepo.set(userId, user);
}

/**
 * take the given accessory off the user's avatar
 * @param accessoryId - the id of the accessory to be worn
 * @param userId - the id of the user
 */
export async function removeAccessory(accessoryId: string, userId: string) {
  const user = await UserRepo.get(userId);
  if (!(accessoryId in user.avatar.accessories)) {
    throw new Error(`User ${userId} does not own accessory`);
  }
  user.avatar.accessories[accessoryId] = false;
  await UserRepo.set(userId, user);
}
