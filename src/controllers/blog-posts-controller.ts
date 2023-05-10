import { BlogPostDto } from "pips_shared/dist/dtos";
import fs from "fs";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import path from "path";
import { Request, Response } from "express";
import sendJsonResponse from "pips_shared/dist/functions/send-json-response";

import {
  BLOG_POST_CREATION_FAILED,
  BLOG_POST_DELETION_FAILED,
  BLOG_POST_TO_DELETE_NOT_FOUND,
} from "../constants";
import deletePostFromGCP from "../services/blog-posts/delete-post-from-gcp";
import fetchBlogPostDataFromGCPBucket from "../services/blog-posts/fetch-blog-post-data-from-gcp-bucket";
import fetchBlogPostsMetadataFromGCPBucket from "../services/blog-posts/fetch-blog-posts-metadata-from-gcp-bucket";
import { SERVICE_NAME } from "../constants";
import uploadPostToGCP from "../services/blog-posts/upload-post-to-gcp";

export const createPost = async (req: Request, res: Response) => {
  // save blog post with its prefix (`drafts/` or `published/`) in tmp folder, prefixed by `blog/`
  const postFileName = `${
    req.body.status == "draft" ? "drafts/" : "published/"
  }${req.body.slug}.md`;
  try {
    // create subdirectories if they don't exist
    const dirname = path.dirname(`tmp/blog/${postFileName}`);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    fs.writeFileSync(`tmp/blog/${postFileName}`, req.body.contents, {
      flag: "w+",
    });
    // call to upload post to GCP bucket
    await uploadPostToGCP(postFileName);
    logStructuredMess(
      "DEBUG",
      "created/updated post status",
      getParsableReqBody({
        initialStatus: req.body.initialStatus,
        status: req.body.status,
      }),
      SERVICE_NAME
    );
    if (
      req.body.initialStatus != null &&
      req.body.initialStatus != req.body.status
    ) {
      logStructuredMess(
        "WARNING",
        "deleting post",
        `${req.body.initialStatus == "draft" ? "drafts/" : "published/"}${
          req.body.slug
        }.md`,
        SERVICE_NAME
      );
      await deletePostFromGCP(
        `${req.body.initialStatus == "draft" ? "drafts/" : "published/"}${
          req.body.slug
        }.md`
      );
    }
    //send back response, with a delay to allow GCP to update the bucket
    setTimeout(async () => {
      try {
        const blogPostdata = await fetchBlogPostDataFromGCPBucket(
          `${req.body.slug as string}`,
          req.body.status
        );
        sendJsonResponse(
          res,
          201,
          `${req.body.slug} blog post uploaded`,
          blogPostdata
        );
      } catch (error) {
        sendJsonResponse(res, 500, BLOG_POST_CREATION_FAILED);
      }
    }, 2000);
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "error creating/updating post",
      getParsableReqBody({
        error,
        reqBody: req.body,
      }),
      SERVICE_NAME
    );
    sendJsonResponse(res, 500, BLOG_POST_CREATION_FAILED);
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const slug = req.params.slug;
  let draftPost: BlogPostDto | null = null;
  let publishedPost: BlogPostDto | null = null;
  try {
    draftPost = await fetchBlogPostDataFromGCPBucket(slug, "draft");
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "no draft version of this post to be deleted",
      null,
      SERVICE_NAME
    );
  }
  try {
    publishedPost = await fetchBlogPostDataFromGCPBucket(slug, "published");
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "no published version of this post to be deleted",
      null,
      SERVICE_NAME
    );
  }
  if (!draftPost && !publishedPost) {
    sendJsonResponse(res, 404, `${slug} ${BLOG_POST_TO_DELETE_NOT_FOUND}`);
    return;
  }
  // delete post(s)
  if (draftPost) {
    try {
      await deletePostFromGCP(`drafts/${slug}.md`);
    } catch (error) {
      logStructuredMess(
        "ERROR",
        "draft post deletion failed",
        getParsableReqBody({
          error,
          reqBody: req.body,
        }),
        SERVICE_NAME
      );
      sendJsonResponse(res, 500, `${slug} ${BLOG_POST_DELETION_FAILED}`);
    }
  }
  if (publishedPost) {
    try {
      await deletePostFromGCP(`published/${slug}.md`);
    } catch (error) {
      logStructuredMess(
        "ERROR",
        "published post deletion failed",
        getParsableReqBody({
          error,
          reqBody: req.body,
        }),
        SERVICE_NAME
      );
      sendJsonResponse(res, 500, `${slug} ${BLOG_POST_DELETION_FAILED}`);
    }
  }
  // send back response
  res.status(204).send("");
};

export const getDraftPosts = async (req: Request, res: Response) => {
  const blogPostsMetadata = await fetchBlogPostsMetadataFromGCPBucket("draft");
  sendJsonResponse(
    res,
    200,
    `${blogPostsMetadata.length} blog posts fetched`,
    blogPostsMetadata
  );
};

export const getPublishedPosts = async (req: Request, res: Response) => {
  const blogPostsMetadata = await fetchBlogPostsMetadataFromGCPBucket(
    "published"
  );
  sendJsonResponse(
    res,
    200,
    `${blogPostsMetadata.length} blog posts fetched`,
    blogPostsMetadata
  );
};

export const getDraftPost = async (req: Request, res: Response) => {
  const slug = req.params.slug;
  try {
    const blogPostdata = await fetchBlogPostDataFromGCPBucket(slug, "draft");
    sendJsonResponse(res, 200, `${slug} blog post data fetched`, blogPostdata);
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "unable to fetch draft post data",
      getParsableReqBody({
        error,
        reqBody: req.body,
      }),
      SERVICE_NAME
    );
    sendJsonResponse(res, 404, `${slug} blog post data not found`);
  }
};

export const getPublishedPost = async (req: Request, res: Response) => {
  const slug = req.params.slug;
  try {
    const blogPostdata = await fetchBlogPostDataFromGCPBucket(
      slug,
      "published"
    );
    sendJsonResponse(res, 200, `${slug} blog post data fetched`, blogPostdata);
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "unable to fetch published post data",
      getParsableReqBody({
        error,
        reqBody: req.body,
      }),
      SERVICE_NAME
    );
    sendJsonResponse(res, 404, `${slug} blog post data not found`);
  }
};
