import { Response } from "express";
import runPgQuery from "pips_shared/dist/functions/run-pg-query";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";

import { SERVICE_NAME, UNAUTHORIZED, USER_DELETED } from "../../constants";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";

const deleteUserAndSendResponse = async (
  userId: number,
  res: Response,
  email: string,
  deletetoken: string
) => {
  let userHasBeenDeleted = true;
  try {
    // delete all previous tokens that belonged to user
    await runPgQuery(
      `DELETE FROM tokens t
        WHERE t.id IN (
            SELECT tu.token_id
            FROM tokens_users tu
            WHERE tu.user_id = $1
            AND tu.type != 'user_deletion'
        )`,
      [userId.toString()]
    );
    // delete user
    await runPgQuery(
      `DELETE FROM users uu
            WHERE uu.id = (
            SELECT u.id 
            FROM users u 
            INNER JOIN tokens_users tu ON u.id = tu.user_id
            INNER JOIN tokens t ON tu.token_id = t.id
            WHERE u.email = $1
            AND u.id = $2
            AND t.token = $3
            AND t.expired = 0
            AND tu.type = 'user_deletion'
        )`,
      [email ?? "", userId.toString(), deletetoken]
    );
    // delete token
    await runPgQuery(`DELETE FROM tokens WHERE token = $1`, [deletetoken]);
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "user deletion ERROR",
      getParsableReqBody({ deletetoken, email, error, userId }),
      SERVICE_NAME
    );
    userHasBeenDeleted = false;
  }
  if (!userHasBeenDeleted) {
    // meaning something went wrong with user verification
    sendJsonResponse(res, 401, UNAUTHORIZED);
  } else {
    res.status(204).send(USER_DELETED);
  }
};

export default deleteUserAndSendResponse;
