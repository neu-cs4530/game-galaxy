import "./GamePanel.css";
import { Link } from "react-router-dom";
import type { GameInfo } from "@gamegalaxy/shared";
import { gameNames } from "@gamegalaxy/client/src/util/consts.ts";
import useLoginContext from "@gamegalaxy/client/src/hooks/useLoginContext.ts";
import useAuth from "@gamegalaxy/client/src/hooks/useAuth.ts";
import GameDispatch from "@gamegalaxy/client/src/games/GameDispatch.tsx";
import useSocketsForGame from "@gamegalaxy/client/src/hooks/useSocketsForGame.ts";
import useTimeSince from "@gamegalaxy/client/src/hooks/useTimeSince.ts";
import AvatarDisplay from "@gamegalaxy/client/src/components/Avatar.tsx";

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
              <AvatarDisplay avatar={player.avatar} size={75} />
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
          {userPlayerIndex >= 0 && !view && type === "mahjong" && (
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
      {type === "mahjong" && (
        <div>
          <div>
            If you are new to mahjong, feel free to check out the game rules{" "}
            <Link to="/mahjongRules" style={{ color: "white" }}>
              here
            </Link>
            !
          </div>
          <div>
            For more details on scoring, click{" "}
            <Link to="/mahjongScoring" style={{ color: "white" }}>
              here
            </Link>
            !
          </div>
        </div>
      )}
    </div>
  ) : (
    <div></div>
  );
}
