import { useEffect, useState } from "react";
import type { Accessory } from "@gamenite/shared";
import { getAccessories } from "../services/accessoryService.ts";

/**
 * Custom hook to fetch the full accessory catalog from the server.
 * @returns an object containing:
 * - `accessories`: the list of all available accessories
 * - `err`: an error message if the fetch failed, otherwise null
 */
export default function useAccessory() {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getAccessories()
      .then(setAccessories)
      .catch((e) => setErr(`${e}`));
  }, []);

  return { accessories, err };
}
