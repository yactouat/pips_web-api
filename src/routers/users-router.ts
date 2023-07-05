import { body } from "express-validator";
import express from "express";

import * as usersController from "../controllers/users-controller";
import checksUserCan from "../middlewares/checks-user-can";
import checksValidationResultMiddleware from "../middlewares/checks-validation-result-middleware";
import validatesJwtTokenMiddleware from "../middlewares/validates-jwt-token-middleware";
import validatesSocialHandleType from "../services/users/validates-social-handle-type";
import validatesUserIdParamMiddleware from "../middlewares/validates-user-id-param-middleware";
import validatesPermissions from "../services/users/validates-permissions";

const usersRouter = express.Router();

usersRouter.delete(
  "/:id",
  validatesUserIdParamMiddleware,
  validatesJwtTokenMiddleware,
  usersController.deleteUser
);

usersRouter.get(
  "/:id",
  validatesUserIdParamMiddleware,
  validatesJwtTokenMiddleware,
  usersController.getUser
);

usersRouter.get(
  "/:id/permissions",
  validatesUserIdParamMiddleware,
  validatesJwtTokenMiddleware,
  checksUserCan,
  usersController.getUserPermissions
);

usersRouter.post(
  "/",
  body("email").isEmail(),
  body("password").isStrongPassword(),
  body("socialhandle").notEmpty().isString(),
  body("socialhandletype").custom((value) => {
    return validatesSocialHandleType(value);
  }),
  checksValidationResultMiddleware,
  usersController.createUser
);

usersRouter.post(
  "/reset-password",
  body("email").isEmail(),
  checksValidationResultMiddleware,
  usersController.resetPassword
);

usersRouter.put(
  "/:id",
  validatesUserIdParamMiddleware,
  body("email").isEmail(),

  /**
   * strong password defaults to
   * {
   *    minLength: 8,
   *    minLowercase: 1,
   *    minUppercase: 1,
   *    minNumbers: 1,
   *    minSymbols: 1,
   *    returnScore: false,
   *    pointsPerUnique: 1,
   *    pointsPerRepeat: 0.5,
   *    pointsForContainingLower: 10,
   *    pointsForContainingUpper: 10,
   *    pointsForContainingNumber: 10,
   *    pointsForContainingSymbol: 10
   * }
   * */
  body("password").isStrongPassword().optional(),

  body("socialhandle").isString(),
  body("socialhandletype").custom((value) => {
    return validatesSocialHandleType(value);
  }),
  checksValidationResultMiddleware,
  validatesJwtTokenMiddleware,
  usersController.updateUser
);

// TODO delete old implementation
usersRouter.put(
  "/:id/process-token",
  validatesUserIdParamMiddleware,
  body("email").isEmail(),
  body("deletetoken").isString().optional(),
  body("modifytoken").isString().optional(),
  body("veriftoken").isString().optional(),
  checksValidationResultMiddleware,
  usersController.processUserToken
);

usersRouter.put(
  "/:id/permissions",
  validatesUserIdParamMiddleware,
  validatesJwtTokenMiddleware,
  body("permissions").isArray(),
  body("permissions").custom((value) => {
    return validatesPermissions(value);
  }),
  checksValidationResultMiddleware,
  checksUserCan,
  usersController.updateUserPermissions
);

export default usersRouter;
