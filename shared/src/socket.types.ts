import {
  type ChatInfo,
  type ChatNewMessagePayload,
  type ChatUserJoinedPayload,
  type ChatUserLeftPayload,
} from "./chat.types.ts";
import { type LobbyTablePlayers } from "./lobby.types.ts";
import { type NewMessagePayload } from "./message.types.ts";
import { type WithAuth } from "./auth.types.ts";
import { type GameMakeMovePayload, type GamePlayInfo, type TaggedGameView } from "./game.types.ts";
import { type SafeUserInfo } from "./user.types.ts";
import type { ThreadEvent } from "./thread.types.ts";
import type {
  AcceptOfferMessage,
  AuctionAcceptNotification,
  AuctionOfferNotification,
  CreateAuctionMessage,
  MakeOfferMessage,
} from "./auction.types.ts";

/**
 * The Socket.io interface for client to server communication
 */
export interface ClientToServerEvents {
  chatJoin: (payload: WithAuth<string>) => void;
  chatLeave: (payload: WithAuth<string>) => void;
  chatSendMessage: (payload: WithAuth<NewMessagePayload>) => void;
  gameAddBot: (payload: WithAuth<string>) => void;
  gameJoinAsPlayer: (payload: WithAuth<string>) => void;
  gameMakeMove: (payload: WithAuth<GameMakeMovePayload>) => void;
  gameStart: (payload: WithAuth<string>) => void;
  gameWatch: (payload: WithAuth<string>) => void;
  threadInteraction: (payload: WithAuth<ThreadEvent>) => void;
  shopBuyAccessory: (payload: WithAuth<string>) => void;
  lobbyJoin: (payload: WithAuth<string>) => void;
  lobbyLeave: (payload: WithAuth<string>) => void;
  wearAccessory: (payload: WithAuth<string>) => void;
  removeAccessory: (payload: WithAuth<string>) => void;
  changeColor: (payload: WithAuth<string>) => void;
  auctionCreate: (payload: WithAuth<CreateAuctionMessage>) => void;
  auctionOffer: (payload: WithAuth<MakeOfferMessage>) => void;
  auctionAccept: (payload: WithAuth<AcceptOfferMessage>) => void;
}

/**
 * The Socket.io interface for server to client information
 */
export interface ServerToClientEvents {
  chatJoined: (payload: ChatInfo) => void;
  chatNewMessage: (payload: ChatNewMessagePayload) => void;
  chatUserJoined: (payload: ChatUserJoinedPayload) => void;
  chatUserLeft: (payload: ChatUserLeftPayload) => void;
  gamePlayersUpdated: (payload: SafeUserInfo[]) => void;
  gameStateUpdated: (payload: TaggedGameView & { forPlayer: boolean }) => void;
  gameWatched: (payload: GamePlayInfo) => void;
  gameJoined: (payload: string) => void;
  balanceUpdated: (payload: { balance: number }) => void;
  threadUpdate: (payload: ThreadEvent) => void;
  lobbyPlayersUpdated: (payload: SafeUserInfo[]) => void;
  lobbyTablesUpdated: (payload: LobbyTablePlayers[]) => void;
  auctionsUpdated: () => void;
  auctionOfferReceived: (payload: AuctionOfferNotification) => void;
  auctionOfferAccepted: (payload: AuctionAcceptNotification) => void;
}
