import "./Game.css";
import { useParams } from "react-router-dom";
import { getGameById } from "@gamegalaxy/client/src/services/gameService.ts";
import { useEffect, useState } from "react";
import type { GameInfo } from "@gamegalaxy/shared";
import ChatPanel from "@gamegalaxy/client/src/components/ChatPanel.tsx";
import GamePanel from "@gamegalaxy/client/src/components/GamePanel.tsx";

export default function Game() {
  const { gameId } = useParams();
  const [game, setGame] = useState<GameInfo | null>(null);

  useEffect(() => {
    let ignore = false;
    // non-nullish assertion is ok here given that Game is only called in a
    // route with `:gameId`
    getGameById(gameId!)
      .then((game) => {
        if (ignore) return;
        setGame(game);
      })
      .catch(() => {
        // ignore
      });

    return () => {
      ignore = true;
    };
  }, [gameId]);

  return (
    game && (
      <>
        <div className="gameContainer">
          <GamePanel {...game} />
          <ChatPanel chatId={game.chat} />
        </div>
      </>
    )
  );
}
