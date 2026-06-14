import { UserRepo } from "../repository.ts";

/**
 * updates the avatar of the given user to have the given color;
 * @param color - the new color of the avatar
 * @param userId - the user whose avatar needs to be updated.
 */
export async function changeColor(color: string, userId: string) {
  const user = await UserRepo.get(userId);
  const avatar = user.avatar;
  avatar.color = color;
  await UserRepo.set(userId, user);
}
