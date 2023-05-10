import { BlogPostStatusType } from "pips_shared/dist/types";

const validatesStatus = (
  status: string,
  allowEmpty: boolean = false
): status is BlogPostStatusType => {
  const allowedStatuses = ["published", "draft"];
  if (allowEmpty) {
    allowedStatuses.push("");
  }
  return allowedStatuses.includes(status);
};

export default validatesStatus;
