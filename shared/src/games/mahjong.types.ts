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
}

/**
 * Every action a player can submit.
 *
 * In the `discard` phase (only the current player may act):
 *   - `discard`         – discard a tile from hand
 *   - `win`             – declare a self-draw win (Ji Mo)
 *   - `kong`            – declare a concealed or promoted kong; `tile` is
 *                         the tile to kong
 *
 * In the `meld_window` phase (any non-discarding player):
 *   - `pass`            – decline to meld
 *   - `win`             – claim the discard to complete a winning hand (Sik Wu)
 *   - `pong`            – claim the discard to form a triplet
 *   - `seung`           – claim the discard to form a sequence; `with` is the
 *                         two hand tiles that complete the sequence (left-of-
 *                         discarder only)
 *   - `kong`            – claim the discard to form a kong
 */
export type MahjongMove = z.infer<typeof zMahjongMove>;
export const zMahjongMove = z.discriminatedUnion("type", [
  z.object({ type: z.literal("discard"), tile: z.string() }),
  z.object({ type: z.literal("win") }),
  z.object({ type: z.literal("kong"), tile: z.string().optional() }),
  z.object({ type: z.literal("pass") }),
  z.object({ type: z.literal("pong") }),
  z.object({ type: z.literal("seung"), with: z.tuple([z.string(), z.string()]) }),
]);
