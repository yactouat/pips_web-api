import fs from "fs";
import getParsableReqBody from "pips_shared/dist/functions/get-parsable-req-body";
import logStructuredMess from "pips_shared/dist/functions/log-structured-mess";
import path from "path";

import BlogPostRawDataInterface from "./BlogPostRawDataInterface";
import extractPostDataFromRawPost from "./extract-post-data-from-raw-post";
import { SERVICE_NAME } from "../../constants";

const fetchBlogPostDataFromFileSystem = (
  slug: string,
  postsDir: string
): BlogPostRawDataInterface => {
  const postFileFullPath = path.join(postsDir, `${slug}.md`);
  const fileContents = fs.readFileSync(postFileFullPath, "utf8");
  try {
    return extractPostDataFromRawPost(fileContents, slug);
  } catch (error) {
    logStructuredMess(
      "ERROR",
      "post data is missing",
      getParsableReqBody({
        error,
        fileContents,
        slug,
      }),
      SERVICE_NAME
    );
    throw new Error();
  }
};

export default fetchBlogPostDataFromFileSystem;
