import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";

import getJwtToken from "../jwt/get-jwt-token";
import { SERVICE_NAME, UNAUTHORIZED } from "../constants";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";

const validatesJwtTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let ok = false;
  let jwtToken = "";
  try {
    jwtToken = getJwtToken(req.headers.authorization);
    ok = true;
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "ERROR WITH RECEIVED AUTHORIZATION HEADER",
      getParsableReqBody({
        error,
        reqBody: req.body,
        reqHeaders: req.headers,
      }),
      SERVICE_NAME
    );
  }
  if (ok) {
    try {
      const decodedToken = jwt.verify(
        jwtToken,
        process.env.JWT_SECRET as string
      );
      req.params.authedUser = JSON.stringify(decodedToken);
      next();
    } catch (error) {
      logStructuredMess(
        "ERROR",
        "ERROR SETTING AUTHED USER",
        getParsableReqBody({
          error,
          reqParams: req.params,
        }),
        SERVICE_NAME
      );
      ok = false;
    }
  }
  if (!ok) {
    sendJsonResponse(res, 401, UNAUTHORIZED);
  }
};

export default validatesJwtTokenMiddleware;
