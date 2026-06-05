import { describe, expect, it } from "vitest";
import { drawForPlayer } from "../../src/games/mahjong/mahjongDraw.ts";
import { type MahjongState } from "@gamenite/shared/src/games/mahjong.types.ts";

describe("drawForPlayer", () => {
  it("should draw a tile from the live wall into a player's hand", () => {
    const s: MahjongState = {
      wall: ["1d", "2b", "3c"],
      hands: [[], [], [], []],
      melds: [[], [], [], []],
      flowers: [[], [], [], []],
      discardPile: [],
      currentPlayer: 0,
      lastDiscard: "4b",
      phase: "discard",
      meldResponses: [null, null, null, null],
      dealer: 2,
      winner: null,
    };
    const newState = drawForPlayer(s, 0);
    expect(newState.hands[0]).toStrictEqual(["1d"]);
    expect(newState.wall).toStrictEqual(["2b", "3c"]);
  });

  it("should handle drawing a flower resulting in a draw from the dead wall", () => {
    const s: MahjongState = {
      wall: ["f2", "2b", "3c", "s4"],
      hands: [[], [], [], []],
      melds: [[], [], [], []],
      flowers: [[], [], [], []],
      discardPile: [],
      currentPlayer: 0,
      lastDiscard: "4b",
      phase: "discard",
      meldResponses: [null, null, null, null],
      dealer: 2,
      winner: null,
    };
    const newState = drawForPlayer(s, 1);
    expect(newState.hands[1]).toStrictEqual(["3c"]);
    expect(newState.flowers[1]).toStrictEqual(["f2", "s4"]);
    expect(newState.wall).toStrictEqual(["2b"]);
  });
});
