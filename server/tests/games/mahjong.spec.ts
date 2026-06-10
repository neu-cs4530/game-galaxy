import { describe, expect, it } from "vitest";
import { mahjongLogic } from "../../src/games/mahjong/mahjong.ts";
import type { MahjongState } from "@gamenite/shared/src/games/mahjong.types.ts";

// ── shared test states ────────────────────────────────────────────────────────

/**
 * A minimal state in the discard phase where it is player 0's turn.
 * Player 0 has a known hand, others have placeholder hands.
 */
const discardState: MahjongState = {
  wall: ["2b", "3b", "4b", "5b"],
  hands: [
    ["1c", "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "1d", "2d", "3d", "4d", "5d"],
    ["1b", "2b", "3b", "4b", "5b", "6b", "7b", "8b", "9b", "1c", "2c", "3c", "4c"],
    ["1d", "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "1b", "2b", "3b", "4b"],
    ["ew", "sw", "ww", "nw", "rd", "gd", "wd", "1c", "2c", "3c", "4c", "5c", "6c"],
  ],
  melds: [[], [], [], []],
  flowers: [[], [], [], []],
  discardPile: [],
  currentPlayer: 0,
  lastDiscard: null,
  phase: "discard",
  meldResponses: [null, null, null, null],
  dealer: 0,
  winner: null,
};

/**
 * A state in the meld window where player 0 discarded "3c".
 * Player 1 has "1c" and "2c" (eligible for seung as left-of-discarder).
 * Player 2 has two "3c" tiles (eligible for pong).
 * Player 3 has three "3c" tiles (eligible for kong).
 * This isnt a possible game state as there is only 4 of each tile but it is
 * useful for testing
 */
const meldWindowState: MahjongState = {
  wall: ["6b", "7b", "8b", "9b"],
  hands: [
    ["1c", "2c", "4c", "5c", "6c", "7c", "8c", "9c", "1d", "2d", "3d", "4d", "5d"],
    ["1c", "2c", "4b", "5b", "6b", "7b", "8b", "9b", "1d", "2d", "3d", "4d", "5d"],
    ["3c", "3c", "4d", "5d", "6d", "7d", "8d", "9d", "1b", "2b", "3b", "4b", "5b"],
    ["3c", "3c", "3c", "ew", "sw", "ww", "nw", "rd", "gd", "wd", "1d", "2d", "3d"],
  ],
  melds: [[], [], [], []],
  flowers: [[], [], [], []],
  discardPile: [],
  currentPlayer: 0,
  lastDiscard: "3c",
  phase: "meld_window",
  meldResponses: [{ type: "pass" }, null, null, null],
  dealer: 0,
  winner: null,
};

// ── start ─────────────────────────────────────────────────────────────────────

describe("mahjongLogic.start", () => {
  it("should deal 14 tiles to the dealer and 13 to each other player", () => {
    const state = mahjongLogic.start(4);
    expect(state.hands[0]).toHaveLength(14); // dealer
    expect(state.hands[1]).toHaveLength(13);
    expect(state.hands[2]).toHaveLength(13);
    expect(state.hands[3]).toHaveLength(13);
  });

  it("should start in discard phase with the dealer as current player", () => {
    const state = mahjongLogic.start(4);
    expect(state.phase).toBe("discard");
    expect(state.currentPlayer).toBe(0);
    expect(state.dealer).toBe(0);
  });

  it("should start with empty melds, flowers, and discard pile", () => {
    const state = mahjongLogic.start(4);
    expect(state.melds).toStrictEqual([[], [], [], []]);
    expect(state.discardPile).toHaveLength(0);
    expect(state.lastDiscard).toBeNull();
    expect(state.winner).toBeNull();
  });

  it("should place any flower tiles drawn during the deal into flowers, not hands", () => {
    const state = mahjongLogic.start(4);
    const flowerIds = ["f1", "f2", "f3", "f4", "s1", "s2", "s3", "s4"];
    for (const hand of state.hands) {
      for (const tile of hand) {
        expect(flowerIds).not.toContain(tile);
      }
    }
  });
});

// ── discard phase ─────────────────────────────────────────────────────────────

describe("mahjongLogic.update — discard phase", () => {
  it("should discard a tile, enter meld_window, and set lastDiscard", () => {
    const result = mahjongLogic.update(discardState, { type: "discard", tile: "1c" }, 0);
    expect(result?.phase).toBe("meld_window");
    expect(result?.lastDiscard).toBe("1c");
    expect(result?.hands[0]).not.toContain("1c");
    expect(result?.hands[0]).toHaveLength(13);
  });

  it("should not add the discarded tile to discardPile yet", () => {
    const result = mahjongLogic.update(discardState, { type: "discard", tile: "1c" }, 0);
    expect(result?.discardPile).toHaveLength(0);
  });

  it("should set the discarder's meld response to pass", () => {
    const result = mahjongLogic.update(discardState, { type: "discard", tile: "1c" }, 0);
    expect(result?.meldResponses[0]).toStrictEqual({ type: "pass" });
    expect(result?.meldResponses[1]).toBeNull();
    expect(result?.meldResponses[2]).toBeNull();
    expect(result?.meldResponses[3]).toBeNull();
  });

  it("should reject a discard from a player who is not the current player", () => {
    const result = mahjongLogic.update(discardState, { type: "discard", tile: "1b" }, 1);
    expect(result).toBeNull();
  });

  it("should reject discarding a tile not in the player's hand", () => {
    const result = mahjongLogic.update(discardState, { type: "discard", tile: "9b" }, 0);
    expect(result).toBeNull();
  });

  it("should reject a win declaration when the hand is not complete", () => {
    const result = mahjongLogic.update(discardState, { type: "win" }, 0);
    expect(result).toBeNull();
  });

  it("should accept a win declaration when the hand is complete", () => {
    const winState: MahjongState = {
      ...discardState,
      // 4 complete sets + 1 pair: 123c 456c 789c 123d + 4d pair = 14 tiles
      hands: [
        ["1c", "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "1d", "2d", "3d", "4d", "4d"],
        discardState.hands[1],
        discardState.hands[2],
        discardState.hands[3],
      ],
    };
    const result = mahjongLogic.update(winState, { type: "win" }, 0);
    expect(result?.phase).toBe("done");
    expect(result?.winner).toBe(0);
  });

  it("should reject a kong move with no tile specified", () => {
    const result = mahjongLogic.update(discardState, { type: "kong" }, 0);
    expect(result).toBeNull();
  });

  it("should reject a kong when the player does not have 4 of the tile and no pong meld", () => {
    const result = mahjongLogic.update(discardState, { type: "kong", tile: "1c" }, 0);
    expect(result).toBeNull();
  });

  it("should accept a concealed kong when the player has 4 identical tiles", () => {
    const kongState: MahjongState = {
      ...discardState,
      wall: ["9b", "8b"],
      hands: [
        ["1c", "1c", "1c", "1c", "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "1d", "2d"],
        discardState.hands[1],
        discardState.hands[2],
        discardState.hands[3],
      ],
    };
    const result = mahjongLogic.update(kongState, { type: "kong", tile: "1c" }, 0);
    expect(result?.melds[0][0].type).toBe("kong");
    expect(result?.melds[0][0].concealed).toBe(true);
    // 4 tiles removed from hand, 1 replacement drawn — net -3
    expect(result?.hands[0]).toHaveLength(kongState.hands[0].length - 3);
  });

  it("should accept a promoted kong when the player has a pong meld and drew the 4th tile", () => {
    const promotedKongState: MahjongState = {
      ...discardState,
      wall: ["9b", "8b"],
      hands: [
        // "4d" is in hand — the 4th tile matching the pong meld
        ["1c", "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "1d", "2d", "3d", "4d", "5d"],
        discardState.hands[1],
        discardState.hands[2],
        discardState.hands[3],
      ],
      melds: [[{ type: "pong", tiles: ["4d", "4d", "4d"], concealed: false }], [], [], []],
    };
    const result = mahjongLogic.update(promotedKongState, { type: "kong", tile: "4d" }, 0);
    expect(result?.melds[0][0].type).toBe("kong");
    expect(result?.melds[0][0].concealed).toBe(false);
  });

  it("should return null for an unrecognised move type in discard phase", () => {
    const result = mahjongLogic.update(discardState, { type: "pass" }, 0);
    expect(result).toBeNull();
    const result2 = mahjongLogic.update(discardState, { type: "meld" }, 0);
    expect(result2).toBeNull();
  });
});

// ── meld window ───────────────────────────────────────────────────────────────

describe("mahjongLogic.update — meld window", () => {
  it("should record a pass response without resolving", () => {
    const result = mahjongLogic.update(meldWindowState, { type: "pass" }, 1);
    expect(result?.phase).toBe("meld_window");
    expect(result?.meldResponses[1]).toStrictEqual({ type: "pass" });
  });

  it("should reject a response from the discarder", () => {
    const result = mahjongLogic.update(meldWindowState, { type: "pass" }, 0);
    expect(result).toBeNull();
  });

  it("should reject a response from a player who already responded", () => {
    const alreadyResponded: MahjongState = {
      ...meldWindowState,
      meldResponses: [{ type: "pass" }, { type: "pass" }, null, null],
    };
    const result = mahjongLogic.update(alreadyResponded, { type: "pass" }, 1);
    expect(result).toBeNull();
  });

  it("should accept a win when the discard completes the hand", () => {
    const winOnDiscardState: MahjongState = {
      ...meldWindowState,
      // player 1 needs "3c" to complete 123b 456b 789b 123c + 1d pair
      hands: [
        meldWindowState.hands[0],
        ["1b", "2b", "3b", "4b", "5b", "6b", "7b", "8b", "9b", "1c", "2c", "1d", "1d"],
        meldWindowState.hands[2],
        meldWindowState.hands[3],
      ],
      lastDiscard: "3c",
    };
    const result = mahjongLogic.update(winOnDiscardState, { type: "win" }, 1);
    expect(result?.meldResponses[1]).toStrictEqual({ type: "win" });
  });

  it("should reject a win when the discard does not complete the hand", () => {
    const result = mahjongLogic.update(meldWindowState, { type: "win" }, 1);
    expect(result).toBeNull();
  });

  it("should resolve and add discard to pile when all players pass", () => {
    const after1 = mahjongLogic.update(meldWindowState, { type: "pass" }, 1)!;
    const after2 = mahjongLogic.update(after1, { type: "pass" }, 2)!;
    const result = mahjongLogic.update(after2, { type: "pass" }, 3)!;
    expect(result.phase).toBe("discard");
    expect(result.discardPile).toContain("3c");
    expect(result.lastDiscard).toBeNull();
    expect(result.currentPlayer).toBe(1);
    expect(result.hands[1]).toHaveLength(meldWindowState.hands[1].length + 1);
  });

  it("should resolve a pong when all players respond", () => {
    const after1 = mahjongLogic.update(meldWindowState, { type: "pass" }, 1)!;
    const after2 = mahjongLogic.update(after1, { type: "meld", with: ["3c", "3c"] }, 2)!;
    const result = mahjongLogic.update(after2, { type: "pass" }, 3)!;
    expect(result.phase).toBe("discard");
    expect(result.currentPlayer).toBe(2);
    expect(result.melds[2][0].type).toBe("pong");
    expect(result.melds[2][0].tiles).toStrictEqual(["3c", "3c", "3c"]);
    expect(result.hands[2]).toHaveLength(meldWindowState.hands[2].length - 2);
    expect(result.discardPile).toHaveLength(meldWindowState.discardPile.length);
  });

  it("should resolve a seung for the player immediately left of the discarder", () => {
    const after1 = mahjongLogic.update(meldWindowState, { type: "meld", with: ["1c", "2c"] }, 1)!;
    const after2 = mahjongLogic.update(after1, { type: "pass" }, 2)!;
    const result = mahjongLogic.update(after2, { type: "pass" }, 3)!;
    expect(result.phase).toBe("discard");
    expect(result.currentPlayer).toBe(1);
    expect(result.melds[1][0].type).toBe("seung");
    expect(result.discardPile).toHaveLength(meldWindowState.discardPile.length);
  });

  it("should reject a seung from a player who is not left of the discarder", () => {
    const result = mahjongLogic.update(meldWindowState, { type: "meld", with: ["1c", "2c"] }, 3);
    expect(result).toBeNull();
  });

  it("should reject a meld with tiles not in the player's hand", () => {
    const result = mahjongLogic.update(meldWindowState, { type: "meld", with: ["9d", "8d"] }, 1);
    expect(result).toBeNull();
  });

  it("should reject a 2-tile meld that is neither a valid pong nor a valid seung", () => {
    const result = mahjongLogic.update(meldWindowState, { type: "meld", with: ["ew", "sw"] }, 3);
    expect(result).toBeNull();
  });

  it("should reject a 3-tile meld where the tiles don't all match the discard", () => {
    const result = mahjongLogic.update(
      meldWindowState,
      { type: "meld", with: ["3c", "3c", "1d"] },
      3,
    );
    expect(result).toBeNull();
  });

  it("should prefer pong over seung when both are claimed", () => {
    const after1 = mahjongLogic.update(meldWindowState, { type: "meld", with: ["1c", "2c"] }, 1)!;
    const after2 = mahjongLogic.update(after1, { type: "meld", with: ["3c", "3c"] }, 2)!;
    const result = mahjongLogic.update(after2, { type: "pass" }, 3)!;
    expect(result.currentPlayer).toBe(2);
    expect(result.melds[2][0].type).toBe("pong");
    expect(result.melds[1]).toHaveLength(0);
  });

  it("should resolve a kong from discard and draw a replacement", () => {
    const after1 = mahjongLogic.update(meldWindowState, { type: "pass" }, 1)!;
    const after2 = mahjongLogic.update(after1, { type: "pass" }, 2)!;
    const result = mahjongLogic.update(after2, { type: "meld", with: ["3c", "3c", "3c"] }, 3)!;
    expect(result.phase).toBe("discard");
    expect(result.currentPlayer).toBe(3);
    expect(result.melds[3][0].type).toBe("kong");
    expect(result.melds[3][0].tiles).toStrictEqual(["3c", "3c", "3c", "3c"]);
    expect(result.hands[3]).toHaveLength(meldWindowState.hands[3].length - 2);
  });

  it("should return null when in done phase", () => {
    const doneState: MahjongState = { ...discardState, phase: "done", winner: 0 };
    const result = mahjongLogic.update(doneState, { type: "pass" }, 1);
    expect(result).toBeNull();
  });
});

// ── isDone ────────────────────────────────────────────────────────────────────

describe("mahjongLogic.isDone", () => {
  it("should return true when phase is done", () => {
    expect(mahjongLogic.isDone({ ...discardState, phase: "done", winner: 0 })).toBe(true);
  });

  it("should return false when game is still in progress", () => {
    expect(mahjongLogic.isDone(discardState)).toBe(false);
    expect(mahjongLogic.isDone({ ...discardState, phase: "meld_window" })).toBe(false);
  });
});

// ── viewAs ────────────────────────────────────────────────────────────────────

describe("mahjongLogic.viewAs", () => {
  it("should show the viewing player their own hand and hide all others", () => {
    const view = mahjongLogic.viewAs(discardState, 0);
    expect(view.players[0].hand).toStrictEqual(discardState.hands[0]);
    expect(view.players[1].hand).toHaveLength(0);
    expect(view.players[2].hand).toHaveLength(0);
    expect(view.players[3].hand).toHaveLength(0);
  });

  it("should show no hands to a watcher (playerIndex -1)", () => {
    const view = mahjongLogic.viewAs(discardState, -1);
    for (const p of view.players) {
      expect(p.hand).toHaveLength(0);
    }
  });

  it("should expose the correct phase, currentPlayer, and lastDiscard", () => {
    const view = mahjongLogic.viewAs(meldWindowState, 0);
    expect(view.phase).toBe("meld_window");
    expect(view.currentPlayer).toBe(0);
    expect(view.lastDiscard).toBe("3c");
  });

  it("should expose wall size, discard pile, melds, and flowers", () => {
    const view = mahjongLogic.viewAs(meldWindowState, 0);
    expect(view.wallSize).toBe(meldWindowState.wall.length);
    expect(view.discardPile).toStrictEqual(meldWindowState.discardPile);
    expect(view.meldResponses).toStrictEqual(meldWindowState.meldResponses);
  });
});

// ── tagView and getWinners ────────────────────────────────────────────────────

describe("mahjongLogic.tagView", () => {
  it("should tag the view with type mahjong", () => {
    const view = mahjongLogic.viewAs(discardState, 0);
    expect(mahjongLogic.tagView(view)).toStrictEqual({ type: "mahjong", view });
  });
});

describe("mahjongLogic.getWinners", () => {
  it("should return the winner index when there is a winner", () => {
    expect(mahjongLogic.getWinners({ ...discardState, phase: "done", winner: 2 })).toStrictEqual([
      2,
    ]);
  });

  it("should return an empty array when there is no winner (draw)", () => {
    expect(mahjongLogic.getWinners({ ...discardState, phase: "done", winner: null })).toStrictEqual(
      [],
    );
  });
});
