import { Request, Response } from "express";
import getUserFromDbWithEmail from "pips_shared/dist/functions/get-user-from-db-with-email";
import getUserFromDbWithId from "pips_shared/dist/functions/get-user-from-db-with-id";
import linkTokenToUserMod from "pips_shared/dist/functions/link-token-to-user-mod";
import runPgQuery from "pips_shared/dist/functions/run-pg-query";
import saveUserToken from "pips_shared/dist/functions/save-user-token";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";

import compareIdWithToken from "../jwt/compare-id-with-token";
import {
  FORBIDDEN,
  NO_PROFILE_DATA_TO_UPDATE,
  PARTIAL_PROFILE_DATA_UPDATE,
  PASSWORD_RESET_REQUEST_FAILED,
  PASSWORD_RESET_REQUEST_SENT,
  SERVICE_NAME,
  TOKEN_TYPE_NOT_SUPPORTED,
  USER_ALREADY_EXISTS,
  USER_CREATED,
  USER_CREATION_FAILED,
  USER_DELETION_REQUEST_SENT,
  USER_FETCHED,
  USER_NOT_FOUND,
  USER_NOT_VERIFIED,
  USER_PERMISSIONS_FETCHED,
  USER_PERMISSIONS_UPDATED,
  USER_UPDATE_FAILED,
} from "../constants";
import getPubSubClient from "../get-pubsub-client";
import getUserIdFromParams from "../services/users/get-user-id-from-params";
import insertUserInDb from "../services/users/insert-user-in-db";
import sendUserWithTokenResponse from "../services/users/send-user-with-token-response";
import signJwtToken from "../jwt/sign-jwt-token";
import verifyUserAndSendResponse from "../services/users/verify-user-and-send-response";
import insertPendingUserMod from "../services/users/insert-pending-user-mod";
import commitPendingUserMod from "../services/users/commit-pending-user-mod";
import setUserHasPendingMods from "../services/users/set-user-has-pending-mods";
import deleteUserAndSendResponse from "../services/users/delete-user-and-send-response";
import authUserWithTokenAndSendResponse from "../services/users/auth-user-with-token-and-send-response";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";

export const authUserWithToken = async (req: Request, res: Response) => {
  const { email, token } = req.body;
  await authUserWithTokenAndSendResponse(res, email, token);
};

export const createUser = async (req: Request, res: Response) => {
  const userAlreadyExists = await getUserFromDbWithEmail(req.body.email);
  if (userAlreadyExists != null) {
    sendJsonResponse(res, 409, USER_ALREADY_EXISTS);
    return;
  }

  try {
    const { email, password, socialhandle, socialhandletype } = req.body;
    const user = await insertUserInDb(
      email,
      password,
      socialhandle,
      socialhandletype
    );
    /**
     * send PubSub message for user created event containing user email,
     * this message is then consumed by decoupled services, such as the mailer,
     * which sends a verification email to the user containing a verification token
     */
    if (process.env.NODE_ENV != "development") {
      // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
      const dataBuffer = Buffer.from(user.email);
      // this below returns a message id (case I need it one day)
      await getPubSubClient()
        .topic(process.env.PUBSUB_USERS_TOPIC as string)
        .publishMessage({
          data: dataBuffer,
          attributes: {
            env: process.env.NODE_ENV as string,
            userTokenType: "User_Verification",
          },
        });
    } else {
      // in development, we don't use PubSub, we just call the function to persist a verification token in the db directly
      await saveUserToken(user.email, "User_Verification"); // /profile?veriftoken=TOKEN&email=EMAIL&userid=ID to validate on client side
    }

    // creating the auth token
    const authToken = await signJwtToken({
      id: user.id as number,
      email: user.email,
    });

    // sending the response
    sendJsonResponse(res, 201, USER_CREATED, {
      token: authToken,
      user: user,
    });
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "createUser ERROR",
      getParsableReqBody({
        error,
        reqBody: req.body,
      }),
      SERVICE_NAME
    );
    sendJsonResponse(res, 500, USER_CREATION_FAILED);
  } finally {
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  let userProfileDeletionRequestWentThrough = false;
  const userId = getUserIdFromParams(req) as number;
  // validating id from JWT
  if (!compareIdWithToken(req, userId)) {
    sendJsonResponse(res, 403, FORBIDDEN);
    return;
  }
  // validating the user exists in the db
  let user = await getUserFromDbWithId(userId);
  if (user == null) {
    sendJsonResponse(res, 404, USER_NOT_FOUND);
    return;
  }
  try {
    if (process.env.NODE_ENV != "development") {
      const dataBuffer = Buffer.from(user.email);
      await getPubSubClient()
        .topic(process.env.PUBSUB_USERS_TOPIC as string)
        .publishMessage({
          data: dataBuffer,
          attributes: {
            env: process.env.NODE_ENV as string,
            userTokenType: "User_Deletion",
          },
        });
      userProfileDeletionRequestWentThrough = true;
    } else {
      // dev mode
      const userToken = await saveUserToken(user.email, "User_Deletion");
      userProfileDeletionRequestWentThrough = userToken != "";
    }
    user = await setUserHasPendingMods(user, userId);
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "deleteUser ERROR",
      getParsableReqBody({
        error,
        reqBody: req.body,
      }),
      SERVICE_NAME
    );
  }
  if (!userProfileDeletionRequestWentThrough) {
    sendJsonResponse(res, 500, USER_UPDATE_FAILED);
  } else {
    sendJsonResponse(res, 200, USER_DELETION_REQUEST_SENT, user);
  }
};

export const getUser = async (req: Request, res: Response) => {
  const userId = getUserIdFromParams(req) as number;
  // validating id from JWT
  if (!compareIdWithToken(req, userId)) {
    sendJsonResponse(res, 403, FORBIDDEN);
    return;
  }
  let user = await getUserFromDbWithId(userId);
  if (user == null) {
    sendJsonResponse(res, 404, USER_NOT_FOUND);
    return;
  }
  user = await setUserHasPendingMods(user, userId);
  logStructuredMess(
    "DEBUG",
    "getUser REQUESTED USED ID",
    getParsableReqBody({
      user,
      userId,
      reqBody: req.body,
    }),
    SERVICE_NAME
  );
  sendJsonResponse(res, 200, USER_FETCHED, user);
};

export const getUserPermissions = async (req: Request, res: Response) => {
  const userId = getUserIdFromParams(req) as number;
  let user = await getUserFromDbWithId(userId);
  if (user == null) {
    sendJsonResponse(res, 404, USER_NOT_FOUND);
    return;
  }
  const permissionsQueryRes = await runPgQuery(
    `SELECT action, resource 
    FROM permissions p
    INNER JOIN permissions_users pu ON p.id = pu.permission_id
    INNER JOIN users u ON pu.user_id = u.id
    WHERE u.id = $1`,
    [userId.toString()]
  );
  logStructuredMess(
    "DEBUG",
    "getUserPermissions REQUESTED USED ID",
    getParsableReqBody({
      permissions: permissionsQueryRes,
      user,
      userId,
    }),
    SERVICE_NAME
  );
  // send back formatted permissions
  sendJsonResponse(
    res,
    200,
    USER_PERMISSIONS_FETCHED,
    permissionsQueryRes.rows.map((row) => `${row.action}:${row.resource}`)
  );
};

export const processUserToken = async (req: Request, res: Response) => {
  // checking that at least one supported token type is present in the request
  if (
    !req.body.authtoken &&
    !req.body.deletetoken &&
    !req.body.modifytoken &&
    !req.body.veriftoken
  ) {
    sendJsonResponse(res, 400, TOKEN_TYPE_NOT_SUPPORTED);
    return;
  }

  // validating the user id present in the URL
  const userId = getUserIdFromParams(req);

  // validating the user exists in the db
  const userFromDb = await getUserFromDbWithEmail(req.body.email);
  if (userFromDb == null) {
    sendJsonResponse(res, 404, USER_NOT_FOUND);
    return;
  }

  // validating that this user corresponds to the user id in the URL
  if (userFromDb.id !== userId) {
    sendJsonResponse(res, 403, FORBIDDEN);
    return;
  }

  const tokenType = req.body.authtoken
    ? "authtoken"
    : req.body.deletetoken
    ? "deletetoken"
    : req.body.modifytoken
    ? "modifytoken"
    : req.body.veriftoken
    ? "veriftoken"
    : "";

  switch (tokenType) {
    case "authtoken":
      await authUserWithTokenAndSendResponse(
        res,
        req.body.email,
        req.body.authtoken
      );
      break;
    case "deletetoken":
      await deleteUserAndSendResponse(
        userId,
        res,
        req.body.email,
        req.body.deletetoken
      );
      break;
    case "modifytoken":
      await commitPendingUserMod(req.body.modifytoken, req.body.email, res);
      break;
    case "veriftoken":
      await verifyUserAndSendResponse(
        userId,
        res,
        req.body.email,
        req.body.veriftoken
      );
      break;
    default:
      sendJsonResponse(res, 400, TOKEN_TYPE_NOT_SUPPORTED);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  // validating the user exists in the db
  const existingUser = await getUserFromDbWithEmail(req.body.email);
  if (existingUser == null) {
    sendJsonResponse(res, 404, USER_NOT_FOUND);
    return;
  }
  logStructuredMess(
    "INFO",
    "PASSWORD RESET REQUEST USER PROFILE PAYLOAD",
    getParsableReqBody(req.body),
    SERVICE_NAME
  );

  let passwordResetRequestWentThrough = false;
  try {
    if (process.env.NODE_ENV != "development") {
      // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
      const dataBuffer = Buffer.from(existingUser.email);
      // this below returns a message id (case I need it one day)
      await getPubSubClient()
        .topic(process.env.PUBSUB_USERS_TOPIC as string)
        .publishMessage({
          data: dataBuffer,
          attributes: {
            env: process.env.NODE_ENV as string,
            userTokenType: "User_Authentication",
          },
        });
      passwordResetRequestWentThrough = true;
    } else {
      // dev mode
      const userToken = await saveUserToken(
        existingUser.email,
        "User_Authentication"
      );
      passwordResetRequestWentThrough = userToken != "";
    }
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "PASSWORD RESET REQUEST ERROR",
      getParsableReqBody({ error, reqBody: req.body }),
      SERVICE_NAME
    );
  }

  if (!passwordResetRequestWentThrough) {
    sendJsonResponse(res, 500, PASSWORD_RESET_REQUEST_FAILED);
    return;
  }

  sendJsonResponse(res, 201, PASSWORD_RESET_REQUEST_SENT);
};

export const updateUser = async (req: Request, res: Response) => {
  // validating the user id present in the URL
  const userId = getUserIdFromParams(req) as number;

  // validating id from JWT
  if (!compareIdWithToken(req, userId)) {
    sendJsonResponse(res, 403, FORBIDDEN);
    return;
  }

  // validating the user exists in the db
  const existingUser = await getUserFromDbWithId(userId);
  if (existingUser == null) {
    sendJsonResponse(res, 404, USER_NOT_FOUND);
    return;
  }

  // user needs to be verified before proceeding
  if (!existingUser.verified) {
    sendJsonResponse(res, 403, USER_NOT_VERIFIED);
    return;
  }
  logStructuredMess(
    "INFO",
    "UPDATE USER PROFILE PAYLOAD",
    getParsableReqBody(req.body),
    SERVICE_NAME
  );

  // update the user only when needed
  if (
    existingUser.email === req.body.email &&
    existingUser.socialHandle === req.body.socialhandle &&
    existingUser.socialHandleType === req.body.socialhandletype &&
    !req.body.password
  ) {
    sendJsonResponse(res, 422, NO_PROFILE_DATA_TO_UPDATE);
    return;
  }

  let userHasBeenProperlyUpdated = false;
  try {
    const userUpdateQueryRes = await runPgQuery(
      `UPDATE users SET socialhandle = $1, socialhandletype = $2, email = $4 WHERE id = $3 RETURNING *`,
      [
        req.body.socialhandle,
        req.body.socialhandletype,
        userId,
        existingUser.email, // we use the existing user email here to prevent fraudulent profile updates
      ]
    );
    userHasBeenProperlyUpdated = userUpdateQueryRes.rowCount > 0;
  } catch (error) {
    logStructuredMess(
      "ERROR",
      USER_UPDATE_FAILED,
      getParsableReqBody({ error, reqBody: req.body }),
      SERVICE_NAME
    );
    sendJsonResponse(res, 500, USER_UPDATE_FAILED);
    return;
  }

  /**
   *
   * this for loop below concerns profile modifications that require additional user confirmation before being committed to the system;
   *
   * to validate a pending user modification regarding critical profile data, such as email and password,
   * the process is in 2 steps; from the user perspective:
   * 1. user modifies his profile
   * 2. user receives an email with a token to validate the modification
   *
   * this happens by:
   * 1. saving a pending user modification payload in the db
   * 2. sending a pubsub message with the user token and the pending user modification id
   * 3. linking the user token to the pending user modification in the db with a consuming service that listens to the pubsub message (or directly in this API in dev mode, withtout the PubSub part)
   * 4. this consuming service sends an email to the user with the token
   */
  const fieldsThatRequireUserConfirmation = ["email", "password"];
  let updateRequiresUserConfirmation = false;
  for (let i = 0; i < fieldsThatRequireUserConfirmation.length; i++) {
    const field = fieldsThatRequireUserConfirmation[i];
    if (
      (field == "email" &&
        req.body[field] &&
        req.body[field] != existingUser.email) ||
      (field == "password" &&
        req.body[field] &&
        req.body[field] != existingUser.password)
    ) {
      updateRequiresUserConfirmation = true;
      try {
        const mod = await insertPendingUserMod(field, req.body[field]);
        logStructuredMess(
          "INFO",
          "PENDING USER MODIFICATION INSERTED",
          getParsableReqBody(mod),
          SERVICE_NAME
        );
        if (process.env.NODE_ENV != "development") {
          // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
          const dataBuffer = Buffer.from(existingUser.email);
          // this below returns a message id (case I need it one day)
          await getPubSubClient()
            .topic(process.env.PUBSUB_USERS_TOPIC as string)
            .publishMessage({
              data: dataBuffer,
              attributes: {
                env: process.env.NODE_ENV as string,
                userModId: mod.id.toString(),
                userTokenType: "User_Modification",
              },
            });
        } else {
          // dev mode
          const userToken = await saveUserToken(
            existingUser.email,
            "User_Modification"
          );
          // link the user token to the pending user modification directly in db in dev mode
          userHasBeenProperlyUpdated = await linkTokenToUserMod(
            userToken,
            mod.id
          );
          userHasBeenProperlyUpdated =
            userHasBeenProperlyUpdated && userToken != "";
        }
      } catch (error) {
        logStructuredMess(
          "ERROR",
          USER_UPDATE_FAILED,
          getParsableReqBody({ error, reqBody: req.body }),
          SERVICE_NAME
        );
        sendJsonResponse(res, 500, USER_UPDATE_FAILED);
        return;
      }
    }
  }

  if (!userHasBeenProperlyUpdated) {
    sendJsonResponse(res, 500, PARTIAL_PROFILE_DATA_UPDATE);
    return;
  }

  await sendUserWithTokenResponse(
    existingUser.email,
    res,
    updateRequiresUserConfirmation
  );
};

export const updateUserPermissions = async (req: Request, res: Response) => {
  const userId = getUserIdFromParams(req) as number;

  // validating the user exists in the db
  const existingUser = await getUserFromDbWithId(userId);
  if (existingUser == null) {
    sendJsonResponse(res, 404, USER_NOT_FOUND);
    return;
  }

  const inputPermissions = (req.body.permissions as string[]).map(
    (permission) => {
      const exploded = permission.split(":");
      const action = exploded[0].toLowerCase();
      const resource = exploded[1].toLowerCase();
      return {
        action,
        resource,
      };
    }
  );

  let userHasBeenProperlyUpdated = false;

  // delete whatever permissions the user previously had
  try {
    const deletePreviousPermissionsQueryRes = await runPgQuery(
      `DELETE FROM permissions_users WHERE user_id = $1 RETURNING *`,
      [userId.toString()]
    );
    userHasBeenProperlyUpdated = deletePreviousPermissionsQueryRes.rowCount > 0;
  } catch (error) {
    logStructuredMess(
      "ERROR",
      USER_UPDATE_FAILED,
      getParsableReqBody({ error, reqBody: req.body }),
      SERVICE_NAME
    );
    sendJsonResponse(res, 500, USER_UPDATE_FAILED);
    return;
  }

  for (let i = 0; i < inputPermissions.length; i++) {
    const permission = inputPermissions[i];
    try {
      const userUpdateQueryRes = await runPgQuery(
        `WITH inputPermission AS (
          SELECT id
          FROM permissions p
          WHERE p.action = $1 AND p.resource = $2
        )
        INSERT INTO permissions_users (permission_id, user_id) VALUES((SELECT id from inputPermission), $3)  RETURNING *`,
        [permission.action, permission.resource, userId.toString()]
      );
      userHasBeenProperlyUpdated = userUpdateQueryRes.rowCount > 0;
    } catch (error) {
      logStructuredMess(
        "ERROR",
        USER_UPDATE_FAILED,
        getParsableReqBody({ error, reqBody: req.body }),
        SERVICE_NAME
      );
      sendJsonResponse(res, 500, USER_UPDATE_FAILED);
      return;
    }
  }

  if (!userHasBeenProperlyUpdated) {
    sendJsonResponse(res, 500, PARTIAL_PROFILE_DATA_UPDATE);
    return;
  }
  sendJsonResponse(res, 200, USER_PERMISSIONS_UPDATED);
};
