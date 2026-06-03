import { describe, expect, it } from "vitest";
import { isWinningHand } from "../../src/games/mahjong/mahjongWin.ts";
import { type MahjongTile, type MahjongMeld } from "@gamenite/shared/src/games/mahjong.types.ts";

describe("isWinningHand", () => {
  it("should recognize a winning hand with no melds", () => {
    const hand: MahjongTile[] = [
      "1d",
      "1d",
      "1d",
      "rd",
      "rd",
      "rd",
      "5c",
      "6c",
      "7c",
      "8d",
      "8d",
      "8d",
      "9d",
      "9d",
    ];
    const melds: MahjongMeld[] = [];
    expect(isWinningHand(hand, melds)).toBe(true);
  });

  it("should recognize a winning hand with one meld", () => {
    const hand: MahjongTile[] = ["1d", "1d", "1d", "nw", "nw", "nw", "5c", "6c", "7c", "8d", "8d"];
    const melds: MahjongMeld[] = [
      {
        type: "pong",
        tiles: ["9d", "9d", "9d"],
        concealed: false,
      },
    ];
    expect(isWinningHand(hand, melds)).toBe(true);
  });

  it("should recognize a non-winning hand", () => {
    const hand: MahjongTile[] = ["1d", "1d", "2b", "3b", "4b", "5c", "6c", "7c", "8d"];
    const melds: MahjongMeld[] = [];
    expect(isWinningHand(hand, melds)).toBe(false);
  });
});
