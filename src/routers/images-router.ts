import { body } from "express-validator";
import express from "express";

import * as imagesController from "../controllers/images-controller";
import checksUserCan from "../middlewares/checks-user-can";
import checksValidationResultMiddleware from "../middlewares/checks-validation-result-middleware";
import validatesJwtTokenMiddleware from "../middlewares/validates-jwt-token-middleware";

const imagesRouter = express.Router();

imagesRouter.get("/", imagesController.getImagesNames);

imagesRouter.post(
  "/",
  body("base64Image").isString(),
  body("imageName").isString(),
  body("imageName").custom((value) => {
    return (value as string).toLowerCase().endsWith(".png");
  }),
  checksValidationResultMiddleware,
  validatesJwtTokenMiddleware,
  checksUserCan,
  imagesController.uploadImage
);

export default imagesRouter;
