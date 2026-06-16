import type {
  MahjongTile,
  MahjongMeld,
  MahjongState,
  WinInfo,
  FanEntry,
  MahjongScoring,
} from "@gamenite/shared/src/games/mahjong.types.ts";
import { getSuit, getValue, isWind, isDragon, removeOne } from "./mahjongTiles.ts";

// ── fan point table ───────────────────────────────────────────────────────────

const LIMIT_FAN = 10;
const LIMIT_POINTS = 128;

const FanToPoints: Record<number, number> = {
  0: 1,
  1: 2,
  2: 4,
  3: 8,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
  9: 96,
  10: 128,
};

function fanToPoints(fan: number): number {
  if (fan >= LIMIT_FAN) return LIMIT_POINTS;
  return FanToPoints[Math.max(0, fan)] ?? LIMIT_POINTS;
}

// ── tile helpers ──────────────────────────────────────────────────────────────

function isTerminal(t: MahjongTile): boolean {
  const v = getValue(t);
  return v === 1 || v === 9;
}

function isHonor(t: MahjongTile): boolean {
  return isWind(t) || isDragon(t);
}

// seat wind mapping: dealer = East, counter-clockwise order
const SEAT_WINDS: MahjongTile[] = ["ew", "sw", "ww", "nw"];

/**
 * Return the seat wind tile for a player given the current dealer index.
 * @param playerIndex - 0–3
 * @param dealerIndex - 0–3
 */
export function seatWindForPlayer(playerIndex: number, dealerIndex: number): MahjongTile {
  return SEAT_WINDS[(playerIndex - dealerIndex + 4) % 4];
}

// ── hand decomposition ────────────────────────────────────────────────────────

interface ConcealedSet {
  type: "pong" | "seung";
  tiles: MahjongTile[];
}

interface HandDecomposition {
  concealedSets: ConcealedSet[];
  pair: [MahjongTile, MahjongTile];
}

/**
 * Recursively find all valid decompositions of `tiles` into
 * `setsNeeded` sets (triplets or sequences) plus one pair.
 * Always processes the lexicographically smallest remaining tile first
 * to avoid redundant branches.
 */
function findDecompositions(
  tiles: MahjongTile[],
  setsNeeded: number,
  built: ConcealedSet[],
): HandDecomposition[] {
  if (setsNeeded === 0) {
    if (tiles.length === 2 && tiles[0] === tiles[1]) {
      return [{ concealedSets: built, pair: [tiles[0], tiles[1]] }];
    }
    return [];
  }
  if (tiles.length < setsNeeded * 3 + 2) return [];

  const sorted = [...tiles].sort();
  const first = sorted[0];
  const results: HandDecomposition[] = [];

  // try pong (3 identical tiles)
  if (sorted.filter((t) => t === first).length >= 3) {
    const rest = removeOne(removeOne(removeOne([...sorted], first), first), first);
    results.push(
      ...findDecompositions(rest, setsNeeded - 1, [
        ...built,
        { type: "pong", tiles: [first, first, first] },
      ]),
    );
  }

  // try seung (ascending sequence in same suit)
  const suit = getSuit(first);
  const val = getValue(first);
  if (suit && val !== null && val <= 7) {
    const t2 = `${val + 1}${suit}`;
    const t3 = `${val + 2}${suit}`;
    if (sorted.includes(t2) && sorted.includes(t3)) {
      const rest = removeOne(removeOne(removeOne([...sorted], first), t2), t3);
      results.push(
        ...findDecompositions(rest, setsNeeded - 1, [
          ...built,
          { type: "seung", tiles: [first, t2, t3] },
        ]),
      );
    }
  }

  return results;
}

// ── special hand detectors ────────────────────────────────────────────────────

function detectThirteenOrphans(hand: MahjongTile[], melds: MahjongMeld[]): boolean {
  if (melds.length > 0 || hand.length !== 14) return false;
  const required = ["1d", "9d", "1b", "9b", "1c", "9c", "ew", "sw", "ww", "nw", "rd", "gd", "wd"];
  return required.every((t) => hand.includes(t)) && new Set(hand).size === 13;
}

function detectNineGates(hand: MahjongTile[], melds: MahjongMeld[]): boolean {
  if (melds.length > 0 || hand.length !== 14) return false;
  const suits = new Set(hand.map((t) => getSuit(t)).filter(Boolean));
  if (suits.size !== 1) return false;
  const vals = hand.map((t) => getValue(t)).filter((v) => v !== null);
  if (vals.length !== 14) return false;
  const sorted = [...vals].sort((a, b) => a - b);
  const base = [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9];
  for (let extra = 1; extra <= 9; extra++) {
    const expected = [...base, extra].sort((a, b) => a - b);
    if (JSON.stringify(sorted) === JSON.stringify(expected)) return true;
  }
  return false;
}

// ── independent fan (flowers + winning method) ────────────────────────────────

function flowerFan(flowers: MahjongTile[], seatWind: MahjongTile): FanEntry[] {
  const entries: FanEntry[] = [];
  const seatNum = SEAT_WINDS.indexOf(seatWind) + 1; // 1=East, 2=South, 3=West, 4=North

  const total = flowers.length;

  if (total === 0) {
    return [{ name: "No Flowers", nameZh: "无花", fan: 1 }];
  }
  if (total >= 8) {
    return [{ name: "8 Flowers", nameZh: "八仙過海", fan: 8 }];
  }
  if (total === 7) {
    entries.push({ name: "7 Flowers", nameZh: "花糊", fan: 3 });
  }

  // set of flowers (all 4 of same series)
  if (flowers.filter((f) => f.startsWith("f")).length === 4) {
    entries.push({ name: "Set of Flowers", nameZh: "一台花", fan: 2 });
  }
  if (flowers.filter((f) => f.startsWith("s")).length === 4) {
    entries.push({ name: "Set of Seasons", nameZh: "一台花", fan: 2 });
  }

  // seat flowers (each flower/season tile matching your seat number)
  const seatFlowerCount = flowers.filter((f) => parseInt(f[1]) === seatNum).length;
  for (let i = 0; i < seatFlowerCount; i++) {
    entries.push({ name: "Seat Flower", nameZh: "正花", fan: 1 });
  }

  return entries;
}

function winMethodFan(winInfo: WinInfo, melds: MahjongMeld[]): FanEntry[] {
  const entries: FanEntry[] = [];
  // concealed hand: no open melds (concealed kongs are allowed)
  const isConcealed = melds.every((m) => m.concealed);

  if (winInfo.selfDraw) entries.push({ name: "Self Draw", nameZh: "自摸", fan: 1 });
  if (isConcealed) entries.push({ name: "Concealed Hand", nameZh: "門前清", fan: 1 });
  if (winInfo.finalTile) entries.push({ name: "Win on Final Tile", nameZh: "海底撈月", fan: 1 });
  if (winInfo.robbingKong) entries.push({ name: "Robbing a Kong", nameZh: "搶槓", fan: 1 });

  if (winInfo.afterMultipleKongs) {
    entries.push({ name: "After Multiple Kongs", nameZh: "槓上槓自摸", fan: 8 });
  } else if (winInfo.afterKong) {
    entries.push({ name: "After a Kong", nameZh: "槓上自摸", fan: 1 });
  }

  return entries;
}

// ── decomposition-based fan ───────────────────────────────────────────────────

const DRAGONS: MahjongTile[] = ["rd", "gd", "wd"];
const WINDS: MahjongTile[] = ["ew", "sw", "ww", "nw"];

function decompositionFan(
  decomp: HandDecomposition,
  melds: MahjongMeld[],
  seatWind: MahjongTile,
  roundWind: MahjongTile,
): FanEntry[] {
  const entries: FanEntry[] = [];

  // all sets: concealed from decomposition + declared melds
  const allSets: { type: string; tiles: MahjongTile[]; concealed: boolean }[] = [
    ...decomp.concealedSets.map((s) => ({ ...s, concealed: true })),
    ...melds.map((m) => ({ type: m.type, tiles: m.tiles, concealed: m.concealed })),
  ];
  const pair = decomp.pair;

  // every tile in the complete hand (sets + pair)
  const allTiles: MahjongTile[] = [...allSets.flatMap((s) => s.tiles), ...pair];

  // ── flush ─────────────────────────────────────────────────────────────────
  const nonHonorTiles = allTiles.filter((t) => !isHonor(t));
  const suits = new Set(nonHonorTiles.map((t) => getSuit(t)).filter(Boolean));
  const hasHonors = allTiles.some(isHonor);

  if (suits.size === 1 && !hasHonors) {
    entries.push({ name: "Pure Flush", nameZh: "清一色", fan: 7 });
  } else if (suits.size === 1 && hasHonors) {
    entries.push({ name: "Mixed Flush", nameZh: "混一色", fan: 3 });
  }

  // ── all honors ────────────────────────────────────────────────────────────
  if (allTiles.every(isHonor)) {
    entries.push({ name: "All Honors", nameZh: "字一色", fan: 10 });
  }

  // ── terminals ─────────────────────────────────────────────────────────────
  if (allTiles.every((t) => isTerminal(t))) {
    entries.push({ name: "All Terminals", nameZh: "清老頭", fan: LIMIT_FAN, isLimit: true });
  } else if (allTiles.every((t) => isTerminal(t) || isHonor(t))) {
    entries.push({ name: "Mixed Terminals", nameZh: "混老头", fan: 4 });
  }

  // ── triplet hands ─────────────────────────────────────────────────────────
  const pongKongSets = allSets.filter((s) => s.type === "pong" || s.type === "kong");
  const isAllTriplets = pongKongSets.length === 4;
  const isAllConcealed = allSets.every((s) => s.concealed);

  if (isAllTriplets) {
    if (isAllConcealed) {
      entries.push({ name: "Four Concealed Triplets", nameZh: "坎坎胡", fan: 8 });
    } else {
      entries.push({ name: "All Triplets", nameZh: "碰碰糊", fan: 3 });
    }
  }

  // ── all sequences ─────────────────────────────────────────────────────────
  if (allSets.filter((s) => s.type === "seung").length === 4) {
    entries.push({ name: "All Sequences", nameZh: "平糊", fan: 1 });
  }

  // ── dragons ───────────────────────────────────────────────────────────────
  const dragonSets = pongKongSets.filter((s) => DRAGONS.includes(s.tiles[0]));
  const dragonCount = dragonSets.length;
  const pairIsDragon = DRAGONS.includes(pair[0]);

  if (dragonCount === 3) {
    entries.push({ name: "Big Three Dragons", nameZh: "大三元", fan: 8 });
    // big three dragons subsumes individual dragon triplets
  } else if (dragonCount === 2 && pairIsDragon) {
    entries.push({ name: "Small Three Dragons", nameZh: "小三元", fan: 5 });
    // small three dragons subsumes individual dragon triplets
  } else {
    for (const _ of dragonSets) {
      entries.push({ name: "Dragon Triplet", nameZh: "箭刻", fan: 1 });
    }
  }

  // ── winds ─────────────────────────────────────────────────────────────────
  const windSets = pongKongSets.filter((s) => WINDS.includes(s.tiles[0]));
  const windCount = windSets.length;
  const pairIsWind = WINDS.includes(pair[0]);

  if (windCount === 4) {
    entries.push({ name: "Big Four Winds", nameZh: "大四喜", fan: LIMIT_FAN, isLimit: true });
    // remove mixed flush if present (big four winds subsumes it)
    const mfIdx = entries.findIndex((e) => e.nameZh === "混一色");
    if (mfIdx >= 0) entries.splice(mfIdx, 1);
  } else if (windCount === 3 && pairIsWind) {
    entries.push({ name: "Small Four Winds", nameZh: "小四喜", fan: 6 });
    // small four winds doesn't stack with mixed flush
    const mfIdx = entries.findIndex((e) => e.nameZh === "混一色");
    if (mfIdx >= 0) entries.splice(mfIdx, 1);
  } else {
    for (const s of windSets) {
      const wind = s.tiles[0];
      if (wind === roundWind)
        entries.push({ name: "Round Wind Triplet", nameZh: "圈風刻", fan: 1 });
      if (wind === seatWind) entries.push({ name: "Seat Wind Triplet", nameZh: "門風刻", fan: 1 });
    }
  }

  // ── kongs ─────────────────────────────────────────────────────────────────
  const kongCount = allSets.filter((s) => s.type === "kong").length;
  if (kongCount === 4) {
    entries.push({ name: "Four Kongs", nameZh: "十八羅漢", fan: LIMIT_FAN, isLimit: true });
  }

  return entries;
}

// ── payment calculation ───────────────────────────────────────────────────────

/**
 * Compute per-player payments.
 * Rule: 全铳制 (discarder pays all)
 * - Self-draw: each of the 3 other players pays `points`
 * - Discard win: the discarder pays `2 × points`; others pay nothing
 */
function computePayments(points: number, winInfo: WinInfo, winnerIndex: number): number[] {
  const payments = [0, 0, 0, 0];
  if (winInfo.selfDraw) {
    for (let i = 0; i < 4; i++) {
      if (i !== winnerIndex) payments[i] = points;
    }
    payments[winnerIndex] = -(points * 3);
  } else {
    const discarder = winInfo.discarderIndex!;
    payments[discarder] = points * 2;
    payments[winnerIndex] = -(points * 2);
  }
  return payments;
}

// ── main entry point ──────────────────────────────────────────────────────────

export interface ScoringContext {
  /** Complete concealed hand including the winning tile */
  hand: MahjongTile[];
  melds: MahjongMeld[];
  flowers: MahjongTile[];
  winInfo: WinInfo;
  seatWind: MahjongTile;
  roundWind: MahjongTile;
  winnerIndex: number;
}

/**
 * Score a winning hand and return the full breakdown.
 * Tries all valid decompositions and returns the highest-scoring one.
 *
 * @param ctx - all information needed to score the hand
 * @returns complete scoring result including fan breakdown and payments
 */
export function scoreHand(ctx: ScoringContext): MahjongScoring {
  const { hand, melds, flowers, winInfo, seatWind, roundWind, winnerIndex } = ctx;

  // ── limit: Thirteen Orphans ───────────────────────────────────────────────
  if (detectThirteenOrphans(hand, melds)) {
    const points = LIMIT_POINTS;
    return {
      totalFan: LIMIT_FAN,
      points,
      isLimit: true,
      breakdown: [{ name: "Thirteen Orphans", nameZh: "十三幺", fan: LIMIT_FAN, isLimit: true }],
      payments: computePayments(points, winInfo, winnerIndex),
    };
  }

  // ── limit: Nine Gates ─────────────────────────────────────────────────────
  if (detectNineGates(hand, melds)) {
    const points = LIMIT_POINTS;
    return {
      totalFan: LIMIT_FAN,
      points,
      isLimit: true,
      breakdown: [{ name: "Nine Gates", nameZh: "九子連環", fan: LIMIT_FAN, isLimit: true }],
      payments: computePayments(points, winInfo, winnerIndex),
    };
  }

  // ── standard hand ─────────────────────────────────────────────────────────
  const setsNeeded = 4 - melds.length;
  const decompositions = findDecompositions(hand, setsNeeded, []);

  const sharedEntries: FanEntry[] = [
    ...flowerFan(flowers, seatWind),
    ...winMethodFan(winInfo, melds),
  ];

  let best: MahjongScoring | null = null;

  for (const decomp of decompositions) {
    const decompEntries = decompositionFan(decomp, melds, seatWind, roundWind);
    const allEntries = [...sharedEntries, ...decompEntries];
    const isLimit = allEntries.some((e) => e.isLimit);
    const totalFan = isLimit
      ? LIMIT_FAN
      : allEntries.reduce((s, e) => s + (e.isLimit ? 0 : e.fan), 0);
    const points = isLimit ? LIMIT_POINTS : fanToPoints(totalFan);

    if (!best || totalFan > best.totalFan) {
      best = {
        totalFan,
        points,
        breakdown: allEntries,
        isLimit,
        payments: computePayments(points, winInfo, winnerIndex),
      };
    }
  }

  // fallback for valid hand with no decomposition found (shouldn't happen)
  if (!best) {
    const points = fanToPoints(0);
    return {
      totalFan: 0,
      points,
      breakdown: sharedEntries,
      isLimit: false,
      payments: computePayments(points, winInfo, winnerIndex),
    };
  }

  return best;
}

// ── hand result helper ────────────────────────────────────────────────────────

/**
 * Transition to the voting phase after a player wins a hand.
 * Computes the hand score, applies payments to cumulative scores,
 * and resets the play-again votes.
 *
 * @param state  - game state at the moment of the win
 * @param winner - index of the winning player
 * @param winInfo - how the hand was won
 */
export function resolveHandWin(
  state: MahjongState,
  winner: number,
  winInfo: WinInfo,
): MahjongState {
  // discard win: hand has 13 tiles; append winning tile to get 14
  // self-draw win: hand already has 14 tiles
  const completeHand = winInfo.selfDraw
    ? [...state.hands[winner]]
    : [...state.hands[winner], winInfo.winningTile];

  const scoring = scoreHand({
    hand: completeHand,
    melds: state.melds[winner],
    flowers: state.flowers[winner],
    winInfo,
    seatWind: seatWindForPlayer(winner, state.dealer),
    roundWind: state.roundWind,
    winnerIndex: winner,
  });

  // apply payments: payments[i] > 0 means player i pays, < 0 means receives
  const newScores = state.scores.map((s, i) => s - scoring.payments[i]);

  return {
    ...state,
    phase: "voting",
    winner,
    winInfo,
    scores: newScores,
    lastScoring: scoring,
    playAgainVotes: [null, null, null, null],
  };
}
