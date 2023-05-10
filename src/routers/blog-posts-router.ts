import { body } from "express-validator";
import express from "express";

import * as blogPostsController from "../controllers/blog-posts-controller";
import checksUserCan from "../middlewares/checks-user-can";
import validatesJwtTokenMiddleware from "../middlewares/validates-jwt-token-middleware";
import validatesStatus from "../services/blog-posts/validatesStatus";

const blogPostsRouter = express.Router();

// DELETE /blog-posts/:slug
blogPostsRouter.delete(
  "/:slug",
  validatesJwtTokenMiddleware,
  checksUserCan,
  blogPostsController.deletePost
);
// GET /blog-posts/drafts
blogPostsRouter.get(
  "/drafts",
  validatesJwtTokenMiddleware,
  checksUserCan,
  blogPostsController.getDraftPosts
);
// GET /blog-posts/published
blogPostsRouter.get("/published", blogPostsController.getPublishedPosts);
blogPostsRouter.get(
  "/drafts/:slug",
  validatesJwtTokenMiddleware,
  checksUserCan,
  blogPostsController.getDraftPost
);
// GET /blog-posts/published/:slug
blogPostsRouter.get("/published/:slug", blogPostsController.getPublishedPost);
// POST /blog-posts
blogPostsRouter.post(
  "/",
  body("contents").isString().notEmpty({
    ignore_whitespace: true,
  }),
  body("initialStatus")
    .custom((value) => {
      return validatesStatus(value, true);
    })
    .optional(),
  body("slug").isString().notEmpty({
    ignore_whitespace: true,
  }),
  body("status").custom((value) => {
    return validatesStatus(value);
  }),
  validatesJwtTokenMiddleware,
  checksUserCan,
  blogPostsController.createPost
);

export default blogPostsRouter;
