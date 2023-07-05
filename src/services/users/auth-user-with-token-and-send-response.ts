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
      `UPDATE tokens tu 
            SET expired = 1 
            WHERE tu.id = (
                SELECT t.id
                FROM tokens t
                WHERE t.token = $1
                AND t.expired != 1
        ) RETURNING *`,
      [authtoken]
    );
    userHasBeenAuthed = expireTokenQueryRes.rows.length > 0;
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
