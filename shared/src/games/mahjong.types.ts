import { z } from "zod";

/**
 * A Mahjong tile represented as a compact string ID:
 * - Suit tiles:  "1d"–"9d" (dots), "1b"–"9b" (bamboo), "1c"–"9c" (characters/wan)
 * - Winds:       "ew", "sw", "ww", "nw" (East / South / West / North)
 * - Dragons:     "rd" (Red/中), "gd" (Green/發), "wd" (White/白)
 * - Flowers:     "f1"–"f4" (flowers), "s1"–"s4" (seasons)
 */
export type MahjongTile = string;

/**
 * A set of tiles that a player has declared openly (melded).
 * - `type`:      the kind of meld
 * - `tiles`:     the tiles in the meld (3 for pong/seung, 4 for kong)
 * - `concealed`: true only for a concealed kong
 */
export interface MahjongMeld {
  type: "pong" | "kong" | "seung";
  tiles: MahjongTile[];
  concealed: boolean;
}

/**
 * A single player's response during the meld window.
 * Every non-discarding player must submit one of these before the
 * window resolves.
 */
export type MahjongMeldResponse =
  | { type: "pass" }
  | { type: "pong" }
  | { type: "seung"; with: [MahjongTile, MahjongTile] }
  | { type: "kong" }
  | { type: "win" };

/**
 * Information about how the hand was won, used for scoring.
 */
export interface WinInfo {
  /** Player drew the winning tile themselves */
  selfDraw: boolean;
  /** Won with the replacement tile drawn after declaring a kong */
  afterKong: boolean;
  /** Won after declaring multiple kongs in a row (afterKong must also be true) */
  afterMultipleKongs: boolean;
  /** The winning tile was the last tile in the wall */
  finalTile: boolean;
  /** Won by robbing a promoted kong */
  robbingKong: boolean;
  /** Index of the player who discarded the winning tile (undefined for self-draw) */
  discarderIndex?: number;
  /** The tile that completed the hand */
  winningTile: MahjongTile;
}

/**
 * A single line in the fan-point breakdown.
 */
export interface FanEntry {
  name: string;
  nameZh: string;
  fan: number;
  /** True when this pattern overrides all others with a fixed limit score */
  isLimit?: boolean;
}

/**
 * Complete scoring result for a winning hand.
 * `payments[i]` is the number of points player i owes the winner
 * (positive = pays, negative = receives).
 */
export interface MahjongScoring {
  totalFan: number;
  points: number;
  breakdown: FanEntry[];
  isLimit: boolean;
  payments: number[];
}

/**
 * Full internal game state (never sent to clients directly).
 *
 * Phase semantics
 * - `'discard'`:      `currentPlayer` has a full hand and must act
 *   (discard, declare win, or declare kong).
 * - `'meld_window'`:  `currentPlayer` is the player who just discarded;
 *   every other player must submit a meld response before the window
 *   resolves.
 * - `'done'`:         game is over; `winner` is the winning player index
 *   or null for a draw (wall exhausted).
 */
export interface MahjongState {
  /**
   * Remaining live-wall tiles; next draw comes from index 0
   * dead-wall tiles come from the end of the list at index `wall.length - 1`
   */
  wall: MahjongTile[];
  /**
   * Concealed hand tiles, one array per player
   * first index is the player (0–3), second index is the tiles in that player's hand
   */
  hands: MahjongTile[][];
  /**
   * Declared meld sets, one array per player
   * first index is the player (0–3), second index is the melds that player has declared
   */
  melds: MahjongMeld[][];
  /**
   * Collected flower/season tiles, one array per player
   * first index is the player (0–3), second index is the flower/season tiles that player has collected
   */
  flowers: MahjongTile[][];
  /**
   * All tiles that have been discarded, in chronological order
   */
  discardPile: MahjongTile[];
  currentPlayer: number;
  /** The tile most recently discarded and available for melding */
  lastDiscard: MahjongTile | null;
  phase: "discard" | "meld_window" | "done";
  /**
   * During `meld_window`: each player's response.
   * `null` means the player has not yet responded.
   * The discarding player's entry is pre-set to `{ type: "pass" }`.
   */
  meldResponses: (MahjongMeldResponse | null)[];
  dealer: number;
  /** Index of the winning player, or null if the game ended in a draw */
  winner: number | null;
  /** Current round wind tile ("ew" | "sw" | "ww" | "nw") */
  roundWind: MahjongTile;
  /** Set when phase becomes "done" with a winner; absent for draws */
  winInfo?: WinInfo;
  /** True when the last tile drawn came from the dead wall (after a kong) */
  afterKong: boolean;
  /** Number of consecutive kongs declared this turn without a discard in between */
  consecutiveKongsThisTurn: number;
}

/** What a single player can see of their own position */
export interface MahjongPlayerView {
  /**
   * The viewing player's own concealed tiles
   */
  hand: MahjongTile[];
  melds: MahjongMeld[];
  flowers: MahjongTile[];
}

/** Client-facing snapshot of the game */
export interface MahjongView {
  players: MahjongPlayerView[];
  discardPile: MahjongTile[];
  wallSize: number;
  currentPlayer: number;
  lastDiscard: MahjongTile | null;
  phase: "discard" | "meld_window" | "done";
  /** Each player's meld-window response; useful for showing "waiting on…" */
  meldResponses: (MahjongMeldResponse | null)[];
  dealer: number;
  winner: number | null;
  /** Current round wind tile */
  roundWind: MahjongTile;
  /** Seat wind for each player index (derived from dealer position) */
  seatWinds: MahjongTile[];
  /** Populated when phase is "done" and there is a winner */
  scoring?: MahjongScoring;
}

export type MahjongMove = z.infer<typeof zMahjongMove>;
export const zMahjongMove = z.discriminatedUnion("type", [
  z.object({ type: z.literal("discard"), tile: z.string() }),
  z.object({ type: z.literal("win") }),
  z.object({ type: z.literal("kong"), tile: z.string().optional() }),
  z.object({ type: z.literal("pass") }),
  z.object({
    type: z.literal("meld"),
    with: z.array(z.string()),
  }),
]);
