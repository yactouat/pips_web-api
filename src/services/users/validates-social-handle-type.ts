import { SocialHandleType } from "pips_shared/dist/types";

const validatesSocialHandleType = (
  socialHandleType: SocialHandleType
): socialHandleType is SocialHandleType => {
  return ["GitHub", "LinkedIn"].includes(socialHandleType);
};

export default validatesSocialHandleType;
