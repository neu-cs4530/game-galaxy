import { api } from "@gamegalaxy/client/src/services/api.ts";
import type { Accessory, ErrorMsg } from "@gamegalaxy/shared";
const ACCESSORY_API_URL = `/api/accessory`;

/**
 * sends a GET request to get an accessory
 */
export const getAccessories = async (): Promise<Accessory[]> => {
  const res = await api.get<Accessory[] | ErrorMsg>(ACCESSORY_API_URL);
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};
