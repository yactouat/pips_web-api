import { Storage } from "@google-cloud/storage";

/**
 * delete a blog post from the relevant GCP bucket, whether it's a draft or a published post
 *
 * https://cloud.google.com/storage/docs/deleting-objects#storage-delete-object-nodejs
 *
 * @param {string} fileName the name of the file to delete in the GCP, prefixed by the folder name ("published/) and suffixed by the file extension (".md")
 */
const deletePostFromGCP = async (fileName: string): Promise<void> => {
  const storage = new Storage();
  await storage
    .bucket(process.env.BLOG_POSTS_BUCKET as string)
    .file(fileName)
    .delete();
};

export default deletePostFromGCP;
