import { type NextApiRequest } from "next";
import { type GetServerSidePropsContext } from "next/types";

export function getToken(
  req: NextApiRequest | GetServerSidePropsContext["req"],
) {
  const authorization = req.headers.authorization?.split(" ");
  const authToken = authorization?.length === 2 && authorization[1];
  if (authToken && authorization[0] === "Bearer") return authToken;
  if (req.cookies.hanko) return req.cookies.hanko;
  return null;
}
