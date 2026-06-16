import { describe, expect, it } from "vitest";
import { getBotMeldResponse, getBotMove } from "../../src/games/mahjong/mahjongBot.ts";
import type { MahjongState } from "@gamenite/shared/src/games/mahjong.types.ts";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<MahjongState> = {}): MahjongState {
  return {
    wall: [],
    hands: [[], [], [], []],
    melds: [[], [], [], []],
    flowers: [[], [], [], []],
    discardPile: [],
    currentPlayer: 0,
    lastDiscard: null,
    phase: "discard",
    meldResponses: [null, null, null, null],
    dealer: 0,
    winner: null,
    roundWind: "ew",
    afterKong: false,
    consecutiveKongsThisTurn: 0,
    scores: [0, 0, 0, 0],
    playAgainVotes: [null, null, null, null],
    initialDealer: 0,
    ...overrides,
  };
}

// complete 14-tile winning hand: 123b 456b 789b 123c + pair 1d
const WINNING_HAND = [
  "1b",
  "2b",
  "3b",
  "4b",
  "5b",
  "6b",
  "7b",
  "8b",
  "9b",
  "1c",
  "2c",
  "3c",
  "1d",
  "1d",
];

// ── getBotMeldResponse ────────────────────────────────────────────────────────

describe("getBotMeldResponse", () => {
  it("should win when the discard completes the hand", () => {
    // hand needs 1d to complete 123b 456b 789b 123c + pair 1d
    const hand = ["1b", "2b", "3b", "4b", "5b", "6b", "7b", "8b", "9b", "1c", "2c", "3c", "1d"];
    const result = getBotMeldResponse(hand, [], "1d", 1, 0);
    expect(result).toStrictEqual({ type: "win" });
  });

  it("should kong when the bot has three matching tiles in hand", () => {
    const hand = ["2c", "2c", "2c", "3b", "4b", "5b", "6b", "7b", "8b", "9b", "1d", "2d"];
    const result = getBotMeldResponse(hand, [], "2c", 1, 0);
    expect(result).toStrictEqual({ type: "meld", with: ["2c", "2c", "2c"] });
  });

  it("should pong when the bot has two matching tiles in hand", () => {
    const hand = ["2c", "2c", "3b", "4b", "5b", "6b", "7b", "8b", "9b", "1d", "2d", "3d"];
    const result = getBotMeldResponse(hand, [], "2c", 1, 0);
    expect(result).toStrictEqual({ type: "meld", with: ["2c", "2c"] });
  });

  it("should seung using value+1 and value+2 when left of discarder", () => {
    // discard=5b, hand has 6b and 7b (discard is the low tile)
    const hand = ["6b", "7b", "1c", "2c", "3c", "4c", "5c", "6c", "7c", "1d", "2d", "3d"];
    const result = getBotMeldResponse(hand, [], "5b", 1, 0);
    expect(result.type).toBe("meld");
    if (result.type === "meld") {
      expect(result.with).toContain("6b");
      expect(result.with).toContain("7b");
    }
  });

  it("should seung using value-1 and value+1 when left of discarder", () => {
    // discard=5b, hand has 4b and 6b (discard is the middle tile)
    const hand = ["4b", "6b", "1c", "2c", "3c", "4c", "5c", "6c", "7c", "1d", "2d", "3d"];
    const result = getBotMeldResponse(hand, [], "5b", 1, 0);
    expect(result.type).toBe("meld");
    if (result.type === "meld") {
      expect(result.with).toContain("4b");
      expect(result.with).toContain("6b");
    }
  });

  it("should seung using value-2 and value-1 when left of discarder", () => {
    // discard=5b, hand has 3b and 4b (discard is the high tile)
    const hand = ["3b", "4b", "1c", "2c", "3c", "4c", "5c", "6c", "7c", "1d", "2d", "3d"];
    const result = getBotMeldResponse(hand, [], "5b", 1, 0);
    expect(result.type).toBe("meld");
    if (result.type === "meld") {
      expect(result.with).toContain("3b");
      expect(result.with).toContain("4b");
    }
  });

  it("should pass when not left of discarder even if seung is possible", () => {
    const hand = ["4b", "6b", "1c", "2c", "3c", "4c", "5c", "6c", "7c", "1d", "2d", "3d"];
    // player 2 is not left of player 0 (that would be player 1)
    const result = getBotMeldResponse(hand, [], "5b", 2, 0);
    expect(result).toStrictEqual({ type: "pass" });
  });

  it("should pass when left of discarder but no seung available", () => {
    // hand has no tiles that form a seung with discard "5b"
    const hand = ["1c", "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "1d", "2d", "3d"];
    const result = getBotMeldResponse(hand, [], "5b", 1, 0);
    expect(result).toStrictEqual({ type: "pass" });
  });

  it("should pass for an honour discard since honours cannot form sequences", () => {
    const hand = ["1c", "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "1d", "2d", "3d"];
    const result = getBotMeldResponse(hand, [], "ew", 1, 0);
    expect(result).toStrictEqual({ type: "pass" });
  });
});

// ── getBotMove ────────────────────────────────────────────────────────────────

describe("getBotMove", () => {
  describe("done phase", () => {
    it("should return null in done phase", () => {
      expect(getBotMove(makeState({ phase: "done" }), 0)).toBeNull();
    });
  });

  describe("voting phase", () => {
    it("should vote yes when the player has not yet voted", () => {
      const state = makeState({
        phase: "voting",
        playAgainVotes: [null, null, null, null],
      });
      expect(getBotMove(state, 0)).toStrictEqual({ type: "playAgain", vote: true });
    });

    it("should return null when the player already voted", () => {
      const state = makeState({
        phase: "voting",
        playAgainVotes: [true, null, null, null],
      });
      expect(getBotMove(state, 0)).toBeNull();
    });
  });

  describe("discard phase", () => {
    it("should return null when it is not the bot's turn", () => {
      const state = makeState({
        phase: "discard",
        currentPlayer: 1,
        hands: [["1d", "2d", "3d"], ["4d", "5d", "6d"], [], []],
      });
      expect(getBotMove(state, 0)).toBeNull();
    });

    it("should declare win when the hand is complete", () => {
      const state = makeState({
        phase: "discard",
        currentPlayer: 0,
        hands: [WINNING_HAND, [], [], []],
      });
      expect(getBotMove(state, 0)).toStrictEqual({ type: "win" });
    });

    it("should discard a tile from hand when the hand is not complete", () => {
      const nonWinningHand = [
        "1d",
        "3d",
        "5d",
        "7d",
        "9d",
        "1b",
        "3b",
        "5b",
        "7b",
        "9b",
        "1c",
        "3c",
        "5c",
      ];
      const state = makeState({
        phase: "discard",
        currentPlayer: 0,
        hands: [nonWinningHand, [], [], []],
      });
      const result = getBotMove(state, 0);
      expect(result?.type).toBe("discard");
      if (result?.type === "discard") {
        expect(nonWinningHand).toContain(result.tile);
      }
    });
  });

  describe("meld_window phase", () => {
    const meldWindowBase = {
      phase: "meld_window" as const,
      currentPlayer: 1, // player 1 discarded
      lastDiscard: "2c",
      meldResponses: [null, { type: "pass" } as const, null, null],
    };

    it("should return null for the discarder", () => {
      const state = makeState({ ...meldWindowBase });
      expect(getBotMove(state, 1)).toBeNull();
    });

    it("should return null when the player already responded", () => {
      const state = makeState({
        ...meldWindowBase,
        meldResponses: [{ type: "pass" }, { type: "pass" }, null, null],
      });
      expect(getBotMove(state, 0)).toBeNull();
    });

    it("should win when the discard completes the hand", () => {
      const hand = ["1b", "2b", "3b", "4b", "5b", "6b", "7b", "8b", "9b", "1c", "3c", "1d", "1d"];
      const state = makeState({
        ...meldWindowBase,
        lastDiscard: "2c",
        hands: [hand, [], [], []],
      });
      // 123b 456b 789b 123c + pair 1d → wins with 2c completing 123c
      expect(getBotMove(state, 0)).toStrictEqual({ type: "win" });
    });

    it("should pong when two matching tiles are in hand", () => {
      const hand = ["2c", "2c", "1d", "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "1b"];
      const state = makeState({
        ...meldWindowBase,
        lastDiscard: "2c",
        hands: [hand, [], [], []],
      });
      const result = getBotMove(state, 0);
      expect(result).toStrictEqual({ type: "meld", with: ["2c", "2c"] });
    });

    it("should kong when three matching tiles are in hand", () => {
      const hand = ["2c", "2c", "2c", "1d", "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d"];
      const state = makeState({
        ...meldWindowBase,
        lastDiscard: "2c",
        hands: [hand, [], [], []],
      });
      const result = getBotMove(state, 0);
      expect(result).toStrictEqual({ type: "meld", with: ["2c", "2c", "2c"] });
    });

    it("should pass when no beneficial meld is possible", () => {
      const hand = ["1d", "3d", "5d", "7d", "9d", "1b", "3b", "5b", "7b", "9b", "1c", "3c"];
      const state = makeState({
        ...meldWindowBase,
        lastDiscard: "2c",
        hands: [hand, [], [], []],
      });
      expect(getBotMove(state, 0)).toStrictEqual({ type: "pass" });
    });
  });
});
