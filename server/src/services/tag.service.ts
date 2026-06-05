import { TagRepo } from "../repository.ts";

export async function getTopTags() {
  const [keys, frequencies] = await getTags();
  const coupled: [string, number][] = [];

  keys.forEach((key, idx) => {
    coupled.push([key, frequencies[idx]]);
  });

  return coupled.sort((a, b) => b[1] - a[1]);
}

export async function getTags(): Promise<[string[], number[]]> {
  const keys = await TagRepo.getAllKeys();
  const frequencies = await TagRepo.getMany(keys);
  return [keys, frequencies];
}
