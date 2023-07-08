import { Response } from "express";
import runPgQuery from "pips_shared/dist/functions/run-pg-query";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";
import sendUserWithTokenResponse from "./send-user-with-token-response";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";
import { SERVICE_NAME } from "../../constants";

const authUserWithTokenAndSendResponse = async (
  res: Response,
  email: string,
  authtoken: string
) => {
  let userHasBeenAuthed = false;
  try {
    // expire auth token
    const expireTokenQueryRes = await runPgQuery(
      `UPDATE tokens t1 
            SET expired = 1
            FROM tokens_users tu
            WHERE t1.id = (
                SELECT t.id
                FROM tokens t
                WHERE t.token = $1
                AND t.expired != 1
            )
            AND tu.type = 'user_authentication'
            AND tu.user_id = (SELECT u.id FROM users u WHERE u.email = $2)
        RETURNING *`,
      [authtoken, email]
    );
    userHasBeenAuthed = expireTokenQueryRes.rows.length > 0;
    if (process.env.IS_TEST) {
      logStructuredMess(
        "DEBUG",
        "userHasBeenAuthed",
        JSON.stringify(expireTokenQueryRes.rows),
        SERVICE_NAME
      );
    }
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "authUserWithTokenAndSendResponse ERROR",
      getParsableReqBody({
        authtoken,
        email,
        error,
      }),
      SERVICE_NAME
    );
  }
  if (!userHasBeenAuthed) {
    // meaning something went wrong with user auth
    sendJsonResponse(res, 401, "unauthorized");
  } else {
    await sendUserWithTokenResponse(email, res, false);
  }
};

export default authUserWithTokenAndSendResponse;
