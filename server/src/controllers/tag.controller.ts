import { type RestAPI } from "../types.ts";
import { getTopTags } from "../services/tag.service.ts";

/**
 * Handle GET requests to `/api/tag/list`. Returns all tags in an array sorted by frequency
 * formatted as ["tag", num_times_used]
 */
export const getList: RestAPI<[string, number][]> = async (req, res) => {
  res.send(await getTopTags());
};
