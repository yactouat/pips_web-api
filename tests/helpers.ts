import insertUserInDb from "./../src/services/users/insert-user-in-db";
import runPgQuery from "pips_shared/dist/functions/run-pg-query";

export const createTestUser = async () => {
    return await insertUserInDb("test@gmail.com", "password", "handle", "LinkedIn");
};

export const truncateXTable = async (x: string) => {
    await runPgQuery(`TRUNCATE TABLE ${x} CASCADE`);
};
  