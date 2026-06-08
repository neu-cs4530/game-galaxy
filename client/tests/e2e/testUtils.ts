import { expect, type Page } from "@playwright/test";

/**
 * Log a user in with a username and password, and wait for successful
 * post-login redirect to the home page
 *
 * @param page
 * @param username
 * @param password
 */
export async function logInUser(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  // { exact: true } is necessary here to avoid capturing the "Show Password" checkbox and "Confirm Password" button
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/");
}

/**
 * Set up a test of two users joining and starting a 2+ player game
 *
 * @param page1 - A Page where we will attempt to create a *new* user. That user will initiate the game.
 * @param page2 - A Page where the preexisting user2 will log in
 * @param tableId - The table id used to identify the table being clicked.
 * @param gameStartsAutomatically - true if the game has a maximum of two players
 * @param doAssess - `true` adds extra expectations
 * @returns
 */
export async function createAndLoadGame(
  page1: Page,
  page2: Page,
  tableId: string,
  gameStartsAutomatically: boolean,
  doAssess: boolean,
) {
  const username1 = "user" + Math.floor(Math.random() * 2_000_000);
  const password1 = "pwd_for_" + username1;
  // Both players are freshly created so that neither is already enrolled in a
  // seeded game of this type (which would make `findActiveGameForUser` redirect
  // them to that game instead of the table's game).
  const username2 = "user" + Math.floor(Math.random() * 2_000_000);
  const password2 = "pwd_for_" + username2;

  // Create a user for user1
  await page1.goto("/login");
  await page1.getByRole("button", { name: "Create New Account" }).click();
  await page1.getByLabel("Username").fill(username1);
  await page1.getByLabel("Password", { exact: true }).fill(password1);
  await page1.getByLabel("Confirm Password").fill(password1);
  await page1.getByRole("button", { name: "Sign Up" }).click();
  await page1.waitForURL("/");

  // User1 clicks the table in the lobby
  await page1.getByTestId(tableId).click();
  await page1.waitForURL(/\/game\/.+/);
  await page1.getByPlaceholder("Send a message to chat").click();

  if (doAssess) {
    await expect(page1.getByText("you are player #1")).toBeVisible();
  }

  // Create a user for user2
  await page2.goto("/login");
  await page2.getByRole("button", { name: "Create New Account" }).click();
  await page2.getByLabel("Username").fill(username2);
  await page2.getByLabel("Password", { exact: true }).fill(password2);
  await page2.getByLabel("Confirm Password").fill(password2);
  await page2.getByRole("button", { name: "Sign Up" }).click();
  await page2.waitForURL("/");

  // User2 clicks the same table in the lobby
  await page2.getByTestId(tableId).click();
  await page2.waitForURL(/\/game\/.+/);

  if (gameStartsAutomatically) {
    if (doAssess) {
      await expect(page1.getByRole("button", { name: "Start Game" })).not.toBeVisible();
      await expect(page2.getByRole("button", { name: "Start Game" })).not.toBeVisible();
    }
  } else {
    if (doAssess) {
      await expect(page1.getByRole("button", { name: "Start Game" })).toBeVisible();
      await expect(page2.getByRole("button", { name: "Start Game" })).toBeVisible();
    }
    await page1.getByRole("button", { name: "Start Game" }).click();
  }

  if (doAssess) {
    await expect(page1.getByText("waiting for game to begin")).not.toBeVisible();
    await expect(page2.getByText("waiting for game to begin")).not.toBeVisible();
  }

  return username1;
}
