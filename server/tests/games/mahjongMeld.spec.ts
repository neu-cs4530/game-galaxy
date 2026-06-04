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
    let sInit: MahjongState = {
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
    sInit = resolveMeldWindow(sInit);
    expect(sInit).toStrictEqual(sFinal);
  });

  it("should successfully resolve a pong response", () => {
    let sInit: MahjongState = {
      wall: ["2b", "3b"],
      hands: [[], [], ["1d", "4d", "2c", "2c", "4c", "6c", "6c", "6c", "wd", "rd", "rd", "sw"], []],
      melds: [[{ type: "pong", tiles: ["5c", "5c", "5c"], concealed: false }], [], [], []],
      flowers: [[], [], [], []],
      discardPile: [],
      currentPlayer: 1,
      lastDiscard: "rd",
      phase: "meld_window",
      meldResponses: [{ type: "pass" }, { type: "pass" }, { type: "pong" }, { type: "pass" }],
      dealer: 0,
      winner: null,
    };
    const sFinal: MahjongState = {
      wall: ["2b", "3b"],
      hands: [[], [], ["1d", "4d", "2c", "2c", "4c", "6c", "6c", "6c", "wd", "sw"], []],
      melds: [
        [{ type: "pong", tiles: ["5c", "5c", "5c"], concealed: false }],
        [],
        [{ type: "pong", tiles: ["rd", "rd", "rd"], concealed: false }],
        [],
      ],
      flowers: [[], [], [], []],
      discardPile: [],
      currentPlayer: 2,
      lastDiscard: null,
      phase: "discard",
      meldResponses: [null, null, null, null],
      dealer: 0,
      winner: null,
    };
    sInit = resolveMeldWindow(sInit);
    expect(sInit).toStrictEqual(sFinal);
  });

  it("should successfully resolve a seung response", () => {
    let sInit: MahjongState = {
      wall: ["2b", "3b"],
      hands: [[], [], [], ["1d", "4d", "2c", "2c", "4c", "6c", "6c", "6c", "wd", "rd", "rd", "sw"]],
      melds: [[{ type: "pong", tiles: ["5c", "5c", "5c"], concealed: false }], [], [], []],
      flowers: [[], [], [], []],
      discardPile: [],
      currentPlayer: 1,
      lastDiscard: "3c",
      phase: "meld_window",
      meldResponses: [
        { type: "pass" },
        { type: "pass" },
        { type: "pass" },
        { type: "seung", with: ["2c", "4c"] },
      ],
      dealer: 0,
      winner: null,
    };
    const sFinal: MahjongState = {
      wall: ["2b", "3b"],
      hands: [[], [], [], ["1d", "4d", "2c", "6c", "6c", "6c", "wd", "rd", "rd", "sw"]],
      melds: [
        [{ type: "pong", tiles: ["5c", "5c", "5c"], concealed: false }],
        [],
        [],
        [{ type: "seung", tiles: ["2c", "3c", "4c"], concealed: false }],
      ],
      flowers: [[], [], [], []],
      discardPile: [],
      currentPlayer: 3,
      lastDiscard: null,
      phase: "discard",
      meldResponses: [null, null, null, null],
      dealer: 0,
      winner: null,
    };
    sInit = resolveMeldWindow(sInit);
    expect(sInit).toStrictEqual(sFinal);
  });

  it("should successfully resolve when nobody melds", () => {
    let sInit: MahjongState = {
      wall: ["2b", "3b"],
      hands: [
        ["1d", "4d", "7d", "9d", "2b", "5b", "8b", "ew", "nw", "wd", "rd"], // player 0
        ["6c", "8c", "1d", "4d", "7d", "2b", "5b", "8b", "ew", "nw", "wd"], // player 1 - just discarded
        ["1b", "4b", "7b", "9b", "2c", "5c", "8c", "1d", "4d", "7d", "nw"], // player 2
        ["1b", "4b", "7b", "9b", "2d", "5d", "8d", "ew", "nw", "rd", "sw"], // player 3
      ],
      melds: [[], [], [], []],
      flowers: [[], [], [], []],
      discardPile: ["9c"],
      currentPlayer: 1,
      lastDiscard: "3c",
      phase: "meld_window",
      meldResponses: [{ type: "pass" }, { type: "pass" }, { type: "pass" }, { type: "pass" }],
      dealer: 0,
      winner: null,
    };
    const sFinal: MahjongState = {
      wall: ["3b"],
      hands: [
        ["1d", "4d", "7d", "9d", "2b", "5b", "8b", "ew", "nw", "wd", "rd"], // player 0
        ["6c", "8c", "1d", "4d", "7d", "2b", "5b", "8b", "ew", "nw", "wd"], // player 1 - just discarded
        ["1b", "2b", "4b", "7b", "9b", "2c", "5c", "8c", "1d", "4d", "7d", "nw"], // player 2
        ["1b", "4b", "7b", "9b", "2d", "5d", "8d", "ew", "nw", "rd", "sw"], // player 3
      ],
      melds: [[], [], [], []],
      flowers: [[], [], [], []],
      discardPile: ["9c", "3c"],
      currentPlayer: 2,
      lastDiscard: null,
      phase: "discard",
      meldResponses: [null, null, null, null],
      dealer: 0,
      winner: null,
    };
    sInit = resolveMeldWindow(sInit);
    expect(sInit).toStrictEqual(sFinal);
  });
});
