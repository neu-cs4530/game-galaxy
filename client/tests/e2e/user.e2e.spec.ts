import { test, expect } from "@playwright/test";
import { logInUser } from "./testUtils.ts";

test.describe("User profile and account", () => {
  const username = "user3";
  const password = "pwd3333";
  const display = "Sushiiiiii";

  test("should show the logged-in user's name and coin balance in the header", async ({ page }) => {
    await logInUser(page, username, password);

    await expect(page.getByText(`User: ${display}`)).toBeVisible();
    await expect(page.getByText(/Coins: \d+/)).toBeVisible();
  });

  test("should navigate to the user's own profile and show editable info", async ({ page }) => {
    await logInUser(page, username, password);

    await page.getByRole("button", { name: "Profile" }).click();
    await page.waitForURL(`/profile/${username}`);

    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByText(`Username: ${username}`)).toBeVisible();
    await expect(page.getByText(/Games won: \d+/)).toBeVisible();

    // Viewing your own profile exposes the edit controls
    await expect(page.getByRole("heading", { name: "Display name" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
  });

  test("should return to the lobby from the profile page", async ({ page }) => {
    await logInUser(page, username, password);

    await page.getByRole("button", { name: "Profile" }).click();
    await page.waitForURL(`/profile/${username}`);

    // The header's Lobby button is shown on any page other than the lobby
    await page.getByRole("button", { name: "Lobby" }).click();
    await page.waitForURL("/");
    await expect(page.getByText(`User: ${display}`)).toBeVisible();
  });

  test("should reset edits to the display name field", async ({ page }) => {
    await logInUser(page, username, password);
    await page.getByRole("button", { name: "Profile" }).click();
    await page.waitForURL(`/profile/${username}`);

    // The display name field is the first textbox (the password fields follow it)
    const displayInput = page.getByRole("textbox").first();
    await expect(displayInput).toHaveValue(display);

    await displayInput.fill("A Different Name");
    await expect(displayInput).toHaveValue("A Different Name");

    // The Reset button next to the field restores the current display name
    await page.getByRole("button", { name: "Reset" }).first().click();
    await expect(displayInput).toHaveValue(display);
  });

  test("should toggle password visibility on the profile page", async ({ page }) => {
    await logInUser(page, username, password);
    await page.getByRole("button", { name: "Profile" }).click();
    await page.waitForURL(`/profile/${username}`);

    const toggle = page.getByRole("button", { name: "Toggle show password" });
    await expect(toggle).toHaveText("Reveal");

    await toggle.click();
    await expect(toggle).toHaveText("Hide");

    await toggle.click();
    await expect(toggle).toHaveText("Reveal");
  });

  test("should log the user out and return to the login page", async ({ page }) => {
    await logInUser(page, username, password);

    await page.getByRole("button", { name: "Log Out" }).click();
    await page.waitForURL("/login");

    await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
    await expect(page.getByText(`User: ${display}`)).not.toBeVisible();
  });
});
