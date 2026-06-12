import "./GamePanel.css";
import type { GameInfo } from "@gamenite/shared";
import { gameNames } from "../util/consts.ts";
import useLoginContext from "../hooks/useLoginContext.ts";
import useAuth from "../hooks/useAuth.ts";
import GameDispatch from "../games/GameDispatch.tsx";
import useSocketsForGame from "../hooks/useSocketsForGame.ts";
import useTimeSince from "../hooks/useTimeSince.ts";

/**
 * A game panel allows viewing the status and players of a live game
 */
export default function GamePanel({
  gameId,
  type,
  players: initialPlayers,
  createdAt,
  minPlayers,
}: GameInfo) {
  const { user, socket } = useLoginContext();
  const auth = useAuth();
  const timeSince = useTimeSince();

  const { view, players, userPlayerIndex, hasWatched, startGame } = useSocketsForGame(
    gameId,
    initialPlayers,
  );

  function addBot() {
    socket.emit("gameAddBot", { auth, payload: gameId });
  }

  return hasWatched ? (
    <div className="gamePanel">
      <div className="gameRoster">
        <h2>{gameNames[type]}</h2>
        <div className="smallAndGray">Game room created {timeSince(createdAt)}</div>
        <div className="dottedList">
          {players.map((player, index) => (
            <div className="dottedListItem" role="listitem" key={player.username}>
              {player.username === user.username
                ? `you are player #${index + 1}`
                : `Player #${index + 1} is ${player.display}`}
            </div>
          ))}
        </div>
        <div
          className="buttonRow"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            display: "flex",
            flexDirection: "row",
            gap: "0.5rem",
          }}
        >
          {userPlayerIndex >= 0 && !view && (
            <button className="secondary narrow" onClick={addBot}>
              Add Bot
            </button>
          )}
          {userPlayerIndex >= 0 && !view && players.length >= minPlayers && (
            <button className="primary narrow" onClick={startGame}>
              Start Game
            </button>
          )}
        </div>
      </div>
      {view ? (
        <div className="gameFrame">
          <GameDispatch
            gameId={gameId}
            userPlayerIndex={userPlayerIndex}
            players={players}
            view={view}
          />
        </div>
      ) : (
        <div className="gameFrame waiting content">waiting for game to begin</div>
      )}
    </div>
  ) : (
    <div></div>
  );
}
