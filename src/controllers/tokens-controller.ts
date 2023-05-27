import bcrypt from "bcrypt";
import getUserFromDbWithEmail from "pips_shared/dist/functions/get-user-from-db-with-email";
import { Request, Response } from "express";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";
import { validationResult } from "express-validator";

import {
  AUTH_TOKEN_ISSUED,
  INVALID_CREDENTIALS,
  SERVER_ERROR,
  SERVICE_NAME,
  USER_NOT_FOUND,
} from "../constants";
import signJwtToken from "../jwt/sign-jwt-token";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";

export const getJWTAuthToken = async (req: Request, res: Response) => {
  let token = "";
  let authed = false;
  const inputPassword = req.body.password;
  const user = await getUserFromDbWithEmail(req.body.email, false);
  if (user == null) {
    sendJsonResponse(res, 404, USER_NOT_FOUND);
    return;
  }
  try {
    authed = await bcrypt.compare(inputPassword, user.password as string);
    token = authed
      ? await signJwtToken({
          email: user.email,
          id: user.id as number,
        })
      : "";
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "unable to get JWT auth token",
      getParsableReqBody({
        error,
        reqBody: req.body,
      }),
      SERVICE_NAME
    );
    sendJsonResponse(res, 500, SERVER_ERROR);
    return;
  }
  if (authed == false) {
    sendJsonResponse(res, 401, INVALID_CREDENTIALS);
  } else {
    sendJsonResponse(res, 200, AUTH_TOKEN_ISSUED, {
      token: token,
      userId: user.id,
    });
  }
};
