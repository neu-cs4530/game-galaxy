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
  it("createAuction rejects duplicate listing for same item", async () => {
    const auctioneer = await idOf("auctioneer");
    // auctioneer already has SEEDED_AUCTION open for hat-01
    await expect(createAuction(auctioneer, "hat-01", 20)).rejects.toThrow("already up for auction");
  });

  it("makeOffer rejects bidder who already owns the item", async () => {
    // auctioneer owns hat-01 and SEEDED_AUCTION is listing hat-01
    // need a user who already owns hat-01 — seed one or use auctioneer's item on another auction
    const user1 = await idOf("user1");
    // give user1 hat-01 directly then try to bid
    const user1Record = await UserRepo.get(user1);
    user1Record.avatar.accessories["hat-01"] = false;
    await UserRepo.set(user1, user1Record);
    await expect(makeOffer(user1, SEEDED_AUCTION, 10)).rejects.toThrow("already own");
  });

  it("makeOffer rejects bid on a closed auction", async () => {
    const user1 = await idOf("user1");
    const auctioneer = await idOf("auctioneer");

    await makeOffer(user1, SEEDED_AUCTION, 30);
    const listing = (await getOpenAuctions()).find((l) => l.auctionId === SEEDED_AUCTION)!;
    await acceptOffer(auctioneer, SEEDED_AUCTION, listing.offers[0].offerId);

    const user2 = await idOf("user2"); // any other user
    await expect(makeOffer(user2, SEEDED_AUCTION, 10)).rejects.toThrow("no longer open");
  });

  it("acceptOffer rejects when caller is not the seller", async () => {
    const user1 = await idOf("user1");
    await makeOffer(user1, SEEDED_AUCTION, 10);
    const listing = (await getOpenAuctions()).find((l) => l.auctionId === SEEDED_AUCTION)!;
    const offerId = listing.offers[0].offerId;

    await expect(acceptOffer(user1, SEEDED_AUCTION, offerId)).rejects.toThrow("your own listing");
  });

  it("acceptOffer rejects when the auction is already closed", async () => {
    const user1 = await idOf("user1");
    const auctioneer = await idOf("auctioneer");

    await makeOffer(user1, SEEDED_AUCTION, 30);
    const listing = (await getOpenAuctions()).find((l) => l.auctionId === SEEDED_AUCTION)!;
    const offerId = listing.offers[0].offerId;
    await acceptOffer(auctioneer, SEEDED_AUCTION, offerId);

    await expect(acceptOffer(auctioneer, SEEDED_AUCTION, offerId)).rejects.toThrow(
      "no longer open",
    );
  });

  it("acceptOffer rejects a nonexistent offer id", async () => {
    const auctioneer = await idOf("auctioneer");
    await expect(acceptOffer(auctioneer, SEEDED_AUCTION, "bad-offer-id")).rejects.toThrow(
      "no longer exists",
    );
  });

  it("acceptOffer rejects when the seller no longer owns the item", async () => {
    const user1 = await idOf("user1");
    const auctioneer = await idOf("auctioneer");

    await makeOffer(user1, SEEDED_AUCTION, 30);
    const listing = (await getOpenAuctions()).find((l) => l.auctionId === SEEDED_AUCTION)!;
    const offerId = listing.offers[0].offerId;

    // remove hat-01 from auctioneer's closet directly
    const auctioneerRecord = await UserRepo.get(auctioneer);
    delete auctioneerRecord.avatar.accessories["hat-01"];
    await UserRepo.set(auctioneer, auctioneerRecord);

    await expect(acceptOffer(auctioneer, SEEDED_AUCTION, offerId)).rejects.toThrow("no longer own");
  });
});
