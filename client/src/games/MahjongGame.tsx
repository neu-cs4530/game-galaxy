import "./MahjongGame.css";
import { useState, useRef } from "react";
import type {
  MahjongMove,
  MahjongView,
  MahjongMeld,
} from "@gamenite/shared/src/games/mahjong.types.ts";
import type { GameProps } from "../util/types.ts";

// ── helpers ───────────────────────────────────────────────────────────────────

function syncOrderedHand(ordered: string[], newHand: string[]): string[] {
  const remaining = new Map<string, number>();
  for (const t of newHand) remaining.set(t, (remaining.get(t) ?? 0) + 1);
  const synced: string[] = [];
  for (const t of ordered) {
    const count = remaining.get(t) ?? 0;
    if (count > 0) {
      synced.push(t);
      remaining.set(t, count - 1);
    }
  }
  for (const [tile, count] of remaining) {
    for (let i = 0; i < count; i++) synced.push(tile);
  }
  return synced;
}

const WindLabel: Record<string, string> = { ew: "E", sw: "S", ww: "W", nw: "N" };
const WindName: Record<string, string> = { ew: "East", sw: "South", ww: "West", nw: "North" };

// ── sub-components ────────────────────────────────────────────────────────────

interface TileImageProps {
  tile: string;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
}

function TileImage({ tile, size = "md", selected, onClick }: TileImageProps) {
  return (
    <img
      className={[
        "tileImage",
        `tileImage--${size}`,
        selected ? "tileImage--selected" : "",
        onClick ? "tileImage--clickable" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      src={`/tiles/${tile}.png`}
      alt={tile}
      title={tile}
      onClick={onClick}
    />
  );
}

function MeldDisplay({ meld }: { meld: MahjongMeld }) {
  return (
    <div className="meldDisplay">
      {meld.tiles.map((tile, i) => {
        const faceDown = meld.concealed && i > 0 && i < meld.tiles.length - 1;
        return <TileImage key={i} tile={faceDown ? "back" : tile} size="sm" />;
      })}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function MahjongGame({
  view,
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<MahjongView, MahjongMove>) {
  const isPlayer = userPlayerIndex >= 0;
  const myView = isPlayer ? view.players[userPlayerIndex] : null;

  const [orderedHand, setOrderedHand] = useState<string[]>(myView?.hand ?? []);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [prevHandComposition, setPrevHandComposition] = useState<string>("");
  const dragIndexRef = useRef<number | null>(null);

  const handComposition = myView?.hand.slice().sort().join(",") ?? "";
  if (myView && handComposition !== prevHandComposition) {
    setPrevHandComposition(handComposition);
    setOrderedHand(syncOrderedHand(orderedHand, myView.hand));
    setSelectedIndices([]);
  }

  const isGameOver = view.phase === "voting" || view.phase === "ended";
  const isMyTurn = view.phase === "discard" && view.currentPlayer === userPlayerIndex;
  const isMeldWindow = view.phase === "meld_window";
  const myResponse = isPlayer ? view.meldResponses[userPlayerIndex] : null;
  const needToRespond =
    isMeldWindow && isPlayer && myResponse === null && userPlayerIndex !== view.currentPlayer;
  const discard = view.lastDiscard;
  const selectedTiles = selectedIndices.map((i) => orderedHand[i]);

  const myVote = isPlayer ? view.playAgainVotes?.[userPlayerIndex] : null;

  function handleTileClick(index: number) {
    if (isMyTurn) {
      setSelectedIndices((prev) => (prev[0] === index ? [] : [index]));
    } else if (needToRespond) {
      setSelectedIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
      );
    }
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === index) return;
    setOrderedHand((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setSelectedIndices((prev) =>
      prev.map((si) => {
        if (si === from) return index;
        if (from < index && si > from && si <= index) return si - 1;
        if (from > index && si >= index && si < from) return si + 1;
        return si;
      }),
    );
    dragIndexRef.current = index;
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
  }

  function submitMove(move: MahjongMove) {
    makeMove(move);
    setSelectedIndices([]);
  }

  const otherPlayerIndices = isPlayer
    ? [3, 2, 1].map((offset) => (userPlayerIndex + offset) % 4)
    : [0, 1, 2, 3];

  function playerName(i: number) {
    return players[i]?.display ?? `Player ${i + 1}`;
  }

  const mySeatWind = isPlayer && view.seatWinds ? view.seatWinds[userPlayerIndex] : null;
  const roundWind = view.roundWind;

  let statusText: string;
  if (view.phase === "voting") {
    statusText =
      view.winner !== null
        ? view.winner === userPlayerIndex
          ? "You won!"
          : `${playerName(view.winner)} won!`
        : "Draw — wall exhausted";
  } else if (view.phase === "ended") {
    statusText = "Game over";
  } else if (view.phase === "discard") {
    statusText = isMyTurn
      ? "Your turn — select a tile to discard"
      : `${playerName(view.currentPlayer)}'s turn to discard`;
  } else {
    statusText = needToRespond ? "Your response needed" : "Waiting for meld responses…";
  }

  return (
    <div className="mahjongGame">
      {/* ── status bar ── */}
      <div className="mahjongStatus smallAndGray">
        <span className="phaseLabel">{statusText}</span>
        <span className="windBadges">
          {roundWind && (
            <span
              className="windBadge roundWind"
              style={{ marginLeft: "1rem" }}
              title={`Round wind: ${WindName[roundWind]}`}
            >
              Round: {WindLabel[roundWind]}
            </span>
          )}
          {mySeatWind && (
            <span
              className="windBadge seatWind"
              style={{ marginLeft: "1rem" }}
              title={`Your seat: ${WindName[mySeatWind]}`}
            >
              Seat: {WindLabel[mySeatWind]}
            </span>
          )}
          <span style={{ marginLeft: "1rem" }}>{view.wallSize} tiles left</span>
        </span>
      </div>

      <hr />

      {/* ── other players ── */}
      <div className="otherPlayers">
        {otherPlayerIndices.map((p) => {
          const pView = view.players[p];
          const response = view.meldResponses[p];
          const isDiscarder = isMeldWindow && view.currentPlayer === p;
          const isCurrentTurn = view.phase === "discard" && view.currentPlayer === p;
          const pSeatWind = view.seatWinds?.[p];
          return (
            <div key={p} className="otherPlayer">
              <div className="playerName">
                {playerName(p)}
                {pSeatWind && (
                  <span
                    className="windBadge seatWind"
                    style={{ marginLeft: "0.4rem" }}
                    title={WindName[pSeatWind]}
                  >
                    {WindLabel[pSeatWind]}
                  </span>
                )}
                {isCurrentTurn && " ◀"}
                {view.dealer === p && " (dealer)"}
                {isMeldWindow && (
                  <span style={{ marginLeft: "0.4rem" }}>
                    {isDiscarder ? "discarded" : response === null ? "⏳" : `✓ ${response.type}`}
                  </span>
                )}
              </div>
              {pView.melds.length > 0 && (
                <div className="meldRow">
                  {pView.melds.map((meld, i) => (
                    <MeldDisplay key={i} meld={meld} />
                  ))}
                </div>
              )}
              <div className="handBacks">
                {isGameOver && pView.hand.length > 0
                  ? pView.hand.map((tile, i) => <TileImage key={i} tile={tile} size="sm" />)
                  : Array.from({ length: pView.hand.length }).map((_, i) => (
                      <TileImage key={i} tile="back" size="sm" />
                    ))}
              </div>
              {pView.flowers.length > 0 && (
                <div className="flowerRow">
                  {pView.flowers.map((f, i) => (
                    <TileImage key={i} tile={f} size="sm" />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <hr />

      {/* ── discard pile + last discard ── */}
      <div className="centerArea">
        <div className="discardArea">
          <div className="smallAndGray">Discard pile</div>
          <div className="discardPile">
            {view.discardPile.map((tile, i) => (
              <TileImage key={i} tile={tile} size="sm" />
            ))}
            {view.discardPile.length === 0 && (
              <span className="smallAndGray" style={{ padding: "0.25rem" }}>
                empty
              </span>
            )}
          </div>
        </div>
        {discard && (
          <div className="lastDiscardArea">
            <div className="smallAndGray">Last discard</div>
            <TileImage tile={discard} size="lg" />
          </div>
        )}
      </div>

      <hr />

      {/* ── my hand ── */}
      {myView && (
        <div className="myArea">
          {myView.melds.length > 0 && (
            <div className="meldRow">
              {myView.melds.map((meld, i) => (
                <MeldDisplay key={i} meld={meld} />
              ))}
            </div>
          )}
          {myView.flowers.length > 0 && (
            <div className="flowerRow">
              <span className="smallAndGray" style={{ marginRight: "0.25rem" }}>
                Flowers:
              </span>
              {myView.flowers.map((f, i) => (
                <TileImage key={i} tile={f} size="sm" />
              ))}
            </div>
          )}
          <div className="handControls">
            <button
              className="secondary narrow"
              onClick={() => {
                setOrderedHand(myView.hand);
                setSelectedIndices([]);
              }}
            >
              Sort
            </button>
          </div>
          <div className="hand">
            {orderedHand.map((tile, i) => (
              <div
                key={`${tile}-${i}`}
                className="draggableTile"
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                onClick={isMyTurn || needToRespond ? () => handleTileClick(i) : undefined}
              >
                <TileImage tile={tile} size="md" selected={selectedIndices.includes(i)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── action panel ── */}
      {view.phase !== "voting" && view.phase !== "ended" && isPlayer && (
        <div className="actionPanel">
          {isMyTurn && (
            <div className="actionButtons">
              <button
                className="primary narrow"
                disabled={selectedIndices.length === 0}
                onClick={() => {
                  if (selectedIndices[0] !== undefined) {
                    submitMove({ type: "discard", tile: orderedHand[selectedIndices[0]] });
                  }
                }}
              >
                {selectedIndices.length > 0 ? "Discard" : "Select a tile"}
              </button>
              <button
                className="secondary narrow"
                disabled={selectedIndices.length === 0}
                onClick={() => {
                  if (selectedIndices[0] !== undefined) {
                    submitMove({ type: "kong", tile: orderedHand[selectedIndices[0]] });
                  }
                }}
              >
                Kong
              </button>
              <button className="secondary narrow" onClick={() => submitMove({ type: "win" })}>
                Declare Win
              </button>
            </div>
          )}
          {needToRespond && (
            <div className="actionButtons">
              <button className="secondary narrow" onClick={() => submitMove({ type: "pass" })}>
                Pass
              </button>
              <button
                className="primary narrow"
                disabled={selectedTiles.length === 0}
                onClick={() => submitMove({ type: "meld", with: selectedTiles })}
              >
                Meld
              </button>
              <button className="primary narrow" onClick={() => submitMove({ type: "win" })}>
                Win
              </button>
            </div>
          )}
          {isMeldWindow && myResponse !== null && (
            <div className="responseStatus">
              You chose to {myResponse.type}. Waiting for other players…
            </div>
          )}
        </div>
      )}

      {/* ── scoring panel (shown during voting and ended) ── */}
      {isGameOver && (
        <div className="scoringPanel">
          {/* hand score breakdown */}
          {view.lastScoring && view.winner !== null && (
            <>
              <div className="scoringWinner">
                {view.winner === userPlayerIndex
                  ? "Your winning hand"
                  : `${playerName(view.winner)}'s winning hand`}
              </div>
              <table className="scoringTable">
                <thead>
                  <tr>
                    <th>Pattern</th>
                    <th className="zhCol">中文</th>
                    <th className="fanCol">Fan</th>
                  </tr>
                </thead>
                <tbody>
                  {view.lastScoring.breakdown.map((entry, i) => (
                    <tr key={i} className={entry.isLimit ? "limitRow" : ""}>
                      <td>{entry.name}</td>
                      <td className="zhCol smallAndGray">{entry.nameZh}</td>
                      <td className="fanCol">{entry.isLimit ? "Limit" : entry.fan}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="scoringTotalRow">
                    <td colSpan={2}>
                      {view.lastScoring.isLimit
                        ? "Limit hand"
                        : `Total: ${view.lastScoring.totalFan} fan`}
                    </td>
                    <td className="fanCol">{view.lastScoring.points} pts</td>
                  </tr>
                </tfoot>
              </table>
              <div className="scoringPayments">
                <div className="smallAndGray" style={{ marginBottom: "0.25rem" }}>
                  Payments
                </div>
                {view.lastScoring.payments.map((payment, i) => {
                  if (payment === 0) return null;
                  const isWinner = i === view.winner;
                  return (
                    <div
                      key={i}
                      className={`paymentRow ${isWinner ? "paymentReceive" : "paymentPay"}`}
                    >
                      <span>{playerName(i)}</span>
                      <span>{isWinner ? `+${-payment} pts` : `-${payment} pts`}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!view.lastScoring && view.winner === null && (
            <div className="scoringWinner">Draw — wall exhausted, no payments</div>
          )}

          {/* cumulative scores */}
          <div className="cumulativeScores">
            <div className="cumulativeScoresTitle">
              {view.phase === "ended" ? "Final Scores" : "Scores"}
            </div>
            <table className="scoresTable">
              <tbody>
                {[0, 1, 2, 3].map((i) => {
                  const score = view.scores?.[i] ?? 0;
                  const isHandWinner = i === view.winner;
                  return (
                    <tr key={i} className={isHandWinner ? "scoresWinnerRow" : ""}>
                      <td>{playerName(i)}</td>
                      <td className={`scoreValue ${score >= 0 ? "scorePos" : "scoreNeg"}`}>
                        {score >= 0 ? `+${score}` : `${score}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* play again voting */}
          {view.phase === "voting" && (
            <div className="playAgainSection">
              <div className="playAgainTitle">Play another hand?</div>
              <div className="voteStatuses">
                {[0, 1, 2, 3].map((i) => {
                  const vote = view.playAgainVotes?.[i];
                  return (
                    <span
                      key={i}
                      className={`voteStatus ${vote === true ? "voteYes" : vote === false ? "voteNo" : "votePending"}`}
                    >
                      {playerName(i)}: {vote === true ? "✓ Yes" : vote === false ? "✗ No" : "⏳"}
                    </span>
                  );
                })}
              </div>
              {isPlayer && myVote === null && (
                <div className="playAgainButtons">
                  <button
                    className="primary narrow"
                    onClick={() => submitMove({ type: "playAgain", vote: true })}
                  >
                    Yes, play again
                  </button>
                  <button
                    className="secondary narrow"
                    onClick={() => submitMove({ type: "playAgain", vote: false })}
                  >
                    No thanks
                  </button>
                </div>
              )}
              {isPlayer && myVote !== null && (
                <div className="responseStatus">
                  You voted {myVote ? "yes" : "no"}. Waiting for others…
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
