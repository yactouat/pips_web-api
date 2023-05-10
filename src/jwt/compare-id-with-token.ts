import { Request } from "express";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";

import { SERVICE_NAME } from "../constants";

const compareIdWithToken = (req: Request, userId: number): boolean => {
  try {
    const authedUser = JSON.parse(req.params.authedUser);
    return authedUser.id == userId;
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "AUTHED USER ID DOES NOT MATCH TOKEN ID",
      getParsableReqBody({ error, reqBody: req.body, reqParams: req.params }),
      SERVICE_NAME
    );
    return false;
  }
};

export default compareIdWithToken;
