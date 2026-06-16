import { z } from "zod";
import { type SafeUserInfo, type Accessory } from "./user.types.ts";

/**
 * Represents a single offer made on an auction listing, as exposed to the
 * client.
 * - `offerId`: database key for the offer
 * - `bidder`: the user who made the offer
 * - `price`: how many coins the bidder is offering
 * - `message`: an optional note from the bidder to the seller
 * - `createdAt`: when the offer was made
 */
export interface AuctionOffer {
  offerId: string;
  bidder: SafeUserInfo;
  price: number;
  message?: string;
  createdAt: Date;
}

/**
 * Represents an auction listing as exposed to the client.
 * - `auctionId`: database key
 * - `seller`: the user who put the item up for sale
 * - `accessory`: the catalog item being sold
 * - `startingPrice`: the seller's suggested starting price, in coins
 * - `offers`: the offers other players have made on this listing
 * - `status`: whether the listing is still open or has been sold
 * - `createdAt`: when the listing was created
 */
export interface AuctionListing {
  auctionId: string;
  seller: SafeUserInfo;
  accessory: Accessory;
  startingPrice: number;
  offers: AuctionOffer[];
  status: "open" | "sold";
  createdAt: Date;
}

/*** Types used in auction api ***/

/**
 * Relevant information for putting an item up for auction.
 */
export type CreateAuctionMessage = z.infer<typeof zCreateAuctionMessage>;
export const zCreateAuctionMessage = z.object({
  accessoryId: z.string(),
  startingPrice: z.number().nonnegative(),
});

/**
 * Relevant information for making an offer on an auction listing.
 */
export type MakeOfferMessage = z.infer<typeof zMakeOfferMessage>;
export const zMakeOfferMessage = z.object({
  auctionId: z.string(),
  price: z.number().positive(),
  message: z.string().optional(),
});

/**
 * Relevant information for accepting an offer on an auction listing.
 */
export type AcceptOfferMessage = z.infer<typeof zAcceptOfferMessage>;
export const zAcceptOfferMessage = z.object({
  auctionId: z.string(),
  offerId: z.string(),
});

/*** Types used in websocket notifications ***/

/**
 * Sent to all clients when an offer is made
 */
export type AuctionOfferNotification = {
  seller: string;
  auctionId: string;
  accessoryName: string;
  bidderDisplay: string;
  price: number;
};

/**
 * Sent to all clients when an offer is accepted
 */
export type AuctionAcceptNotification = {
  winner: string;
  auctionId: string;
  accessoryName: string;
  newBalance: number;
  losingBidders: string[];
};
