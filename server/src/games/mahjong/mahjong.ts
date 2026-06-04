import { type MahjongState, type MahjongView } from "@gamenite/shared/src/games/mahjong.types.ts";
import type { GameLogic } from "../gameLogic.ts";
import { GameService } from "../gameServiceManager.ts";
import { createDeck, shuffle } from "./mahjongTiles.ts";
import { drawForPlayer } from "./mahjongDraw.ts";
import type { TaggedGameView } from "@gamenite/shared";

// ─────────────────────────────────────────────────
// Main game logic
// ─────────────────────────────────────────────────

export const mahjongLogic: GameLogic<MahjongState, MahjongView> = {
  minPlayers: 4,
  maxPlayers: 4,

  /* ── start ──────────────────────────────────────
   * Shuffle the 144-tile deck, deal 14 tiles to the dealer and 13 to each other player,
   * then replace any flower tiles drawn during the deal with replacements
   * from the dead wall (back of deck).
   * Dealer starts with the turn and the game begins in the 'discard' phase.
   * @input numPlayers - number of players (always 4)
   * @returns initial MahjongState
   */
  start: (_numPlayers) => {
    let state: MahjongState = {
      wall: shuffle(createDeck()),
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
    };

    // dealer gets 14 tiles, everyone else gets 13
    const dealCounts = [14, 13, 13, 13];
    for (let p = 0; p < 4; p++) {
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
   *   a meld action (pong, kong, seung, or sik wu (a win)), or they can pass; once all
   *   players have responded the window resolves and the game state updates according to the
   *   highest-priority valid response (win > kong > pong > seung > pass)
   * @input state - current state
   * @input payload - raw move payload
   * @input playerIndex - acting player index
   * @returns new state or null
   */
  update: (state, payload, playerIndex) => {
    throw new Error("Update function not implemented yet");
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
    throw new Error("View function not implemented yet");
  },
  tagView: function (view: MahjongView): TaggedGameView {
    throw new Error("Function not implemented.");
  },
  getWinners: function (state: MahjongState): number[] {
    throw new Error("Function not implemented.");
  },
};

export const mahjongGameService = new GameService<MahjongState, MahjongView>(mahjongLogic);
