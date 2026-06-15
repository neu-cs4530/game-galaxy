import {
  type MahjongState,
  type MahjongView,
  type MahjongMeldResponse,
  type WinInfo,
  zMahjongMove,
} from "@gamenite/shared/src/games/mahjong.types.ts";
import type { GameLogic } from "../gameLogic.ts";
import { GameService } from "../gameServiceManager.ts";
import { removeOne, createDeck, shuffle } from "./mahjongTiles.ts";
import { isWinningHand } from "./mahjongWin.ts";
import { drawForPlayer } from "./mahjongDraw.ts";
import { isValidSeung, resolveKong, resolveMeldWindow } from "./mahjongMeld.ts";
import { scoreHand, seatWindForPlayer } from "./mahjongScoring.ts";

/**
 * Check whether every player has submitted a meld-window response.
 */
export function allResponded(responses: (MahjongMeldResponse | null)[]): boolean {
  return responses.every((r) => r !== null);
}

export const mahjongLogic: GameLogic<MahjongState, MahjongView> = {
  minPlayers: 4,
  maxPlayers: 4,

  /* ── start ───────────────────────────────────── */
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
      roundWind: "ew",
      winInfo: undefined,
      afterKong: false,
      consecutiveKongsThisTurn: 0,
    };

    const dealCounts = [14, 13, 13, 13];
    for (let p = 0; p < 4; p++) {
      for (let i = 0; i < dealCounts[p]; i++) {
        state = drawForPlayer(state, p);
      }
    }
    return state;
  },

  /* ── update ──────────────────────────────────── */
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
        const meldResponses: (MahjongMeldResponse | null)[] = [null, null, null, null];
        meldResponses[playerIndex] = { type: "pass" };

        return {
          ...state,
          hands: state.hands.map((h, i) => (i === playerIndex ? newHand : [...h])),
          lastDiscard: move.tile,
          phase: "meld_window",
          meldResponses,
          afterKong: false,
          consecutiveKongsThisTurn: 0,
        };
      }

      // ── declare self-draw win (Ji Mo) ──
      if (move.type === "win") {
        if (!isWinningHand(state.hands[playerIndex], state.melds[playerIndex])) return null;
        const winInfo: WinInfo = {
          selfDraw: true,
          afterKong: state.afterKong,
          afterMultipleKongs: state.consecutiveKongsThisTurn >= 2,
          finalTile: state.wall.length === 0,
          robbingKong: false,
          discarderIndex: undefined,
          winningTile: "",
        };
        return { ...state, phase: "done", winner: playerIndex, winInfo };
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

        // promoted kong: existing pong meld + 4th tile drawn
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
      if (playerIndex === state.currentPlayer) return null;
      if (state.meldResponses[playerIndex] !== null) return null;

      const hand = state.hands[playerIndex];
      const discard = state.lastDiscard!;
      let response: MahjongMeldResponse | null = null;

      if (move.type === "win") {
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

  /* ── viewAs ──────────────────────────────────── */
  viewAs: (state, playerIndex) => {
    const players = state.hands.map((hand, i) => ({
      hand: i === playerIndex || state.phase === "done" ? [...hand] : [],
      melds: [...state.melds[i]],
      flowers: [...state.flowers[i]],
    }));

    const seatWinds = [0, 1, 2, 3].map((i) => seatWindForPlayer(i, state.dealer));

    // compute scoring once when the game ends with a winner
    let scoring = undefined;
    if (state.phase === "done" && state.winner !== null && state.winInfo) {
      const winner = state.winner;
      // discard win: hand has 13 tiles, append winning tile to get 14
      // self-draw win: hand already has 14 tiles
      const completeHand = state.winInfo.selfDraw
        ? [...state.hands[winner]]
        : [...state.hands[winner], state.winInfo.winningTile];

      scoring = scoreHand({
        hand: completeHand,
        melds: state.melds[winner],
        flowers: state.flowers[winner],
        winInfo: state.winInfo,
        seatWind: seatWindForPlayer(winner, state.dealer),
        roundWind: state.roundWind,
        winnerIndex: winner,
      });
    }

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
      roundWind: state.roundWind,
      seatWinds,
      scoring,
    };
  },

  tagView: (view) => ({ type: "mahjong", view }),

  getWinners: (state: MahjongState): number[] => (state.winner !== null ? [state.winner] : []),
};

export const mahjongGameService = new GameService<MahjongState, MahjongView>(mahjongLogic);
