import { createDefaultAvatar, type SafeUserInfo, type UserUpdateRequest } from "@gamenite/shared";
import { getUserByUsername, updateAuth } from "./auth.service.ts";
import { UserRepo } from "../repository.ts";

const disallowedUsernames = new Set(["login", "signup", "list"]);

/**
 * Retrieves a single user from the database.
 * If the userId is a bot placeholder (starts with "bot:"), returns a
 * synthetic SafeUserInfo without a DB lookup.
 *
 * @param userId - Valid user id, or a bot placeholder like "bot:0".
 * @returns the found user object (without the password).
 */
export async function populateSafeUserInfo(userId: string): Promise<SafeUserInfo> {
  if (userId.startsWith("bot:")) {
    return {
      username: userId,
      display: "Bot",
      createdAt: new Date(0),
      avatar: createDefaultAvatar(),
      balance: 0,
      wins: 0,
      losses: 0,
    };
  }
  const record = await UserRepo.get(userId);
  return {
    username: record.username,
    display: record.display,
    createdAt: new Date(record.createdAt),
    avatar: record.avatar,
    balance: record.balance,
    wins: record.wins ?? 0,
    losses: record.losses ?? 0,
  };
}

/**
 * Create and store a new user
 *
 * @param newUser - The user object to be saved, containing user details like username, password, etc.
 * @returns Resolves with the saved user object (without the password) or an error message.
 */
export async function createUser(
  username: string,
  password: string,
  createdAt: Date,
): Promise<SafeUserInfo | { error: string }> {
  if ((await getUserByUsername(username)) !== null) {
    return { error: "User already exists" };
  }
  if (disallowedUsernames.has(username)) {
    return { error: "That is not a permitted username" };
  }
  const defaultAvatar = createDefaultAvatar();
  const id = await UserRepo.add({
    username,
    createdAt: createdAt.toISOString(),
    display: username,
    avatar: defaultAvatar,
    balance: 0,
    wins: 0,
    losses: 0,
  });
  await updateAuth(username, password, id);
  return {
    username,
    createdAt,
    display: username,
    avatar: defaultAvatar,
    balance: 0,
    wins: 0,
    losses: 0,
  };
}

/**
 * Retrieves a list of usernames from the database
 *
 * @param usernames - A list of usernames
 * @returns the SafeUserInfo objects corresponding to those users
 * @throws if any of the usernames are not valid
 */
export async function getUsersByUsername(usernames: string[]): Promise<SafeUserInfo[]> {
  return Promise.all(
    usernames.map(async (username) => {
      const user = await getUserByUsername(username);
      if (user === null) {
        throw new Error(`No user ${username}`);
      }
      return populateSafeUserInfo(user.userId);
    }),
  );
}

/**
 * Updates user information in the database
 *
 * @param username - A valid username for the user to update
 * @param updates - An object that defines the fields to be updated and their new values
 * @returns the updated user object (without the password)
 * @throws if the username does not exist in the database
 */
export async function updateUser(
  username: string,
  { display, password }: UserUpdateRequest,
): Promise<SafeUserInfo> {
  const user = await getUserByUsername(username);
  if (!user) throw new Error(`No user ${username}`);
  if (password !== undefined) await updateAuth(username, password, user.userId);
  const newUser = await UserRepo.get(user.userId);
  if (display !== undefined) newUser.display = display;
  await UserRepo.set(user.userId, newUser);
  return populateSafeUserInfo(user.userId);
}

/**
 * Updates the database to give a player more coins for winning a game.
 *
 * @param userId the user to update the balance of
 * @param coins how many coins to add
 * @returns the new user balance in total
 */
export async function updateCoinCount(userId: string, coins: number) {
  const newUser = await UserRepo.get(userId);
  if (coins !== undefined) newUser.balance = newUser.balance + coins;
  await UserRepo.set(userId, newUser);
  return newUser.balance;
}

/**
 * Updates the database to record that a player won a game.
 *
 * @param userId the user whose win count should be incremented
 * @returns the user's new total win count
 */
export async function incrementWins(userId: string) {
  const newUser = await UserRepo.get(userId);
  newUser.wins = (newUser.wins ?? 0) + 1;
  await UserRepo.set(userId, newUser);
  return newUser.wins;
}

/**
 * Updates the database to record that a player lost a game.
 *
 * @param userId the user whose loss count should be incremented
 * @returns the user's new total loss count
 */
export async function incrementLosses(userId: string) {
  const newUser = await UserRepo.get(userId);
  newUser.losses = (newUser.losses ?? 0) + 1;
  await UserRepo.set(userId, newUser);
  return newUser.losses;
}
