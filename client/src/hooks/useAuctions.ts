import { useCallback, useEffect, useState } from "react";
import type { AuctionListing } from "@gamegalaxy/shared";
import { getAuctions } from "@gamegalaxy/client/src/services/auctionService.ts";
import useLoginContext from "@gamegalaxy/client/src/hooks/useLoginContext.ts";

/**
 * Custom hook to fetch the open auction listings and keep them in sync.
 * @returns an object containing:
 * - `listings`: the open auction listings
 * - `err`: an error message if the fetch failed, otherwise null
 */
export default function useAuctions() {
  const { socket } = useLoginContext();
  const [listings, setListings] = useState<AuctionListing[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getAuctions()
      .then((data) => {
        setListings(data);
        setErr(null);
      })
      .catch((e) => setErr(`${e}`));
  }, []);

  useEffect(() => {
    refresh();
    socket.on("auctionsUpdated", refresh);
    return () => {
      socket.off("auctionsUpdated", refresh);
    };
  }, [socket, refresh]);

  return { listings, err };
}
