import GameTable from "../components/gameTable";
import LobbyDisplay from "../components/LobbyDisplay";
import RoomLink from "../components/RoomLink";
import useAuth from "../hooks/useAuth";
import ChatPanel from "../components/ChatPanel";
import AvatarDisplayLobby from "../components/AvatarLobby";
import useSocketsForLobbyPlayers from "../hooks/useSocketsForLobbyPlayers";
import { useNavigate } from "react-router-dom";
import type { SafeUserInfo } from "@gamenite/shared";

// Where each player's avatar is placed in the lobby, in join order. Add an
// entry here to make room for more simultaneous players.
const LOBBY_AVATAR_POSITIONS = [
  { top: "60%", left: "15%" },
  { top: "64%", left: "11%" },
  { top: "68%", left: "7%" },

  { top: "65%", left: "20%" },
  { top: "69%", left: "16%" },
  { top: "73%", left: "12%" },

  { top: "70%", left: "25%" },
  { top: "74%", left: "21%" },
  { top: "78%", left: "17%" },

  { top: "75%", left: "30%" },
  { top: "79%", left: "26%" },
  { top: "83%", left: "22%" },
];

const FORUM_POSITIONS = [
  { top: "20%", left: "50%" },
  { top: "22%", left: "49%" },
  { top: "22%", left: "46%" },
];

const AUCTION_POSITIONS = [
  { top: "29%", left: "75%" },
  { top: "31%", left: "72%" },
  { top: "33%", left: "69%" },
  { top: "35%", left: "66%" },
];

const SHOP_CLOSET_POSITIONS = [
  { top: "24%", left: "18%" },
  { top: "26%", left: "22%" },
];

const NIM_POSITIONS = [
  { top: "31%", left: "40%" },
  { top: "33%", left: "35%" },
];

const NUMBER_GUESSER_POSITIONS = [
  { top: "45%", left: "62.5%" },
  { top: "48%", left: "61%" },
  { top: "45%", left: "68%" },
  { top: "50%", left: "70%" },
];

const MAHJONG_3P_POSITIONS = [
  { top: "50%", left: "53%" },
  { top: "45.5%", left: "43%" },
  { top: "49%", left: "50%" },
];

const MAHJONG_4P_POSITIONS = [
  { top: "39%", left: "53%" },
  { top: "37%", left: "56%" },
  { top: "41%", left: "62%" },
  { top: "43%", left: "63%" },
];

const roomPositions: Record<string, { top: string; left: string }[]> = {
  lobby: LOBBY_AVATAR_POSITIONS,
  forum: FORUM_POSITIONS,
  auction: AUCTION_POSITIONS,
  shop: SHOP_CLOSET_POSITIONS,
  closet: SHOP_CLOSET_POSITIONS,
  "table:nim": NIM_POSITIONS,
  "table:guess": NUMBER_GUESSER_POSITIONS,
  "table:mahjong3p": MAHJONG_3P_POSITIONS,
  "table:mahjong4p": MAHJONG_4P_POSITIONS,
};

export default function Lobby() {
  const username = useAuth().username;
  const navigate = useNavigate();
  const { players, tablePlayers, roomPlayers } = useSocketsForLobbyPlayers("lobby");

  const lobbyUsernames = new Set(players.map((player) => player.username));
  const groups: Record<string, SafeUserInfo[]> = {
    lobby: players,
    ...(roomPlayers as Record<string, SafeUserInfo[]>),
  };
  for (const table of tablePlayers) {
    groups[table.tableId] = table.players.filter((player) => !lobbyUsernames.has(player.username));
  }

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
      <div style={{ position: "relative", width: "60%" }}>
        <LobbyDisplay />
        {Object.entries(groups).flatMap(([roomId, group]) => {
          const positions = roomPositions[roomId] ?? [];
          return group.map((player, index) => {
            const position = positions[index] ?? positions[positions.length - 1];
            if (!position) return null;
            return (
              <AvatarDisplayLobby
                key={`${roomId}-${player.username}-${index}`}
                avatar={player.avatar}
                top={position.top}
                left={position.left}
                size="30%"
                onClick={() => navigate(`/profile/${player.username}`)}
              />
            );
          });
        })}
        <RoomLink
          sprite="/sprites/lobby/Shop_frame1.png"
          route="/shop"
          top="18%"
          left="22%"
          width="10%"
          height="10%"
        />
        <RoomLink
          sprite="/sprites/lobby/Closet_frame1.png"
          route={`/closet/${username}`}
          top="14%"
          left="35%"
          width="8%"
          height="12"
        />
        <RoomLink
          sprite="/sprites/lobby/Forum_frame1.png"
          route="/forum"
          top="18%"
          left="53%"
          width="10%"
          height="13%"
        />
        <RoomLink
          sprite="/sprites/lobby/gavel_guy.png"
          route="/auction"
          top="21%"
          left="70%"
          width="10%"
          height="10%"
        />
        <RoomLink
          sprite="/sprites/lobby/Table1_frame2.png"
          route="/auction"
          top="21%"
          left="60%"
          width="25%"
          height="20%"
        />
        <RoomLink
          sprite="/sprites/accessories/hat-01.png"
          route="/auction"
          top="26.1%"
          left="68%"
          width="13%"
          height="13%"
        />
        <GameTable
          sprite="/sprites/lobby/Nim_frame1.png"
          top="31%"
          left="30.0%"
          width="25%"
          height="20%"
          tableId="table:nim"
        />
        <GameTable
          sprite="/sprites/lobby/NumGuesser_frame1.png"
          top="45%"
          left="56%"
          width="25%"
          height="20%"
          tableId="table:guess"
        />
        <GameTable
          sprite="/sprites/lobby/Mahjong_frame1.png"
          top="38%"
          left="50%"
          width="20%"
          height="15%"
          tableId="table:mahjong4p"
        />
        <GameTable
          sprite="/sprites/lobby/Mahjong_frame1.png"
          top="44%"
          left="37%"
          width="25%"
          height="20%"
          tableId="table:mahjong3p"
        />
      </div>
      <div style={{ position: "relative", width: "40%" }}>
        <ChatPanel chatId="lobby"></ChatPanel>
      </div>
    </div>
  );
}
