import { z } from "zod";

/**
 * Represents a "safe" user object that excludes sensitive information like
 * the password, suitable for exposing to clients,
 * - `username`: unique username of the user
 * - `display`: A display name
 * - `createdAt`: when this when the user registered.
 */
export interface SafeUserInfo {
  username: string;
  display: string;
  createdAt: Date;
  avatar: Avatar;
}

/**
 * represents a user's avatar representation in GameNite
 * color - the color of the avatar
 * accessories - the list of accessories being worn by the avatar
 */
export interface Avatar {
  color: string;
  accessories: Accessory[];
}

/**
 * represents an accessory that a user can own
 * accessoryId - unique id identifying the accessory
 * name - the name of the accessory
 * isWearing - is this accessory being worn by a user? // TODO: not sure if we want this here might have to tweak once we implement this.
 */
export interface Accessory {
  accessoryId: string;
  name: string;
  isWearing: boolean;
}

/**
 * Creates a default avatar for a newly registered user.
 * - color defaults to blue
 * - equipped with default face accessory
 */
export function createDefaultAvatar(): Avatar {
  return {
    color: "blue",
    accessories: [], // TODO: add default face
  };
}

/*** TYPES USED IN THE USER API ***/

/**
 * Represents allowed updates to a user.
 */
export type UserUpdateRequest = z.infer<typeof zUserUpdateRequest>;
export const zUserUpdateRequest = z.object({
  password: z.string().optional(),
  display: z.string().optional(),
});
