/** Runs once when the server starts. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startDailyBackup } = await import("./lib/db/backup");
  startDailyBackup();
}
