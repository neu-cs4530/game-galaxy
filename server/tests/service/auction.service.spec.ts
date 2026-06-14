import { describe, expect, it } from "vitest";
import { getUserByUsername } from "../../src/services/auth.service.ts";
import { UserRepo } from "../../src/repository.ts";
import {
  acceptOffer,
  createAuction,
  getOpenAuctions,
  makeOffer,
} from "../../src/services/auction.service.ts";

const SEEDED_AUCTION = "auctionseed";

async function idOf(username: string): Promise<string> {
  return (await getUserByUsername(username))!.userId;
}

describe("auction.service", () => {
  it("createAuction rejects items the user does not own", async () => {
    const user0 = await idOf("user0");
    await expect(createAuction(user0, "hat-01", 10)).rejects.toThrow();
  });

  it("makeOffer rejects the seller bidding on their own listing", async () => {
    const auctioneer = await idOf("auctioneer");
    await expect(makeOffer(auctioneer, SEEDED_AUCTION, 10)).rejects.toThrow();
  });

  it("transfers the item and coins when an offer is accepted", async () => {
    const user1 = await idOf("user1");
    const auctioneer = await idOf("auctioneer");

    await makeOffer(user1, SEEDED_AUCTION, 30, "please!");
    const listing = (await getOpenAuctions()).find((l) => l.auctionId === SEEDED_AUCTION)!;
    const offerId = listing.offers[0].offerId;

    const result = await acceptOffer(auctioneer, SEEDED_AUCTION, offerId);
    expect(result.buyerNewBalance).toBe(70); // user1: 100 - 30
    expect(result.sellerNewBalance).toBe(30); // auctioneer: 0 + 30

    const buyer = await UserRepo.get(user1);
    const seller = await UserRepo.get(auctioneer);
    expect("hat-01" in buyer.avatar.accessories).toBe(true);
    expect("hat-01" in seller.avatar.accessories).toBe(false);

    // The listing should no longer be open.
    expect((await getOpenAuctions()).some((l) => l.auctionId === SEEDED_AUCTION)).toBe(false);
  });

  it("rejects accepting an offer the bidder can no longer afford", async () => {
    const user1 = await idOf("user1");
    const auctioneer = await idOf("auctioneer");

    await makeOffer(user1, SEEDED_AUCTION, 1000); // more than user1's balance of 100
    const listing = (await getOpenAuctions()).find((l) => l.auctionId === SEEDED_AUCTION)!;
    const offerId = listing.offers[0].offerId;

    await expect(acceptOffer(auctioneer, SEEDED_AUCTION, offerId)).rejects.toThrow();
  });
});
