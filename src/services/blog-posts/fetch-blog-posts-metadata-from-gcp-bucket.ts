import { BlogPostMetaDto } from "pips_shared/dist/dtos";
import { BlogPostStatusType } from "pips_shared/dist/types";
import extractPostDataFromRawPost from "./extract-post-data-from-raw-post";
import getBlogPostStatusStr from "./get-blog-post-status-str";
import getGcpDownloadedPostStr from "./get-gcp-dowloaded-post-str";
import getGCPStorageClient from "./get-gcp-storage-client";
import getPostsMetaSortedByDate from "./get-posts-meta-sorted-by-date";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";
import { SERVICE_NAME } from "../../constants";

const fetchBlogPostsMetadataFromGCPBucket = async (
  status: BlogPostStatusType
): Promise<BlogPostMetaDto[]> => {
  const storage = getGCPStorageClient();
  try {
    const bucketName = process.env.BLOG_POSTS_BUCKET as string;
    let [postsFiles] = await storage.bucket(bucketName).getFiles();
    postsFiles = postsFiles.filter(
      (post) =>
        post.name.startsWith(getBlogPostStatusStr(status)) &&
        post.name.endsWith(".md")
    );
    const postsMeta: BlogPostMetaDto[] = [];
    for (let i = 0; i < postsFiles.length; i++) {
      const downloadedPost = await getGcpDownloadedPostStr(
        storage,
        bucketName,
        postsFiles[i].name
      );
      try {
        const postRaw = extractPostDataFromRawPost(downloadedPost);
        const postMeta: BlogPostMetaDto = {
          date: postRaw.date,
          slug: postRaw.slug,
          status: postsFiles[i].name.startsWith("published")
            ? "published"
            : "draft",
          title: postRaw.title,
        };
        postsMeta.push(postMeta);
      } catch (error) {
        logStructuredMess(
          "ERROR",
          "FAILED TO EXTRACT POST DATA",
          getParsableReqBody({
            downloadedPost,
            error,
          }),
          SERVICE_NAME
        );
      }
    }
    return getPostsMetaSortedByDate(postsMeta as BlogPostMetaDto[]);
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "fetchBlogPostsMetadataFromGCPBucket ERROR",
      getParsableReqBody({
        error,
        status,
      }),
      SERVICE_NAME
    );
    return [];
  }
};

export default fetchBlogPostsMetadataFromGCPBucket;
