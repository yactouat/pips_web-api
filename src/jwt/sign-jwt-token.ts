import jwt from "jsonwebtoken";

interface UserTokenPayload {
  email: string;
  id: number;
}

const signJwtToken = async (payload: UserTokenPayload): Promise<string> => {
  const token = await jwt.sign(
    { email: payload.email, id: payload.id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "56h", // one week
    }
  );
  return token;
};

export default signJwtToken;
