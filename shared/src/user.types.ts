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
  balance: number;
}

/**
 * represents a user's avatar representation in GameNite
 * color - the color of the avatar
 * accessories - the list of accessories owned by the avatar with a boolean indicating if they are being worn
 */
export interface Avatar {
  color: string;
  accessories: Record<string, boolean>;
}

/**
 * represents an accessory that a user can own
 * accessoryId - unique id identifying the accessory
 * name - the name of the accessory
 * cost - how many coins is this accessory worth?
 */
export interface Accessory {
  accessoryId: string;
  name: string;
  cost: number;
}

/**
 * Creates a default avatar for a newly registered user.
 * - color defaults to blue
 * - equipped with default face accessory
 */
export function createDefaultAvatar(): Avatar {
  const colors = ["blue", "pink", "orange", "green"];
  return {
    color: colors[Math.floor(Math.random() * colors.length)],
    accessories: {
      "face-01": true,
    },
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
