import { BlogPostStatusType } from "pips_shared/dist/types";

const getBlogPostStatusStr = (
  status: BlogPostStatusType
): "drafts" | "published" => {
  return status === "draft" ? "drafts" : "published";
};

export default getBlogPostStatusStr;
