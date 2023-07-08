import insertUserInDb from "./../src/services/users/insert-user-in-db";
import runPgQuery from "pips_shared/dist/functions/run-pg-query";

export const createTestUser = async (
    user = "test@gmail.com", 
    password = "password", 
    socialHandle = "handle", 
    socialHandleType = "LinkedIn"
) => {
    return await insertUserInDb(user, password, socialHandle, socialHandleType);
};

export const truncateXTable = async (x: string) => {
    await runPgQuery(`TRUNCATE TABLE ${x} CASCADE`);
};
  