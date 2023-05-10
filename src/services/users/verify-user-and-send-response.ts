import { Response } from "express";
import runPgQuery from "pips_shared/dist/functions/run-pg-query";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";
import sendUserWithTokenResponse from "./send-user-with-token-response";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";
import { SERVICE_NAME } from "../../constants";

const verifyUserAndSendResponse = async (
  userId: number,
  res: Response,
  email: string,
  veriftoken: string
) => {
  let userHasBeenVerified = false;
  try {
    // verify user
    const selectVerifTokenQueryRes = await runPgQuery(
      `UPDATE users uu
            SET verified = TRUE 
            WHERE uu.id = (
              SELECT u.id 
              FROM users u 
              INNER JOIN tokens_users tu ON u.id = tu.user_id
              INNER JOIN tokens t ON tu.token_id = t.id
              WHERE u.email = $1
              AND u.id = $2
              AND t.token = $3
              AND t.expired = 0
              AND tu.type = 'user_verification'
            ) 
            RETURNING *`,
      [email ?? "", userId.toString(), veriftoken]
    );
    userHasBeenVerified = selectVerifTokenQueryRes.rows.length > 0;
    // expire token
    if (userHasBeenVerified) {
      const expireTokenQueryRes = await runPgQuery(
        `UPDATE tokens tu 
            SET expired = 1 
            WHERE tu.id = (
              SELECT t.id
              FROM tokens t
              WHERE t.token = $1
            ) RETURNING *
          `,
        [veriftoken]
      );
      userHasBeenVerified = expireTokenQueryRes.rows.length > 0;
    }
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "user verification ERROR",
      getParsableReqBody({ veriftoken, email, error, userId }),
      SERVICE_NAME
    );
  }
  if (!userHasBeenVerified) {
    // meaning something went wrong with user verification
    sendJsonResponse(res, 401, "unauthorized");
  } else {
    await sendUserWithTokenResponse(email, res, true);
  }
};

export default verifyUserAndSendResponse;
