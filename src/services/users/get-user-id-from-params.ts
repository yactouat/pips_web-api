import { Request } from "express";

const parseUserId = (userId: string | number | null): number | null => {
  if (/^\d+$/.test(userId as string)) {
    return parseInt(userId as string);
  }
  return null;
};


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
