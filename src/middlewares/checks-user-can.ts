import { NextFunction, Request, Response } from "express";
import runPgQuery from "pips_shared/dist/functions/run-pg-query";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";

import {
  CREATE_BLOG_POSTS_HTTP_INFO,
  CREATE_IMAGE_HTTP_INFO,
  DELETE_BLOG_POSTS_HTTP_INFO,
  FORBIDDEN,
  READ_BLOG_POSTS_DRAFTS_HTTP_INFO,
  READ_USERS_PERMISSIONS_HTTP_INFO,
  SERVICE_NAME,
  UPDATE_USERS_PERMISSIONS_HTTP_INFO,
} from "../constants";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";
import Permission from "../interfaces/permission";

const checksUserCan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let userCan = false;
  const authedUser = JSON.parse(req.params.authedUser);
  let httpInfo = "";
  const httpPermissionsMap = new Map<string, Permission>();
  // setting HTTP / permissions map
  httpPermissionsMap.set(READ_BLOG_POSTS_DRAFTS_HTTP_INFO, {
    action: "Read",
    resource: "Blog_Posts_Drafts",
  });
  httpPermissionsMap.set(UPDATE_USERS_PERMISSIONS_HTTP_INFO, {
    action: "Update",
    resource: "Users_Permissions",
  });
  httpPermissionsMap.set(CREATE_IMAGE_HTTP_INFO, {
    action: "Create",
    resource: "Images",
  });
  httpPermissionsMap.set(CREATE_BLOG_POSTS_HTTP_INFO, {
    action: "Create",
    resource: "Blog_Posts",
  });
  httpPermissionsMap.set(DELETE_BLOG_POSTS_HTTP_INFO, {
    action: "Delete",
    resource: "Blog_Posts",
  });
  httpPermissionsMap.set(READ_USERS_PERMISSIONS_HTTP_INFO, {
    action: "Read",
    resource: "Users_Permissions",
  });
  // determining HTTP info
  const requestedUrl = req.baseUrl + req.path;
  if (
    req.method.toLowerCase() === "get" &&
    requestedUrl.startsWith("/blog-posts/drafts")
  ) {
    httpInfo = READ_BLOG_POSTS_DRAFTS_HTTP_INFO;
  }
  if (
    req.method.toLowerCase() === "put" &&
    requestedUrl.startsWith("/users/") &&
    requestedUrl.endsWith("/permissions")
  ) {
    httpInfo = UPDATE_USERS_PERMISSIONS_HTTP_INFO;
  }
  if (
    req.method.toLowerCase() === "post" &&
    (requestedUrl === "/images/" || requestedUrl === "/images")
  ) {
    httpInfo = CREATE_IMAGE_HTTP_INFO;
  }
  if (
    req.method.toLowerCase() === "post" &&
    (requestedUrl === "/blog-posts/" || requestedUrl === "/blog-posts")
  ) {
    httpInfo = CREATE_BLOG_POSTS_HTTP_INFO;
  }
  if (
    req.method.toLowerCase() === "delete" &&
    requestedUrl.startsWith("/blog-posts/") &&
    requestedUrl.length > "/blog-posts/".length
  ) {
    httpInfo = DELETE_BLOG_POSTS_HTTP_INFO;
  }
  if (
    req.method.toLowerCase() === "get" &&
    requestedUrl.startsWith("/users/") &&
    requestedUrl.endsWith("/permissions")
  ) {
    httpInfo = READ_USERS_PERMISSIONS_HTTP_INFO;
  }
  logStructuredMess(
    "DEBUG",
    "HTTP INFO",
    getParsableReqBody({ httpInfo, requestedUrl }),
    SERVICE_NAME
  );
  // checking HTTP info against the map
  if (httpPermissionsMap.has(httpInfo)) {
    // checking the user's permissions
    try {
      const userCanQueryRes = await runPgQuery(
        `SELECT * FROM permissions p
            INNER JOIN permissions_users pu ON p.id = pu.permission_id
            INNER JOIN users u ON pu.user_id = u.id
            WHERE p.action = $1 
            AND p.resource = $2 
            AND pu.user_id = $3
            AND u.verified = true`,
        [
          httpPermissionsMap.get(httpInfo)!.action.toLowerCase(),
          httpPermissionsMap.get(httpInfo)!.resource.toLowerCase(),
          authedUser.id,
        ]
      );
      userCan = userCanQueryRes.rows.length > 0;
    } catch (error) {
      logStructuredMess(
        "ERROR",
        "ERROR WHILE CHECKING USER'S PERMISSIONS",
        getParsableReqBody({
          error,
          httpInfo,
          reqBody: req.body,
          requestedUrl,
        }),
        SERVICE_NAME
      );
    }
  }
  if (userCan) {
    next();
  } else {
    sendJsonResponse(res, 403, FORBIDDEN);
  }
};

export default checksUserCan;
