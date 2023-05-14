import runPgQuery from "pips_shared/dist/functions/run-pg-query";
import PendingUserModification from "../../interfaces/pending-user-modification";

const getPendingUserModWithToken = async (
  token: string
): Promise<PendingUserModification> => {
  const getUserModIdQueryRes = await runPgQuery(
    `SELECT * 
         FROM pending_user_modifications 
         WHERE token_id = (SELECT id FROM tokens WHERE token = $1) 
         AND committed_at IS NOT NULL
         ORDER BY created_at DESC`,
    [token]
  );
  const userMod = getUserModIdQueryRes.rows[0] as PendingUserModification;
  return userMod;
};

export default getPendingUserModWithToken;
