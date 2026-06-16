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
import { seatWindForPlayer, resolveHandWin } from "./mahjongScoring.ts";

export function allResponded(responses: (MahjongMeldResponse | null)[]): boolean {
  return responses.every((r) => r !== null);
}

// ── dealer / round wind rotation ──────────────────────────────────────────────

const ROUND_WINDS = ["ew", "sw", "ww", "nw"];

/**
 * Compute the next dealer and round wind after a hand ends.
 * - Dealer moves right only if a non-dealer won.
 * - Round wind advances when dealer rotates back to the initial dealer.
 */
function nextHandMeta(state: MahjongState): { nextDealer: number; nextRoundWind: string } {
  const { dealer, winner, initialDealer, roundWind } = state;

  let nextDealer = dealer;
  if (winner !== null && winner !== dealer) {
    nextDealer = (dealer + 1) % 4;
  }

  let nextRoundWind = roundWind;
  if (nextDealer !== dealer && nextDealer === initialDealer) {
    const idx = ROUND_WINDS.indexOf(roundWind);
    nextRoundWind = ROUND_WINDS[(idx + 1) % ROUND_WINDS.length];
  }

  return { nextDealer, nextRoundWind };
}

/**
 * Deal a fresh hand, preserving cumulative scores and dealer metadata.
 */
function startNextHand(state: MahjongState): MahjongState {
  const { nextDealer, nextRoundWind } = nextHandMeta(state);

  let next: MahjongState = {
    ...state,
    wall: shuffle(createDeck()),
    hands: [[], [], [], []],
    melds: [[], [], [], []],
    flowers: [[], [], [], []],
    discardPile: [],
    currentPlayer: nextDealer,
    lastDiscard: null,
    phase: "discard",
    meldResponses: [null, null, null, null],
    dealer: nextDealer,
    winner: null,
    roundWind: nextRoundWind,
    winInfo: undefined,
    lastScoring: undefined,
    afterKong: false,
    consecutiveKongsThisTurn: 0,
    playAgainVotes: [null, null, null, null],
  };

  // dealer gets 14 tiles, everyone else gets 13; deal starting from the new dealer
  for (let offset = 0; offset < 4; offset++) {
    const p = (nextDealer + offset) % 4;
    const count = offset === 0 ? 14 : 13;
    for (let i = 0; i < count; i++) {
      next = drawForPlayer(next, p);
    }
  }

  return next;
}

// ── game logic ────────────────────────────────────────────────────────────────

export const mahjongLogic: GameLogic<MahjongState, MahjongView> = {
  minPlayers: 4,
  maxPlayers: 4,

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
      scores: [0, 0, 0, 0],
      playAgainVotes: [null, null, null, null],
      initialDealer: 0,
      lastScoring: undefined,
    };

    const dealCounts = [14, 13, 13, 13];
    for (let p = 0; p < 4; p++) {
      for (let i = 0; i < dealCounts[p]; i++) {
        state = drawForPlayer(state, p);
      }
    }
    return state;
  },

  update: (state, payload, playerIndex) => {
    if (state.phase === "ended") return null;

    const parsed = zMahjongMove.safeParse(payload);
    if (parsed.error) return null;
    const move = parsed.data;

    // ════════════════════════════════════════════
    // VOTING PHASE — players vote to play again
    // ════════════════════════════════════════════
    if (state.phase === "voting") {
      if (move.type !== "playAgain") return null;
      if (state.playAgainVotes[playerIndex] !== null) return null; // already voted

      const newVotes = state.playAgainVotes.map((v, i) => (i === playerIndex ? move.vote : v));

      // any "no" vote immediately ends the game
      if (!move.vote) {
        return { ...state, phase: "ended", playAgainVotes: newVotes };
      }

      // all voted yes — start next hand
      if (newVotes.every((v) => v === true)) {
        return startNextHand({ ...state, playAgainVotes: newVotes });
      }

      return { ...state, playAgainVotes: newVotes };
    }

    // ════════════════════════════════════════════
    // DISCARD PHASE — only the current player acts
    // ════════════════════════════════════════════
    if (state.phase === "discard") {
      if (playerIndex !== state.currentPlayer) return null;

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
        return resolveHandWin(state, playerIndex, winInfo);
      }

      if (move.type === "kong") {
        const tile = move.tile;
        if (!tile) return null;
        const hand = state.hands[playerIndex];

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

      return null;
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
      if (move.type === "pass") response = { type: "pass" };
      if (move.type === "meld") {
        const [t1, t2, t3] = move.with;
        let newHand = [...hand];
        newHand = removeOne(newHand, t1);
        newHand = removeOne(newHand, t2);

        if (t3 !== undefined) {
          newHand = removeOne(newHand, t3);
          if (newHand.length !== hand.length - 3) return null;
          if (t1 === t2 && t2 === t3 && t3 === discard) response = { type: "kong" };
          else return null;
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

  isDone: (state) => state.phase === "ended",

  viewAs: (state, playerIndex) => {
    const isOver = state.phase === "voting" || state.phase === "ended";
    const players = state.hands.map((hand, i) => ({
      hand: i === playerIndex || isOver ? [...hand] : [],
      melds: [...state.melds[i]],
      flowers: [...state.flowers[i]],
    }));

    const seatWinds = [0, 1, 2, 3].map((i) => seatWindForPlayer(i, state.dealer));

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
      scores: [...state.scores],
      playAgainVotes: [...state.playAgainVotes],
      lastScoring: state.lastScoring,
    };
  },

  tagView: (view) => ({ type: "mahjong", view }),

  getWinners: (state: MahjongState): number[] => {
    if (state.phase === "ended") {
      const maxScore = Math.max(...state.scores);
      return state.scores
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s === maxScore)
        .map(({ i }) => i);
    }
    return state.winner !== null ? [state.winner] : [];
  },
};

export const mahjongGameService = new GameService<MahjongState, MahjongView>(mahjongLogic);
