import { describe, expect, it } from "vitest";
import {
  scoreHand,
  seatWindForPlayer,
  resolveHandWin,
} from "../../src/games/mahjong/mahjongScoring.ts";
import type {
  MahjongTile,
  MahjongMeld,
  WinInfo,
  MahjongState,
} from "@gamenite/shared/src/games/mahjong.types.ts";

// ── helpers ───────────────────────────────────────────────────────────────────

const DiscardWin: WinInfo = {
  selfDraw: false,
  afterKong: false,
  afterMultipleKongs: false,
  finalTile: false,
  robbingKong: false,
  discarderIndex: 3,
  winningTile: "1d",
};

const SelfDrawWin: WinInfo = {
  selfDraw: true,
  afterKong: false,
  afterMultipleKongs: false,
  finalTile: false,
  robbingKong: false,
  discarderIndex: undefined,
  winningTile: "",
};

function makeCtx(
  hand: MahjongTile[],
  opts: {
    melds?: MahjongMeld[];
    flowers?: MahjongTile[];
    winInfo?: WinInfo;
    seatWind?: MahjongTile;
    roundWind?: MahjongTile;
    winnerIndex?: number;
  } = {},
) {
  return {
    hand,
    melds: opts.melds ?? [],
    flowers: opts.flowers ?? [],
    winInfo: opts.winInfo ?? DiscardWin,
    seatWind: opts.seatWind ?? "sw", // South seat by default
    roundWind: opts.roundWind ?? "ew", // East round by default
    winnerIndex: opts.winnerIndex ?? 0,
  };
}

function has(breakdown: { name: string }[], name: string): boolean {
  return breakdown.some((e) => e.name === name);
}

function makeState(overrides: Partial<MahjongState> = {}): MahjongState {
  return {
    wall: [],
    hands: [
      ["1b", "2b", "3b", "4b", "5b", "6b", "7b", "8b", "9b", "1c", "2c", "3c", "1d", "1d"],
      ["1d", "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "1b", "2b", "3b", "4b"],
      ["1c", "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "1d", "2d", "3d", "4d"],
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
    roundWind: "ew",
    afterKong: false,
    consecutiveKongsThisTurn: 0,
    scores: [0, 0, 0, 0],
    playAgainVotes: [null, null, null, null],
    initialDealer: 0,
    ...overrides,
  };
}

// a complete 14-tile winning hand used across many tests: 123b 456b 789b 123c + pair 1d
const BASE_HAND: MahjongTile[] = [
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

// ── seatWindForPlayer ─────────────────────────────────────────────────────────

describe("seatWindForPlayer", () => {
  it("dealer is East", () => {
    expect(seatWindForPlayer(0, 0)).toBe("ew");
  });
  it("next player counter-clockwise is South", () => {
    expect(seatWindForPlayer(1, 0)).toBe("sw");
  });
  it("player across from dealer is West", () => {
    expect(seatWindForPlayer(2, 0)).toBe("ww");
  });
  it("player to dealer's left is North", () => {
    expect(seatWindForPlayer(3, 0)).toBe("nw");
  });
  it("rotates correctly when dealer is not player 0", () => {
    // dealer=2: player 2=East, player 3=South, player 0=West, player 1=North
    expect(seatWindForPlayer(2, 2)).toBe("ew");
    expect(seatWindForPlayer(3, 2)).toBe("sw");
    expect(seatWindForPlayer(0, 2)).toBe("ww");
    expect(seatWindForPlayer(1, 2)).toBe("nw");
  });
});

// ── Thirteen Orphans ──────────────────────────────────────────────────────────

describe("scoreHand — Thirteen Orphans", () => {
  it("should score as limit hand", () => {
    const hand: MahjongTile[] = [
      "1d",
      "9d",
      "1b",
      "9b",
      "1c",
      "9c",
      "ew",
      "sw",
      "ww",
      "nw",
      "rd",
      "gd",
      "wd",
      "1d",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(result.isLimit).toBe(true);
    expect(result.points).toBe(128);
    expect(has(result.breakdown, "Thirteen Orphans")).toBe(true);
  });

  it("should not trigger with melds", () => {
    const hand: MahjongTile[] = [
      "9d",
      "1b",
      "9b",
      "1c",
      "9c",
      "ew",
      "sw",
      "ww",
      "nw",
      "rd",
      "gd",
      "wd",
      "1d",
    ];
    const melds: MahjongMeld[] = [{ type: "pong", tiles: ["1d", "1d", "1d"], concealed: false }];
    const result = scoreHand(makeCtx(hand, { melds }));
    expect(has(result.breakdown, "Thirteen Orphans")).toBe(false);
  });
});

// ── Nine Gates ────────────────────────────────────────────────────────────────

describe("scoreHand — Nine Gates", () => {
  it("should score as limit hand for a valid nine gates hand", () => {
    // 1112345678999 of characters + extra 5c
    const hand: MahjongTile[] = [
      "1c",
      "1c",
      "1c",
      "2c",
      "3c",
      "4c",
      "5c",
      "5c",
      "6c",
      "7c",
      "8c",
      "9c",
      "9c",
      "9c",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(result.isLimit).toBe(true);
    expect(has(result.breakdown, "Nine Gates")).toBe(true);
  });

  it("should not trigger for a mixed-suit hand", () => {
    const hand: MahjongTile[] = [
      "1c",
      "1c",
      "1c",
      "2c",
      "3c",
      "4c",
      "5c",
      "6c",
      "7c",
      "8c",
      "9c",
      "9c",
      "9c",
      "1d",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(has(result.breakdown, "Nine Gates")).toBe(false);
  });

  it("should not trigger with open melds", () => {
    const hand: MahjongTile[] = ["1c", "1c", "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "9c"];
    const melds: MahjongMeld[] = [{ type: "pong", tiles: ["1c", "1c", "1c"], concealed: false }];
    const result = scoreHand(makeCtx(hand, { melds }));
    expect(has(result.breakdown, "Nine Gates")).toBe(false);
  });
});

// ── Flowers ───────────────────────────────────────────────────────────────────

describe("scoreHand — flowers", () => {
  it("No Flowers: awards 1 fan when no flower tiles held", () => {
    const result = scoreHand(makeCtx(BASE_HAND, { flowers: [] }));
    expect(has(result.breakdown, "No Flowers")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "No Flowers")?.fan).toBe(1);
  });

  it("Seat Flower: awards 1 fan per flower matching the seat number", () => {
    // seat=sw (seat 2), f2 and s2 are seat flowers
    const result = scoreHand(makeCtx(BASE_HAND, { flowers: ["f2", "s2"], seatWind: "sw" }));
    const seatFlowers = result.breakdown.filter((e) => e.name === "Seat Flower");
    expect(seatFlowers).toHaveLength(2);
  });

  it("Set of Flowers: awards 2 fan for all four flower tiles", () => {
    const result = scoreHand(makeCtx(BASE_HAND, { flowers: ["f1", "f2", "f3", "f4"] }));
    expect(has(result.breakdown, "Set of Flowers")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "Set of Flowers")?.fan).toBe(2);
  });

  it("Set of Seasons: awards 2 fan for all four season tiles", () => {
    const result = scoreHand(makeCtx(BASE_HAND, { flowers: ["s1", "s2", "s3", "s4"] }));
    expect(has(result.breakdown, "Set of Seasons")).toBe(true);
  });

  it("7 Flowers: awards 3 fan for holding seven flower tiles", () => {
    const result = scoreHand(
      makeCtx(BASE_HAND, { flowers: ["f1", "f2", "f3", "f4", "s1", "s2", "s3"] }),
    );
    expect(has(result.breakdown, "7 Flowers")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "7 Flowers")?.fan).toBe(3);
  });

  it("8 Flowers: awards 8 fan for holding all eight flower tiles", () => {
    const result = scoreHand(
      makeCtx(BASE_HAND, { flowers: ["f1", "f2", "f3", "f4", "s1", "s2", "s3", "s4"] }),
    );
    expect(has(result.breakdown, "8 Flowers")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "8 Flowers")?.fan).toBe(8);
  });
});

// ── Win methods ───────────────────────────────────────────────────────────────

describe("scoreHand — win methods", () => {
  it("Self Draw: awards 1 fan", () => {
    const result = scoreHand(makeCtx(BASE_HAND, { winInfo: SelfDrawWin }));
    expect(has(result.breakdown, "Self Draw")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "Self Draw")?.fan).toBe(1);
  });

  it("Concealed Hand: awards 1 fan when all melds are concealed (or none)", () => {
    const result = scoreHand(makeCtx(BASE_HAND, { melds: [] }));
    expect(has(result.breakdown, "Concealed Hand")).toBe(true);
  });

  it("Concealed Hand: not awarded when there is an open meld", () => {
    // use melds for some sets so the hand is still valid
    const melds: MahjongMeld[] = [{ type: "pong", tiles: ["1d", "1d", "1d"], concealed: false }];
    const hand: MahjongTile[] = ["1b", "2b", "3b", "4b", "5b", "6b", "7b", "8b", "9b", "1c", "1c"];
    const result = scoreHand(makeCtx(hand, { melds }));
    expect(has(result.breakdown, "Concealed Hand")).toBe(false);
  });

  it("After a Kong: awards 1 fan", () => {
    const result = scoreHand(
      makeCtx(BASE_HAND, {
        winInfo: { ...SelfDrawWin, afterKong: true, afterMultipleKongs: false },
      }),
    );
    expect(has(result.breakdown, "After a Kong")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "After a Kong")?.fan).toBe(1);
  });

  it("After Multiple Kongs: awards 8 fan and not After a Kong", () => {
    const result = scoreHand(
      makeCtx(BASE_HAND, {
        winInfo: { ...SelfDrawWin, afterKong: true, afterMultipleKongs: true },
      }),
    );
    expect(has(result.breakdown, "After Multiple Kongs")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "After Multiple Kongs")?.fan).toBe(8);
    expect(has(result.breakdown, "After a Kong")).toBe(false);
  });

  it("Win on Final Tile: awards 1 fan", () => {
    const result = scoreHand(
      makeCtx(BASE_HAND, {
        winInfo: { ...DiscardWin, finalTile: true },
      }),
    );
    expect(has(result.breakdown, "Win on Final Tile")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "Win on Final Tile")?.fan).toBe(1);
  });

  it("Robbing a Kong: awards 1 fan", () => {
    const result = scoreHand(
      makeCtx(BASE_HAND, {
        winInfo: { ...DiscardWin, robbingKong: true },
      }),
    );
    expect(has(result.breakdown, "Robbing a Kong")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "Robbing a Kong")?.fan).toBe(1);
  });
});

// ── Flush ─────────────────────────────────────────────────────────────────────

describe("scoreHand — flush patterns", () => {
  it("Pure Flush: awards 7 fan for a single-suit hand with no honours", () => {
    // 123d 123d 456d 789d + pair 7d: all dots, no honours
    const hand: MahjongTile[] = [
      "1d",
      "2d",
      "3d",
      "1d",
      "2d",
      "3d",
      "4d",
      "5d",
      "6d",
      "7d",
      "8d",
      "9d",
      "7d",
      "7d",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(has(result.breakdown, "Pure Flush")).toBe(true);
    expect(has(result.breakdown, "Mixed Flush")).toBe(false);
    expect(result.breakdown.find((e) => e.name === "Pure Flush")?.fan).toBe(7);
  });

  it("Mixed Flush: awards 3 fan for a single suit mixed with honour tiles", () => {
    // 123c 456c 789c 345c + pair ew: characters + East wind
    const hand: MahjongTile[] = [
      "1c",
      "2c",
      "3c",
      "4c",
      "5c",
      "6c",
      "7c",
      "8c",
      "9c",
      "3c",
      "4c",
      "5c",
      "ew",
      "ew",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(has(result.breakdown, "Mixed Flush")).toBe(true);
    expect(has(result.breakdown, "Pure Flush")).toBe(false);
    expect(result.breakdown.find((e) => e.name === "Mixed Flush")?.fan).toBe(3);
  });

  it("no flush: no flush entry when tiles span multiple suits", () => {
    const result = scoreHand(makeCtx(BASE_HAND));
    expect(has(result.breakdown, "Pure Flush")).toBe(false);
    expect(has(result.breakdown, "Mixed Flush")).toBe(false);
  });
});

// ── Dragons ───────────────────────────────────────────────────────────────────

describe("scoreHand — dragon patterns", () => {
  it("Dragon Triplet: awards 1 fan per dragon pong when no special dragon hand", () => {
    // rd pong + 3 sequences + pair 1d
    const hand: MahjongTile[] = [
      "rd",
      "rd",
      "rd",
      "1c",
      "2c",
      "3c",
      "4c",
      "5c",
      "6c",
      "7c",
      "8c",
      "9c",
      "1d",
      "1d",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(has(result.breakdown, "Dragon Triplet")).toBe(true);
    expect(result.breakdown.filter((e) => e.name === "Dragon Triplet")).toHaveLength(1);
  });

  it("Small Three Dragons: awards 5 fan for two dragon pongs + dragon pair", () => {
    // rd pong + gd pong + wd pair + 2 sequences
    const hand: MahjongTile[] = [
      "rd",
      "rd",
      "rd",
      "gd",
      "gd",
      "gd",
      "wd",
      "wd",
      "1c",
      "2c",
      "3c",
      "4c",
      "5c",
      "6c",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(has(result.breakdown, "Small Three Dragons")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "Small Three Dragons")?.fan).toBe(5);
    expect(has(result.breakdown, "Dragon Triplet")).toBe(false);
  });

  it("Big Three Dragons: awards 8 fan for three dragon pongs", () => {
    // rd pong + gd pong + wd pong + sequence + pair 4c
    const hand: MahjongTile[] = [
      "rd",
      "rd",
      "rd",
      "gd",
      "gd",
      "gd",
      "wd",
      "wd",
      "wd",
      "1c",
      "2c",
      "3c",
      "4c",
      "4c",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(has(result.breakdown, "Big Three Dragons")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "Big Three Dragons")?.fan).toBe(8);
    expect(has(result.breakdown, "Dragon Triplet")).toBe(false);
  });
});

// ── Winds ─────────────────────────────────────────────────────────────────────

describe("scoreHand — wind patterns", () => {
  it("Round Wind Triplet: awards 1 fan for a pong matching the round wind", () => {
    // ew pong (matches East round) + 3 sequences + pair 1d
    // seatWind=nw so no seat wind bonus
    const hand: MahjongTile[] = [
      "ew",
      "ew",
      "ew",
      "1c",
      "2c",
      "3c",
      "4c",
      "5c",
      "6c",
      "7c",
      "8c",
      "9c",
      "1d",
      "1d",
    ];
    const result = scoreHand(makeCtx(hand, { roundWind: "ew", seatWind: "nw" }));
    expect(has(result.breakdown, "Round Wind Triplet")).toBe(true);
    expect(has(result.breakdown, "Seat Wind Triplet")).toBe(false);
  });

  it("Seat Wind Triplet: awards 1 fan for a pong matching the seat wind", () => {
    // sw pong (matches South seat) + 3 sequences + pair 1d
    // roundWind=nw so no round wind bonus
    const hand: MahjongTile[] = [
      "sw",
      "sw",
      "sw",
      "1c",
      "2c",
      "3c",
      "4c",
      "5c",
      "6c",
      "7c",
      "8c",
      "9c",
      "1d",
      "1d",
    ];
    const result = scoreHand(makeCtx(hand, { roundWind: "nw", seatWind: "sw" }));
    expect(has(result.breakdown, "Seat Wind Triplet")).toBe(true);
    expect(has(result.breakdown, "Round Wind Triplet")).toBe(false);
  });

  it("Double Wind: awards both Round and Seat Wind Triplet when round === seat", () => {
    // ew pong; both round and seat are East → 2 fan total from winds
    const hand: MahjongTile[] = [
      "ew",
      "ew",
      "ew",
      "1c",
      "2c",
      "3c",
      "4c",
      "5c",
      "6c",
      "7c",
      "8c",
      "9c",
      "1d",
      "1d",
    ];
    const result = scoreHand(makeCtx(hand, { roundWind: "ew", seatWind: "ew" }));
    expect(has(result.breakdown, "Round Wind Triplet")).toBe(true);
    expect(has(result.breakdown, "Seat Wind Triplet")).toBe(true);
  });

  it("Small Four Winds: awards 6 fan and removes Mixed Flush if present", () => {
    // ew, sw, ww pongs + nw pair + 123c seung (mixed flush without small four winds fix)
    const hand: MahjongTile[] = [
      "ew",
      "ew",
      "ew",
      "sw",
      "sw",
      "sw",
      "ww",
      "ww",
      "ww",
      "nw",
      "nw",
      "1c",
      "2c",
      "3c",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(has(result.breakdown, "Small Four Winds")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "Small Four Winds")?.fan).toBe(6);
    expect(has(result.breakdown, "Mixed Flush")).toBe(false);
  });

  it("Big Four Winds: is a limit hand", () => {
    // ew, sw, ww, nw pongs + rd pair (all four wind pongs)
    const hand: MahjongTile[] = [
      "ew",
      "ew",
      "ew",
      "sw",
      "sw",
      "sw",
      "ww",
      "ww",
      "ww",
      "nw",
      "nw",
      "nw",
      "rd",
      "rd",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(result.isLimit).toBe(true);
    expect(has(result.breakdown, "Big Four Winds")).toBe(true);
  });

  it("All Honors: awards 10 fan for a hand of only wind and dragon tiles", () => {
    // ew,sw pongs + rd,gd pongs + wd pair; roundWind/seatWind=nw avoids extra wind bonus
    const hand: MahjongTile[] = [
      "ew",
      "ew",
      "ew",
      "sw",
      "sw",
      "sw",
      "rd",
      "rd",
      "rd",
      "gd",
      "gd",
      "gd",
      "wd",
      "wd",
    ];
    const result = scoreHand(makeCtx(hand, { roundWind: "nw", seatWind: "nw" }));
    expect(has(result.breakdown, "All Honors")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "All Honors")?.fan).toBe(10);
  });
});

// ── Triplet patterns ──────────────────────────────────────────────────────────

describe("scoreHand — triplet patterns", () => {
  it("All Triplets: awards 3 fan when all sets are pongs and at least one is open", () => {
    const melds: MahjongMeld[] = [{ type: "pong", tiles: ["1d", "1d", "1d"], concealed: false }];
    // 3 concealed pongs + open pong + pair
    const hand: MahjongTile[] = ["1b", "1b", "1b", "1c", "1c", "1c", "2b", "2b", "2b", "5d", "5d"];
    const result = scoreHand(makeCtx(hand, { melds }));
    expect(has(result.breakdown, "All Triplets")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "All Triplets")?.fan).toBe(3);
    expect(has(result.breakdown, "Four Concealed Triplets")).toBe(false);
  });

  it("Four Concealed Triplets: awards 8 fan when all four pongs are concealed", () => {
    // 4 concealed pongs + pair: all bamboo
    const hand: MahjongTile[] = [
      "1b",
      "1b",
      "1b",
      "2b",
      "2b",
      "2b",
      "3b",
      "3b",
      "3b",
      "4b",
      "4b",
      "4b",
      "5b",
      "5b",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(has(result.breakdown, "Four Concealed Triplets")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "Four Concealed Triplets")?.fan).toBe(8);
    expect(has(result.breakdown, "All Triplets")).toBe(false);
  });

  it("Four Kongs: is a limit hand", () => {
    const melds: MahjongMeld[] = [
      { type: "kong", tiles: ["1d", "1d", "1d", "1d"], concealed: true },
      { type: "kong", tiles: ["2d", "2d", "2d", "2d"], concealed: true },
      { type: "kong", tiles: ["3d", "3d", "3d", "3d"], concealed: true },
      { type: "kong", tiles: ["4d", "4d", "4d", "4d"], concealed: false },
    ];
    const hand: MahjongTile[] = ["5d", "5d"]; // just the pair
    const result = scoreHand(makeCtx(hand, { melds }));
    expect(result.isLimit).toBe(true);
    expect(has(result.breakdown, "Four Kongs")).toBe(true);
  });

  it("Mixed Terminals: awards 4 fan for terminals and honours only", () => {
    // 111d, 999d, 111c, 999c pongs + ew pair; roundWind/seatWind=nw
    const hand: MahjongTile[] = [
      "1d",
      "1d",
      "1d",
      "9d",
      "9d",
      "9d",
      "1c",
      "1c",
      "1c",
      "9c",
      "9c",
      "9c",
      "ew",
      "ew",
    ];
    const result = scoreHand(makeCtx(hand, { roundWind: "nw", seatWind: "nw" }));
    expect(has(result.breakdown, "Mixed Terminals")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "Mixed Terminals")?.fan).toBe(4);
    expect(has(result.breakdown, "All Terminals")).toBe(false);
  });

  it("All Terminals: is a limit hand", () => {
    // 111d, 999d, 111c, 999c pongs + pair 1b
    const hand: MahjongTile[] = [
      "1d",
      "1d",
      "1d",
      "9d",
      "9d",
      "9d",
      "1c",
      "1c",
      "1c",
      "9c",
      "9c",
      "9c",
      "1b",
      "1b",
    ];
    const result = scoreHand(makeCtx(hand));
    expect(result.isLimit).toBe(true);
    expect(has(result.breakdown, "All Terminals")).toBe(true);
  });
});

// ── Sequence patterns ─────────────────────────────────────────────────────────

describe("scoreHand — sequence patterns", () => {
  it("All Sequences: awards 1 fan when all four sets are sequences", () => {
    // 123b, 456b, 234c, 567d seungs + pair 9b9b — all different, mixed suits
    const hand: MahjongTile[] = [
      "1b",
      "2b",
      "3b",
      "4b",
      "5b",
      "6b",
      "2c",
      "3c",
      "4c",
      "5d",
      "6d",
      "7d",
      "9b",
      "9b",
    ];
    const result = scoreHand(makeCtx(hand, { roundWind: "nw", seatWind: "nw" }));
    expect(has(result.breakdown, "All Sequences")).toBe(true);
    expect(result.breakdown.find((e) => e.name === "All Sequences")?.fan).toBe(1);
  });

  it("picks the higher-scoring decomposition when multiple are valid", () => {
    // this hand decomposes as either 3 pongs + 1 seung (Pure Flush only = 7 fan)
    // or 4 seungs (Pure Flush + All Sequences = 8 fan) — scoring should prefer the latter
    const hand: MahjongTile[] = [
      "1d",
      "1d",
      "1d",
      "2d",
      "2d",
      "2d",
      "3d",
      "3d",
      "3d",
      "4d",
      "5d",
      "6d",
      "7d",
      "7d",
    ];
    const result = scoreHand(makeCtx(hand, { roundWind: "nw", seatWind: "nw" }));
    expect(has(result.breakdown, "All Sequences")).toBe(true);
    expect(has(result.breakdown, "Pure Flush")).toBe(true);
  });
});

// ── Payment calculation ───────────────────────────────────────────────────────

describe("scoreHand — payments", () => {
  it("self-draw: all three other players pay the hand value, winner receives triple", () => {
    // use a high-fan hand so points are meaningful
    const hand: MahjongTile[] = [
      "1d",
      "2d",
      "3d",
      "4d",
      "5d",
      "6d",
      "7d",
      "8d",
      "9d",
      "1d",
      "2d",
      "3d",
      "7d",
      "7d",
    ];
    const result = scoreHand(
      makeCtx(hand, {
        winInfo: SelfDrawWin,
        winnerIndex: 0,
        roundWind: "nw",
        seatWind: "nw",
      }),
    );
    const { payments, points } = result;
    // winner receives 3x
    expect(payments[0]).toBe(-(points * 3));
    // each other player pays once
    expect(payments[1]).toBe(points);
    expect(payments[2]).toBe(points);
    expect(payments[3]).toBe(points);
    // zero-sum
    expect(payments.reduce((s, p) => s + p, 0)).toBe(0);
  });

  it("discard win: only the discarder pays 2x, others pay nothing", () => {
    const result = scoreHand(
      makeCtx(BASE_HAND, {
        winInfo: { ...DiscardWin, discarderIndex: 2 },
        winnerIndex: 0,
      }),
    );
    const { payments, points } = result;
    expect(payments[0]).toBe(-(points * 2)); // winner receives
    expect(payments[1]).toBe(0); // uninvolved
    expect(payments[2]).toBe(points * 2); // discarder pays double
    expect(payments[3]).toBe(0); // uninvolved
    expect(payments.reduce((s, p) => s + p, 0)).toBe(0);
  });
});

// ── resolveHandWin ────────────────────────────────────────────────────────────

describe("resolveHandWin", () => {
  const winInfo: WinInfo = {
    selfDraw: true,
    afterKong: false,
    afterMultipleKongs: false,
    finalTile: false,
    robbingKong: false,
    discarderIndex: undefined,
    winningTile: "",
  };

  it("transitions state to voting phase with winner set", () => {
    const state = makeState();
    const result = resolveHandWin(state, 0, winInfo);
    expect(result.phase).toBe("voting");
    expect(result.winner).toBe(0);
  });

  it("populates lastScoring", () => {
    const state = makeState();
    const result = resolveHandWin(state, 0, winInfo);
    expect(result.lastScoring).toBeDefined();
    expect(result.lastScoring?.points).toBeGreaterThan(0);
  });

  it("applies payments to cumulative scores (self-draw: others lose, winner gains)", () => {
    const state = makeState({ scores: [0, 0, 0, 0] });
    const result = resolveHandWin(state, 0, winInfo);
    expect(result.scores[0]).toBeGreaterThan(0); // winner received chips
    expect(result.scores[1]).toBeLessThan(0); // others paid
    expect(result.scores[2]).toBeLessThan(0);
    expect(result.scores[3]).toBeLessThan(0);
    // zero-sum: total scores unchanged
    expect(result.scores.reduce((s, x) => s + x, 0)).toBe(0);
  });

  it("resets playAgainVotes to one null per player (4-player)", () => {
    const state = makeState({ scores: [0, 0, 0, 0] });
    const result = resolveHandWin(state, 0, winInfo);
    expect(result.playAgainVotes).toStrictEqual([null, null, null, null]);
  });

  it("resets playAgainVotes to one null per player (3-player)", () => {
    const state = makeState({
      hands: [
        ["1b", "2b", "3b", "4b", "5b", "6b", "7b", "8b", "9b", "1c", "2c", "3c", "1d", "1d"],
        ["1d", "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "1b", "2b", "3b", "4b"],
        ["1c", "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "1d", "2d", "3d", "4d"],
      ],
      melds: [[], [], []],
      flowers: [[], [], []],
      scores: [0, 0, 0],
      playAgainVotes: [null, null, null],
    });
    const result = resolveHandWin(state, 0, winInfo);
    expect(result.playAgainVotes).toStrictEqual([null, null, null]);
  });

  it("accumulates scores across multiple hands", () => {
    const state = makeState({ scores: [10, -5, 0, -5] });
    const result = resolveHandWin(state, 0, winInfo);
    // scores should build on top of the existing values
    expect(result.scores[0]).toBeGreaterThan(10);
    expect(result.scores.reduce((s, x) => s + x, 0)).toBe(0);
  });
});
