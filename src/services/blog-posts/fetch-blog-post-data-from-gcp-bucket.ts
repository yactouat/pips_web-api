import { BlogPostDto } from "pips_shared/dist/dtos";
import { BlogPostStatusType } from "pips_shared/dist/types";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";

import extractPostDataFromRawPost from "./extract-post-data-from-raw-post";
import getBlogPostStatusStr from "./get-blog-post-status-str";
import getGcpDownloadedPostStr from "./get-gcp-dowloaded-post-str";
import getGCPStorageClient from "./get-gcp-storage-client";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";
import { SERVICE_NAME } from "../../constants";

const fetchBlogPostDataFromGCPBucket = async (
  slug: string,
  status: BlogPostStatusType
): Promise<BlogPostDto> => {
  logStructuredMess(
    "INFO",
    "FETCHING BLOG POST DATA FROM GCP BUCKET",
    getParsableReqBody({
      filePath: `${getBlogPostStatusStr(status)}/${slug}.md`,
      slug,
      status,
    }),
    SERVICE_NAME
  );
  try {
    const bucketName = process.env.BLOG_POSTS_BUCKET as string;
    const storage = getGCPStorageClient();
    const downloadedPostContents = await getGcpDownloadedPostStr(
      storage,
      bucketName,
      `${getBlogPostStatusStr(status)}/${slug}.md`
    );
    try {
      const postRawData = extractPostDataFromRawPost(
        downloadedPostContents,
        slug
      );
      return {
        ...postRawData,
        status,
      };
    } catch (error) {
      logStructuredMess(
        "ERROR",
        "post data is missing",
        getParsableReqBody({ downloadedPostContents, error, slug, status }),
        SERVICE_NAME
      );
      throw new Error();
    }
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "failed during GCP storage file retrieval process",
      getParsableReqBody({ error, slug, status }),
      SERVICE_NAME
    );
    throw new Error();
  }
};

export default fetchBlogPostDataFromGCPBucket;
