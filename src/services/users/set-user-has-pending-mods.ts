import runPgQuery from "pips_shared/dist/functions/run-pg-query";
import { UserDto } from "pips_shared/dist/dtos";

const setUserHasPendingMods = async (
  user: UserDto,
  userId: number
): Promise<UserDto> => {
  const hasPendingModifications = await runPgQuery(
    `
    SELECT COUNT(*) as haspendingmodifications 
    FROM tokens_users tu
    LEFT JOIN pending_user_modifications pum ON tu.token_id = pum.token_id
    WHERE tu.user_id = $1
    AND (
      pum.committed_at IS NULL
      OR tu.type = 'user_deletion'
    )
    AND tu.type != 'user_verification'
    AND tu.type != 'user_authentication'
  `,
    [userId.toString()]
  );
  user.hasPendingModifications = parseInt(hasPendingModifications.rows[0].haspendingmodifications) > 0;
  return user;
};

export default setUserHasPendingMods;
