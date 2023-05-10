import { Storage } from "@google-cloud/storage";

/**
 * uploads a blog post to the relevant GCP bucket, whether it's a draft or a published post
 *
 * @param {string} fileName the name of the file to upload to GCP, prefixed by the folder name ("published") and suffixed with the file extension (".md")
 */
const uploadPostToGCP = async (fileName: string): Promise<void> => {
  const storage = new Storage();
  await storage
    .bucket(process.env.BLOG_POSTS_BUCKET as string)
    .upload(`tmp/blog/${fileName}`, {
      destination: fileName,
    });
};

export default uploadPostToGCP;
