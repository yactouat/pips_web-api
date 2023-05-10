import { argv } from "process";
import migrateDb from "pips_shared/dist/functions/migrate-db";

if (
  argv[1].includes("migrate-db") ||
  (argv[2] && argv[2].includes("migrate-db"))
) {
  migrateDb(); // asynchronous
}
