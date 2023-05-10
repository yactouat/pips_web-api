import parseUserId from "pips_shared/dist/functions/parse-user-id";
import { Request } from "express";

const getUserIdFromParams = (
  req: Request<
    Record<string, any> | undefined,
    any,
    any,
    Record<string, any> | undefined,
    Record<string, any>
  >
): number | null => {
  const userId = req.params?.id ?? "";
  return parseUserId(userId);
};

export default getUserIdFromParams;
