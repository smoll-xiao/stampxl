import { createNextApiHandler } from "@trpc/server/adapters/next";

import { env } from "@tatak-badges/env.mjs";
import { appRouter } from "@tatak-badges/server/api/root";
import { createTRPCContext } from "@tatak-badges/server/api/trpc";

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
          );
        }
      : undefined,
});
