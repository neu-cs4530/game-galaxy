import { TableRepo } from "../repository.ts";

export async function setTableGame(tableId: string, gameId: string): Promise<void> {
  const table = await TableRepo.get(tableId);
  table.currentGame = gameId;
  await TableRepo.set(tableId, table);
}

export async function clearTableGame(tableId: string): Promise<void> {
  const table = await TableRepo.get(tableId);
  delete table.currentGame;
  await TableRepo.set(tableId, table);
}
