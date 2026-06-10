import { useEffect, useState } from "react";
import type { Accessory } from "@gamenite/shared";
import { getAccessories } from "../services/accessoryService.ts";

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
