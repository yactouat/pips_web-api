import runPgQuery from "pips_shared/dist/functions/run-pg-query";
import { UserDto } from "pips_shared/dist/dtos";

const getUserFromDbWithId = async (id: number): Promise<UserDto | null> => {
  const userSelectQuery = await runPgQuery(
    `SELECT * FROM users WHERE id = $1`,
    [id.toString()]
  );
  let user: UserDto | null = null;
  if (userSelectQuery.rowCount > 0) {
    user = userSelectQuery.rows[0] as UserDto;
    user.password = null;
  }
  return user;
};

export default getUserFromDbWithId;
