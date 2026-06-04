import { describe, expect, it } from "vitest";
import { resolveMeldWindow } from "../../src/games/mahjong/mahjongMeld.ts";
import { type MahjongState } from "@gamenite/shared/src/games/mahjong.types.ts";

describe("resolveMeldWindow", () => {
  it("should successfully resolve a win response", () => {
    const s: MahjongState = {
      wall: ["2b", "3b"],
      hands: [["1d", "1d", "1c", "2c", "3c", "rd", "rd", "rd", "sw", "sw"], [], [], []],
      melds: [[{ type: "pong", tiles: ["5c", "5c", "5c"], concealed: false }], [], [], []],
      flowers: [[], [], [], []],
      discardPile: [],
      currentPlayer: 3,
      lastDiscard: "1d",
      phase: "meld_window",
      meldResponses: [{ type: "kong" }, { type: "win" }, { type: "pong" }, { type: "pass" }],
      dealer: 0,
      winner: null,
    };
    const newState = resolveMeldWindow(s);
    expect(newState.winner).toBe(1);
    expect(newState.phase).toBe("done");
  });

  it("should successfully resolve a kong response", () => {
    const sInit: MahjongState = {
      wall: ["2b", "3b"],
      hands: [[], ["1d", "4d", "2c", "2c", "2c", "6c", "6c", "6c", "wd", "rd", "rd", "sw"], [], []],
      melds: [[{ type: "pong", tiles: ["5c", "5c", "5c"], concealed: false }], [], [], []],
      flowers: [[], [], [], []],
      discardPile: [],
      currentPlayer: 2,
      lastDiscard: "2c",
      phase: "meld_window",
      meldResponses: [{ type: "pass" }, { type: "kong" }, { type: "pass" }, { type: "pong" }],
      dealer: 0,
      winner: null,
    };
    const sFinal: MahjongState = {
      wall: ["2b"],
      hands: [[], ["3b", "6c", "6c", "6c", "1d", "4d", "sw", "rd", "rd", "wd"], [], []],
      melds: [
        [{ type: "pong", tiles: ["5c", "5c", "5c"], concealed: false }],
        [{ type: "kong", tiles: ["2c", "2c", "2c", "2c"], concealed: false }],
        [],
        [],
      ],
      flowers: [[], [], [], []],
      discardPile: [],
      currentPlayer: 1,
      lastDiscard: null,
      phase: "discard",
      meldResponses: [null, null, null, null],
      dealer: 0,
      winner: null,
    };
    const sTest = resolveMeldWindow(sInit);
    expect(sTest).toStrictEqual(sFinal);
  });
});
