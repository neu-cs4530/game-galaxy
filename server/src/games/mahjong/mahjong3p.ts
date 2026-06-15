import {
  type MahjongState,
  type MahjongView,
  type MahjongMeldResponse,
  zMahjongMove,
  type MahjongTile,
} from "@gamenite/shared/src/games/mahjong.types.ts";
import type { GameLogic } from "../gameLogic.ts";
import { GameService } from "../gameServiceManager.ts";
import { removeOne, shuffle } from "./mahjongTiles.ts";
import { isWinningHand } from "./mahjongWin.ts";
import { drawForPlayer } from "./mahjongDraw.ts";
import { isValidSeung, resolveKong, resolveMeldWindow } from "./mahjongMeld.ts";

/**
 * Check whether every player has submitted a meld-window response.
 * @input responses - meld responses array
 * @returns true when no entry is null
 */
export function allResponded(responses: (MahjongMeldResponse | null)[]): boolean {
  return responses.every((r) => r !== null);
}

const SUITS = ["d", "c"] as const; // dots, characters
const WINDS = ["ew", "sw", "ww"] as const;
const DRAGONS = ["rd", "gd", "wd"] as const;
const FLOWERS = ["f1", "f2", "f3", "f4", "s1", "s2", "s3", "s4"] as const;

/**
 * Build a complete 144-tile Hong Kong Mahjong deck:
 * - 2 suits × 9 values × 4 copies = 72 suit tiles
 * - 3 winds × 4 copies            =  12 honour tiles
 * - 3 dragons × 4 copies          =  12 honour tiles
 * - 8 flower/season tiles × 1     =   8 bonus tiles
 * @input none
 * @returns unshuffled array of 104 tile strings
 */
export function createDeck(): MahjongTile[] {
  const tiles: MahjongTile[] = [];
  for (const suit of SUITS) {
    for (let v = 1; v <= 9; v++) {
      for (let i = 0; i < 4; i++) tiles.push(`${v}${suit}`);
    }
  }
  for (const wind of WINDS) {
    for (let i = 0; i < 4; i++) tiles.push(wind);
  }
  for (const dragon of DRAGONS) {
    for (let i = 0; i < 4; i++) tiles.push(dragon);
  }
  for (const flower of FLOWERS) {
    tiles.push(flower);
  }
  return tiles; // 104 tiles total
}

// ─────────────────────────────────────────────────
// Main game logic
// ─────────────────────────────────────────────────

export const mahjongLogic: GameLogic<MahjongState, MahjongView> = {
  minPlayers: 3,
  maxPlayers: 3,

  /* ── start ──────────────────────────────────────
   * Shuffle the 104-tile deck, deal 14 tiles to the dealer and 13 to each other player,
   * then replace any flower tiles drawn during the deal with replacements
   * from the dead wall (back of deck).
   * Dealer starts with the turn and the game begins in the 'discard' phase.
   * @input numPlayers - number of players (always 3)
   * @returns initial MahjongState
   */
  start: (_numPlayers) => {
    let state: MahjongState = {
      wall: shuffle(createDeck()),
      hands: [[], [], []],
      melds: [[], [], []],
      flowers: [[], [], []],
      discardPile: [],
      currentPlayer: 0,
      lastDiscard: null,
      phase: "discard",
      meldResponses: [null, null, null],
      dealer: 0,
      winner: null,
    };

    // dealer gets 14 tiles, everyone else gets 13
    const dealCounts = [14, 13, 13];
    for (let p = 0; p < 3; p++) {
      for (let i = 0; i < dealCounts[p]; i++) {
        state = drawForPlayer(state, p);
      }
    }
    return state;
  },

  /* ── update ─────────────────────────────────────
   * Process a single player action.  Returns null if the move is invalid.
   * The valid move types depend on the current phase:
   * - during 'discard' the current player can either discard a tile or declare a self-draw win;
   *   they can also declare a kong if they have the appropriate tiles, but this is optional and
   *   does not interrupt the normal turn flow (they still must discard or declare win after)
   * - during 'meld_window' any non-discarding player must respond to the most recent discard with
   *   a meld action (pong, kong, seung, or sik wu (a win)), or they can pass; all responses
   *   are checked to ensure they are valid before the window resolves. Once all
   *   players have responded the window resolves and the game state updates according to the
   *   highest-priority valid response (win > kong > pong > seung > pass).
   * @input state - current state
   * @input payload - raw move payload
   * @input playerIndex - acting player index
   * @returns new state or null
   */
  update: (state, payload, playerIndex) => {
    if (state.phase === "done") return null;

    const parsed = zMahjongMove.safeParse(payload);
    if (parsed.error) return null;
    const move = parsed.data;

    // ════════════════════════════════════════════
    // DISCARD PHASE — only the current player acts
    // ════════════════════════════════════════════
    if (state.phase === "discard") {
      if (playerIndex !== state.currentPlayer) return null;

      // ── discard a tile ──
      if (move.type === "discard") {
        const hand = state.hands[playerIndex];
        if (!hand.includes(move.tile)) return null;

        const newHand = removeOne(hand, move.tile);
        // discarder's meld-window response is always 'pass'
        const meldResponses: (MahjongMeldResponse | null)[] = [null, null, null];
        meldResponses[playerIndex] = { type: "pass" };

        const newState: MahjongState = {
          ...state,
          hands: state.hands.map((h, i) => (i === playerIndex ? newHand : [...h])),
          lastDiscard: move.tile,
          phase: "meld_window",
          meldResponses,
        };

        return newState;
      }

      // ── declare self-draw win (Ji Mo) ──
      if (move.type === "win") {
        if (!isWinningHand(state.hands[playerIndex], state.melds[playerIndex])) return null;
        return { ...state, phase: "done", winner: playerIndex };
      }

      // ── kong (concealed or promoted) ──
      if (move.type === "kong") {
        const tile = move.tile;
        if (!tile) return null;
        const hand = state.hands[playerIndex];

        // concealed kong: 4 identical tiles in hand
        if (hand.filter((t) => t === tile).length >= 4) {
          let newHand = [...hand];
          for (let i = 0; i < 4; i++) newHand = removeOne(newHand, tile);
          let next: MahjongState = {
            ...state,
            hands: state.hands.map((h, i) => (i === playerIndex ? newHand : [...h])),
          };
          next = resolveKong(next, playerIndex, tile, true);
          return next;
        }

        // promoted kong: player already has a pong meld and drew the 4th tile
        const pongIdx = state.melds[playerIndex].findIndex(
          (m) => m.type === "pong" && m.tiles[0] === tile,
        );
        if (pongIdx < 0) return null;
        if (!hand.includes(tile)) return null;

        const newHand = removeOne(hand, tile);
        const newMelds = state.melds[playerIndex].filter((_, i) => i !== pongIdx);
        let next: MahjongState = {
          ...state,
          hands: state.hands.map((h, i) => (i === playerIndex ? newHand : [...h])),
          melds: state.melds.map((m, i) => (i === playerIndex ? newMelds : [...m])),
        };
        next = resolveKong(next, playerIndex, tile);
        return next;
      }

      return null; // unrecognised move type for this phase
    }

    // ════════════════════════════════════════════
    // MELD WINDOW — any non-discarding player acts
    // ════════════════════════════════════════════
    if (state.phase === "meld_window") {
      // discarder cannot respond (already set to 'pass')
      if (playerIndex === state.currentPlayer) return null;
      // player already responded
      if (state.meldResponses[playerIndex] !== null) return null;

      const hand = state.hands[playerIndex];
      const discard = state.lastDiscard!;
      let response: MahjongMeldResponse | null = null;

      if (move.type === "win") {
        // discard must complete the hand
        if (!isWinningHand([...hand, discard], state.melds[playerIndex])) return null;
        response = { type: "win" };
      }

      if (move.type === "pass") {
        response = { type: "pass" };
      }

      if (move.type === "meld") {
        const [t1, t2, t3] = move.with;
        let newHand = [...hand];
        newHand = removeOne(newHand, t1);
        newHand = removeOne(newHand, t2);

        if (t3 !== undefined) {
          newHand = removeOne(newHand, t3);
          if (newHand.length !== hand.length - 3) return null;
          if (t1 === t2 && t2 === t3 && t3 === discard) {
            response = { type: "kong" };
          } else {
            return null;
          }
        } else {
          if (newHand.length !== hand.length - 2) return null;
          if (t1 === t2 && t2 === discard) {
            response = { type: "pong" };
          } else if (isValidSeung(playerIndex, state, t1, t2, discard)) {
            response = { type: "seung", with: [t1, t2] };
          } else {
            return null;
          }
        }
      }

      const newResponses = state.meldResponses.map((r, i) => (i === playerIndex ? response : r));

      const newState = { ...state, meldResponses: newResponses };

      if (allResponded(newState.meldResponses)) {
        return resolveMeldWindow(newState);
      }
      return newState;
    }

    return null;
  },

  isDone: (state) => state.phase === "done",

  /* ── viewAs ─────────────────────────────────────
   * Build the client-facing view.  A player (playerIndex ≥ 0) can see only
   * their own concealed hand; watchers (playerIndex === -1) see no hands.
   * @input state - current state
   * @input playerIndex - player index (-1 for watcher)
   * @returns: MahjongView
   */
  viewAs: (state, playerIndex) => {
    const players = state.hands.map((hand, i) => ({
      hand: i === playerIndex || state.phase === "done" ? [...hand] : [],
      handSize: hand.length,
      melds: [...state.melds[i]],
      flowers: [...state.flowers[i]],
    }));

    return {
      players,
      discardPile: [...state.discardPile],
      wallSize: state.wall.length,
      currentPlayer: state.currentPlayer,
      lastDiscard: state.lastDiscard,
      phase: state.phase,
      meldResponses: [...state.meldResponses],
      dealer: state.dealer,
      winner: state.winner,
    };
  },
  tagView: (view) => ({ type: "mahjong3p", view }),
  getWinners: function (state: MahjongState): number[] {
    return state.winner !== null ? [state.winner] : [];
  },
};

export const mahjong3pGameService = new GameService<MahjongState, MahjongView>(mahjongLogic);
