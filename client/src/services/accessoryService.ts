import { api } from "./api.ts";
import type { Accessory, ErrorMsg } from "@gamenite/shared";
const ACCESSORY_API_URL = `/api/accessory`;

export const getAccessories = async (): Promise<Accessory[]> => {
  const res = await api.get<Accessory[] | ErrorMsg>(ACCESSORY_API_URL);
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};
