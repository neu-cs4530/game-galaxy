import { TagRepo } from "../repository.ts";

/**
 * Couples the tags and their respective frequencies together, sorting by common first.
 * @returns the sorted array of [tag, frequency]
 */
export async function getTopTags() {
  const [keys, frequencies] = await getTags();
  const coupled: [string, number][] = [];

  keys.forEach((key, idx) => {
    coupled.push([key, frequencies[idx]]);
  });

  return coupled.sort((a, b) => b[1] - a[1]);
}

/**
 * Pulls all the information from the tag repo, returning the keys (tags) and their frequencies as separate arrays.
 * @returns all tags and their frequencies in the repo, in the same order
 */
export async function getTags(): Promise<[string[], number[]]> {
  const keys = await TagRepo.getAllKeys();
  const frequencies = await TagRepo.getMany(keys);
  return [keys, frequencies];
}
