import { api } from "./api.ts";
import type { AuctionListing, ErrorMsg } from "@gamenite/shared";
const AUCTION_API_URL = `/api/auction`;

/**
 * Sends a GET request to fetch all open auction listings
 */
export const getAuctions = async (): Promise<AuctionListing[]> => {
  const res = await api.get<AuctionListing[] | ErrorMsg>(`${AUCTION_API_URL}/list`);
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};
