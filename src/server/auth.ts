import { type inferAsyncReturnType } from "@trpc/server";
import type * as trpcNext from "@trpc/server/adapters/next";
import { type NextApiRequest } from "next";
import { decodeJwt } from "jose";

export function getToken(req: NextApiRequest) {
  const authorization = req.headers.authorization?.split(" ");
  const authToken = authorization?.length === 2 && authorization[1];
  if (authToken && authorization[0] === "Bearer") return authToken;
  if (req.cookies.hanko) return req.cookies.hanko;
  return null;
}
