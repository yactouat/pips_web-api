import getUserFromDbWithEmail from "pips_shared/dist/functions/get-user-from-db-with-email";
import { Response } from "express";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";

import signJwtToken from "../../jwt/sign-jwt-token";
import setUserHasPendingMods from "./set-user-has-pending-mods";
import { USER_FETCHED, USER_UPDATED_WITH_PENDING_MODS } from "../../constants";

const sendUserWithTokenResponse = async (
  email: string,
  res: Response,
  updateRequiredTokenConfirmation: boolean = false
) => {
  let resMsg =
    updateRequiredTokenConfirmation == false
      ? USER_UPDATED_WITH_PENDING_MODS
      : USER_FETCHED;
  let user = await getUserFromDbWithEmail(email);
  if (user == null) {
    sendJsonResponse(res, 500, "something went wrong");
    return;
  } else {
    user = await setUserHasPendingMods(user, user.id!);
    const authToken = await signJwtToken({
      id: user!.id as number,
      email: user!.email,
    });
    sendJsonResponse(res, 200, resMsg, {
      token: authToken,
      user: user,
    });
  }
};

export default sendUserWithTokenResponse;
