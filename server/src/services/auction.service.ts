import { randomUUID } from "node:crypto";
import type { AuctionListing } from "@gamenite/shared";
import { AccessoryRepo, AuctionRepo, UserRepo } from "../repository.ts";
import { populateSafeUserInfo, updateCoinCount } from "./user.service.ts";

/**
 * Put one of a user's owned accessories up for auction.
 *
 * @param sellerUserId - the id of the user selling the item
 * @param accessoryId - the accessory to sell (must be in the seller's closet)
 * @param startingPrice - the seller's suggested starting price
 * @returns the id of the new auction listing
 * @throws if the seller does not own the accessory or already has an open
 * listing for it
 */
export async function createAuction(
  sellerUserId: string,
  accessoryId: string,
  startingPrice: number,
): Promise<string> {
  const seller = await UserRepo.get(sellerUserId);
  if (!(accessoryId in seller.avatar.accessories)) {
    throw new Error("You can only auction items you own");
  }

  const existing = await getAuctionRecords();
  if (
    existing.some(
      ({ value }) =>
        value.status === "open" &&
        value.seller === sellerUserId &&
        value.accessoryId === accessoryId,
    )
  ) {
    throw new Error("That item is already up for auction");
  }

  return AuctionRepo.add({
    seller: sellerUserId,
    accessoryId,
    startingPrice,
    offers: [],
    status: "open",
    createdAt: new Date().toISOString(),
  });
}

/**
 * Retrieve every open auction listing, resolved into client-facing shapes.
 *
 * @returns all open listings, most recently created first
 */
export async function getOpenAuctions(): Promise<AuctionListing[]> {
  const records = await getAuctionRecords();
  const open = records
    .filter(({ value }) => value.status === "open")
    .sort((a, b) => b.value.createdAt.localeCompare(a.value.createdAt));

  return Promise.all(
    open.map(async ({ key, value }) => ({
      auctionId: key,
      seller: await populateSafeUserInfo(value.seller),
      accessory: await AccessoryRepo.get(value.accessoryId),
      startingPrice: value.startingPrice,
      status: value.status,
      createdAt: new Date(value.createdAt),
      offers: await Promise.all(
        value.offers.map(async (offer) => ({
          offerId: offer.offerId,
          bidder: await populateSafeUserInfo(offer.bidder),
          price: offer.price,
          message: offer.message,
          createdAt: new Date(offer.createdAt),
        })),
      ),
    })),
  );
}

/**
 * Make an offer on an open auction listing.
 *
 * @param bidderUserId - the id of the user making the offer
 * @param auctionId - the listing to bid on
 * @param price - the offered price
 * @param message - an optional note to the seller
 * @returns details used to notify the seller of the new offer
 * @throws if the listing is missing/closed, the bidder is the seller, or the
 * bidder already owns the accessory
 */
export async function makeOffer(
  bidderUserId: string,
  auctionId: string,
  price: number,
  message?: string,
): Promise<{ sellerUsername: string; accessoryName: string; bidderDisplay: string }> {
  const auction = await AuctionRepo.get(auctionId);
  if (auction.status !== "open") {
    throw new Error("That auction is no longer open");
  }
  if (auction.seller === bidderUserId) {
    throw new Error("You cannot make an offer on your own listing");
  }

  const bidder = await UserRepo.get(bidderUserId);
  if (auction.accessoryId in bidder.avatar.accessories) {
    throw new Error("You already own that item");
  }

  auction.offers.push({
    offerId: randomUUID().toString(),
    bidder: bidderUserId,
    price,
    message,
    createdAt: new Date().toISOString(),
  });
  await AuctionRepo.set(auctionId, auction);

  const seller = await UserRepo.get(auction.seller);
  const accessory = await AccessoryRepo.get(auction.accessoryId);
  return {
    sellerUsername: seller.username,
    accessoryName: accessory.name,
    bidderDisplay: bidder.display,
  };
}

/**
 * Accept an offer on a listing: transfer coins from the bidder to the seller
 * and move the item from the seller's closet into the bidder's closet.
 *
 * @param sellerUserId - the id of the user accepting (must own the listing)
 * @param auctionId - the listing whose offer is being accepted
 * @param offerId - the offer to accept
 * @returns details used to notify both parties and update balances
 * @throws if the caller is not the seller, the listing is closed, the offer
 * does not exist, the seller no longer owns the item, or the bidder can no
 * longer afford their offer
 */
export async function acceptOffer(
  sellerUserId: string,
  auctionId: string,
  offerId: string,
): Promise<{
  buyerUsername: string;
  accessoryName: string;
  sellerNewBalance: number;
  buyerNewBalance: number;
  losingBidderUsernames: string[];
}> {
  const auction = await AuctionRepo.get(auctionId);
  if (auction.seller !== sellerUserId) {
    throw new Error("You can only accept offers on your own listing");
  }
  if (auction.status !== "open") {
    throw new Error("That auction is no longer open");
  }

  const offer = auction.offers.find((o) => o.offerId === offerId);
  if (!offer) {
    throw new Error("That offer no longer exists");
  }

  const seller = await UserRepo.get(sellerUserId);
  if (!(auction.accessoryId in seller.avatar.accessories)) {
    throw new Error("You no longer own that item");
  }

  const buyer = await UserRepo.get(offer.bidder);
  if (buyer.balance < offer.price) {
    throw new Error("The bidder can no longer afford their offer");
  }

  // Move the accessory and transfer coins
  delete seller.avatar.accessories[auction.accessoryId];
  buyer.avatar.accessories[auction.accessoryId] = false;
  await UserRepo.set(sellerUserId, seller);
  await UserRepo.set(offer.bidder, buyer);
  const buyerNewBalance = await updateCoinCount(offer.bidder, -offer.price);
  const sellerNewBalance = await updateCoinCount(sellerUserId, offer.price);

  auction.status = "sold";
  await AuctionRepo.set(auctionId, auction);

  // Collect the unique bidders whose offers were not accepted so they can be
  // told the item was sold to someone else.
  const losingBidderIds = [
    ...new Set(auction.offers.map((o) => o.bidder).filter((id) => id !== offer.bidder)),
  ];
  const losingBidderUsernames = await Promise.all(
    losingBidderIds.map(async (id) => (await UserRepo.get(id)).username),
  );

  const accessory = await AccessoryRepo.get(auction.accessoryId);
  return {
    buyerUsername: buyer.username,
    accessoryName: accessory.name,
    sellerNewBalance,
    buyerNewBalance,
    losingBidderUsernames,
  };
}

/** Load every auction record paired with its key. */
async function getAuctionRecords() {
  const keys = await AuctionRepo.getAllKeys();
  const values = await AuctionRepo.getMany(keys);
  return keys.map((key, i) => ({ key, value: values[i] }));
}
