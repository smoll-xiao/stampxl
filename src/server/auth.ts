import { type NextApiRequest } from "next";

export function getToken(req: NextApiRequest) {
  const authorization = req.headers.authorization?.split(" ");
  const authToken = authorization?.length === 2 && authorization[1];
  if (authToken && authorization[0] === "Bearer") return authToken;
  if (req.cookies.hanko) return req.cookies.hanko;
  return null;
}
