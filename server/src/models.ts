import type { GameKey, ReactionEmoji, Avatar } from "@gamegalaxy/shared";

/**
 * Record identifiers used to look up records in a database. This type
 * abbreviation is intended to suggest that the key should be a randomly
 * generated unique ID.
 */
export type RecordId = string;

/**
 * Actual JavaScript Date objects can't stored in a database that only accepts
 * JSON objects; this type indicates that the string should be the result of
 * taking a Date object and turning it to a string with the Date.toISOString()
 * method.
 */
export type DateISO = string;

/**
 * Represents a user's authorization record in the database.
 * - `userId`: the user ID of the corresponding User model
 * - `password`: the password for this user
 */
export interface AuthRecord {
  userId: RecordId; // References User models
  password: string;
}

/**
 * Represents a chat document in the database.
 * - `messages`: the ordered list of messages in the chat
 * - `createdAt`: when the chat was created
 */
export interface ChatRecord {
  messages: RecordId[]; // References Message models
  createdAt: DateISO;
}

/**
 * Represents a comment in the database.
 * - `text`: comment contents
 * - `createdBy`: user id of the commenter
 * - `createdAt`: when the comment was made
 * - `editedAt`: when the comment was last modified
 */
export interface CommentRecord {
  text: string;
  createdBy: RecordId; // References User records
  createdAt: DateISO;
  editedAt?: DateISO;
}

/**
 * Represents a game document in the database.
 * - `type`: picks which game this is
 * - `state`: absent if the game hasn't started, or the id for the game's state
 * - `table`: the table where this game is played
 * - `chat`: id for the game's chat
 * - `players`: active players for the game
 * - `createdAt`: when the game was created
 * - `createdBy`: user id of the person who created the game
 */
export interface GameRecord {
  type: GameKey;
  table?: RecordId;
  state?: unknown;
  done: boolean;
  chat: RecordId; // References Chat records
  players: RecordId[]; // References User records
  createdAt: DateISO;
  createdBy: RecordId; // References User records
}

/**
 * Represents a game table in the database
 * - `gameType`: the game associated with this table
 * - `currentGame`: the active gameRecord for this table (so new users can join an existing game)
 */
export interface TableRecord {
  gameType: GameKey;
  currentGame?: RecordId;
}

/**
 * Represents a message in the database.
 * - `text`: message contents
 * - `createdBy`: user id of message sender
 * - `createdAt`: when the message was sent
 */
export interface MessageRecord {
  text: string;
  createdBy: RecordId; // References User records
  createdAt: DateISO;
}

/**
 * Represents a single emoji reaction to a forum post.
 * - `createdBy`: user id of the reacting user
 * - `emoji`: the emoji used
 */
export interface ReactionEntry {
  createdBy: RecordId; // References User records
  emoji: ReactionEmoji;
}

/**
 * Represents a forum post as it's stored in the database.
 * - `title`: post title
 * - `text`: post contents
 * - `createdAt`: when the thread was posted
 * - `createdBy`: user id of OP
 * - `comments`: replies to the post
 * - `reactions`: emoji reactions to the post, at most one per user per emoji
 * - `editedAt`: when the post was last edited
 */
export interface ThreadRecord {
  title: string;
  text: string;
  createdAt: DateISO;
  createdBy: RecordId; // References User records
  comments: RecordId[]; // References Comment records
  tags: string[];
  reactions: ReactionEntry[];
  editedAt?: DateISO;
}

/**
 * Represents a user document in the database.
 * - `username`: Text username (a non-random key for looking up Auth records)
 * - `display`: A display name
 * - `createdAt`: when this user registered.
 * - `avatar` : the avatar representing this user.
 * - `balance`: the user's coin amount
 * - `wins`: the amount of games the user won
 * - `losses`: the amount of games the user lost
 */
export interface UserRecord {
  username: string; // References Auth records
  display: string;
  createdAt: DateISO;
  avatar: Avatar;
  balance: number;
  wins: number;
  losses: number;
}

/**
 * Represents an offer on an auction in the database.
 * - `offerId`: random unique id for this offer
 * - `bidder`: user id of the player who made the offer
 * - `price`: how many coins the bidder is offering
 * - `message`: optional note from the bidder to the seller
 * - `createdAt`: when the offer was made
 */
export interface AuctionOfferEntry {
  offerId: string;
  bidder: RecordId; // References User records
  price: number;
  message?: string;
  createdAt: DateISO;
}

/**
 * Represents an auction listing in the database.
 * - `seller`: user id of the player selling the item
 * - `accessoryId`: the id of the accessory being sold
 * - `startingPrice`: the seller's suggested starting price
 * - `offers`: the offers made on this listing
 * - `status`: whether the listing is open or has been sold
 * - `createdAt`: when the listing was created
 */
export interface AuctionRecord {
  seller: RecordId; // References User records
  accessoryId: string; // References Accessory records
  startingPrice: number;
  offers: AuctionOfferEntry[];
  status: "open" | "sold";
  createdAt: DateISO;
}
