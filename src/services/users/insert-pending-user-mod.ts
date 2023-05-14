import runPgQuery from "pips_shared/dist/functions/run-pg-query";

import hashUserPassword from "./hash-user-password";
import PendingUserModification from "../../interfaces/pending-user-modification";
import PendingUserModificationType from "../../types/PendingUserModificationType";

/**
 *
 * this function is responsible for inserting a pending user modification in the database
 *
 * @param {string} field the user modification to insert (email, password, etc.)
 * @param {string} value the value of the user modification to insert
 * @returns {Promise<PendingUserModification>} the inserted user modification
 */
const insertPendingUserMod = async (
  field: PendingUserModificationType,
  value: string
): Promise<PendingUserModification> => {
  if (field == "password") {
    value = await hashUserPassword(value);
  }
  const insertUserModQueryRes = await runPgQuery(
    "INSERT INTO pending_user_modifications (field, value) VALUES ($1, $2) RETURNING id, field, value, created_at, committed_at",
    [field, value]
  );
  const mod = insertUserModQueryRes.rows[0] as PendingUserModification;
  return mod;
};

export default insertPendingUserMod;
