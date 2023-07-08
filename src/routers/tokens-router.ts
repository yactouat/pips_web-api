import { body } from "express-validator";
import express from "express";

import * as tokensController from "../controllers/tokens-controller";
import checksValidationResultMiddleware from "../middlewares/checks-validation-result-middleware";

const tokensRouter = express.Router();

// get a JWT auth token after posting credentials
tokensRouter.post(
  "/",
  body("email").isEmail(),
  body("password").notEmpty().isString(),
  checksValidationResultMiddleware,
  tokensController.getJWTAuthToken
);

export default tokensRouter;
