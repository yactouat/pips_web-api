import { Response } from "express";
import { Result, ValidationError } from "express-validator";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";

const sendValidationErrorRes = (
  res: Response,
  errors?: Result<ValidationError>,
  errorMess?: string
) => {
  if (errors != undefined) {
    sendJsonResponse(res, 400, `invalid request`, errors.array());
  } else if (errorMess != undefined) {
    sendJsonResponse(res, 400, errorMess);
  } else {
    sendJsonResponse(res, 400, `invalid request`);
  }
};

export default sendValidationErrorRes;
