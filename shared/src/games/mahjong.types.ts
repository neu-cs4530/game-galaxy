import { z } from "zod";

export type MahjongTile = string;

export interface MahjongMeld {
  type: "pong" | "kong" | "seung";
  tiles: MahjongTile[];
  concealed: boolean;
}

export type MahjongMeldResponse =
  | { type: "pass" }
  | { type: "pong" }
  | { type: "seung"; with: [MahjongTile, MahjongTile] }
  | { type: "kong" }
  | { type: "win" };

export interface WinInfo {
  selfDraw: boolean;
  afterKong: boolean;
  afterMultipleKongs: boolean;
  finalTile: boolean;
  robbingKong: boolean;
  discarderIndex?: number;
  winningTile: MahjongTile;
}

export interface FanEntry {
  name: string;
  nameZh: string;
  fan: number;
  isLimit?: boolean;
}

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
 * Phase semantics:
 * - `'discard'`:     currentPlayer has a full hand and must act.
 * - `'meld_window'`: currentPlayer just discarded; others must respond.
 * - `'voting'`:      hand ended; players vote to play again or stop.
 * - `'ended'`:       someone voted no; game is fully over.
 */
export interface MahjongState {
  wall: MahjongTile[];
  hands: MahjongTile[][];
  melds: MahjongMeld[][];
  flowers: MahjongTile[][];
  discardPile: MahjongTile[];
  currentPlayer: number;
  lastDiscard: MahjongTile | null;
  phase: "discard" | "meld_window" | "voting" | "done";
  meldResponses: (MahjongMeldResponse | null)[];
  dealer: number;
  winner: number | null;
  roundWind: MahjongTile;
  winInfo?: WinInfo;
  afterKong: boolean;
  consecutiveKongsThisTurn: number;
  /** Cumulative chip scores per player; carry over across hands */
  scores: number[];
  /** Each player's play-again vote: null = not yet voted */
  playAgainVotes: (boolean | null)[];
  /** The player index who was dealer at the very start of the game; never changes */
  initialDealer: number;
  /** Scoring result for the most recent completed hand */
  lastScoring?: MahjongScoring;
}

export interface MahjongPlayerView {
  hand: MahjongTile[];
  melds: MahjongMeld[];
  flowers: MahjongTile[];
}

export interface MahjongView {
  players: MahjongPlayerView[];
  discardPile: MahjongTile[];
  wallSize: number;
  currentPlayer: number;
  lastDiscard: MahjongTile | null;
  phase: "discard" | "meld_window" | "voting" | "done";
  meldResponses: (MahjongMeldResponse | null)[];
  dealer: number;
  winner: number | null;
  roundWind: MahjongTile;
  seatWinds: MahjongTile[];
  scores: number[];
  playAgainVotes: (boolean | null)[];
  /** Scoring for the most recently completed hand */
  lastScoring?: MahjongScoring;
}

export type MahjongMove = z.infer<typeof zMahjongMove>;
export const zMahjongMove = z.discriminatedUnion("type", [
  z.object({ type: z.literal("discard"), tile: z.string() }),
  z.object({ type: z.literal("win") }),
  z.object({ type: z.literal("kong"), tile: z.string().optional() }),
  z.object({ type: z.literal("pass") }),
  z.object({ type: z.literal("meld"), with: z.array(z.string()) }),
  z.object({ type: z.literal("playAgain"), vote: z.boolean() }),
]);
