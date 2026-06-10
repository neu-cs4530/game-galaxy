import "./MahjongGame.css";
import { useState } from "react";
import type {
  MahjongMove,
  MahjongView,
  MahjongMeld,
} from "@gamenite/shared/src/games/mahjong.types.ts";
import type { GameProps } from "../util/types.ts";

// ── sub-components ────────────────────────────────────────────────────────────

interface TileImageProps {
  tile: string;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Renders a single Mahjong tile image.
 * Tile sprites should be in /public/tiles/ with filenames matching tile IDs
 * (e.g. "2c.png", "ew.png") plus "back.png" for face-down tiles.
 */
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

/**
 * Renders a declared meld (pong, kong, or seung).
 * Concealed kongs show the middle two tiles face-down.
 */
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
  // track selected tiles by hand index so duplicate tile values are distinguishable
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const isPlayer = userPlayerIndex >= 0;
  const myView = isPlayer ? view.players[userPlayerIndex] : null;
  const isMyTurn = view.phase === "discard" && view.currentPlayer === userPlayerIndex;
  const isMeldWindow = view.phase === "meld_window";
  const myResponse = isPlayer ? view.meldResponses[userPlayerIndex] : null;
  const needToRespond =
    isMeldWindow && isPlayer && myResponse === null && userPlayerIndex !== view.currentPlayer;
  const discard = view.lastDiscard;

  // tile values currently selected (derived from indices)
  const selectedTiles = myView ? selectedIndices.map((i) => myView.hand[i]) : [];

  function handleTileClick(index: number) {
    if (isMyTurn) {
      // discard phase: single selection — toggle or replace
      setSelectedIndices((prev) => (prev[0] === index ? [] : [index]));
    } else if (needToRespond) {
      // meld window: multi-selection — toggle
      setSelectedIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
      );
    }
  }

  function submitMove(move: MahjongMove) {
    makeMove(move);
    setSelectedIndices([]);
  }

  // player indices other than the current user, in seat order
  const otherPlayerIndices = [0, 1, 2, 3].filter((i) => i !== userPlayerIndex);

  /** Display name for a player, defaulting to "Player N" */
  function playerName(i: number) {
    return players[i]?.display ?? `Player ${i + 1}`;
  }

  // ── status text ──
  let statusText: string;
  if (view.phase === "done") {
    statusText =
      view.winner !== null
        ? view.winner === userPlayerIndex
          ? "You won! 🀄"
          : `${playerName(view.winner)} won!`
        : "Draw — wall exhausted";
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
        <span>{view.wallSize} tiles remaining</span>
      </div>

      <hr />

      {/* ── other players ── */}
      <div className="otherPlayers">
        {otherPlayerIndices.map((p) => {
          const pView = view.players[p];
          const response = view.meldResponses[p];
          const isDiscarder = isMeldWindow && view.currentPlayer === p;
          const isCurrentTurn = view.phase === "discard" && view.currentPlayer === p;
          return (
            <div key={p} className="otherPlayer">
              <div className="playerName">
                {playerName(p)}
                {isCurrentTurn && " ◀"}
                {view.dealer === p && " (dealer)"}
                {isMeldWindow && (
                  <span style={{ marginLeft: "0.4rem" }}>
                    {isDiscarder ? "🀄 discarded" : response === null ? "⏳" : `✓ ${response.type}`}
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
                {view.phase === "done" && pView.hand.length > 0
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
          <div className="hand">
            {myView.hand.map((tile, i) => (
              <TileImage
                key={`${tile}-${i}`}
                tile={tile}
                size="md"
                selected={selectedIndices.includes(i)}
                onClick={isMyTurn || needToRespond ? () => handleTileClick(i) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── action panel ── */}
      {view.phase !== "done" && isPlayer && (
        <div className="actionPanel">
          {/* discard phase — my turn */}
          {isMyTurn && (
            <div className="actionButtons">
              <button
                className="primary narrow"
                disabled={selectedIndices.length === 0}
                onClick={() => {
                  if (myView && selectedIndices[0] !== undefined) {
                    submitMove({ type: "discard", tile: myView.hand[selectedIndices[0]] });
                  }
                }}
              >
                {selectedIndices.length > 0 && myView
                  ? `Discard ${myView.hand[selectedIndices[0]]}`
                  : "Select a tile"}
              </button>
              <button
                className="secondary narrow"
                disabled={selectedIndices.length === 0}
                onClick={() => {
                  if (myView && selectedIndices[0] !== undefined) {
                    submitMove({ type: "kong", tile: myView.hand[selectedIndices[0]] });
                  }
                }}
              >
                Kong
              </button>
              <button className="secondary narrow" onClick={() => submitMove({ type: "win" })}>
                Declare Win (Ji Mo)
              </button>
            </div>
          )}

          {/* meld window — need to respond */}
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
                Win (Sik Wu)
              </button>
            </div>
          )}

          {/* meld window — already responded */}
          {isMeldWindow && myResponse !== null && (
            <div className="responseStatus">
              You chose to {myResponse.type}. Waiting for other players…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
