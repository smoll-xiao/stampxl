import { badgeRouter } from "@tatak-badges/server/api/routers/badge";
import { createTRPCRouter } from "@tatak-badges/server/api/trpc";
import { userRouter } from "@tatak-badges/server/api/routers/user";
import { tradeRouter } from "@tatak-badges/server/api/routers/trade";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  badge: badgeRouter,
  user: userRouter,
  trade: tradeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
