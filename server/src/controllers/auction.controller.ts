import {
  withAuth,
  zAcceptOfferMessage,
  zCreateAuctionMessage,
  zMakeOfferMessage,
  type AuctionListing,
} from "@gamenite/shared";
import type { RestAPI, SocketAPI } from "../types.ts";
import {
  acceptOffer,
  createAuction,
  getOpenAuctions,
  makeOffer,
} from "../services/auction.service.ts";
import { enforceAuth } from "../services/auth.service.ts";
import { logSocketError } from "./socket.controller.ts";

/**
 * Handles GET requests to retrieve every open auction listing
 * @returns the list of open listings
 */
export const getList: RestAPI<AuctionListing[]> = async (req, res) => {
  res.send(await getOpenAuctions());
};

/**
 * Handles the socket request sent when a user puts an item up for auction
 */
export const socketCreateAuction: SocketAPI = (socket, io) => async (body) => {
  try {
    const { auth, payload } = withAuth(zCreateAuctionMessage).parse(body);
    const user = await enforceAuth(auth);
    await createAuction(user.userId, payload.accessoryId, payload.startingPrice);
    io.emit("auctionsUpdated");
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Handles the socket request sent when a user makes an offer on a listing
 */
export const socketMakeOffer: SocketAPI = (socket, io) => async (body) => {
  try {
    const { auth, payload } = withAuth(zMakeOfferMessage).parse(body);
    const user = await enforceAuth(auth);
    const { sellerUsername, accessoryName, bidderDisplay } = await makeOffer(
      user.userId,
      payload.auctionId,
      payload.price,
      payload.message,
    );
    io.emit("auctionsUpdated");
    io.emit("auctionOfferReceived", {
      seller: sellerUsername,
      auctionId: payload.auctionId,
      accessoryName,
      bidderDisplay,
      price: payload.price,
    });
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Handles the socket request sent when a seller accepts an offer
 */
export const socketAcceptOffer: SocketAPI = (socket, io) => async (body) => {
  try {
    const { auth, payload } = withAuth(zAcceptOfferMessage).parse(body);
    const user = await enforceAuth(auth);
    const { buyerUsername, accessoryName, sellerNewBalance, buyerNewBalance } = await acceptOffer(
      user.userId,
      payload.auctionId,
      payload.offerId,
    );
    socket.emit("balanceUpdated", { balance: sellerNewBalance });
    io.emit("auctionsUpdated");
    io.emit("auctionOfferAccepted", {
      winner: buyerUsername,
      auctionId: payload.auctionId,
      accessoryName,
      newBalance: buyerNewBalance,
    });
  } catch (err) {
    logSocketError(socket, err);
  }
};
