import {
  createTRPCRouter,
  publicProcedure,
} from "@tatak-badges/server/api/trpc";
import { OK, z } from "zod";
import { TRPCError } from "@trpc/server";

export const tradeRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        to: z.string(),
        badgeIds: z.array(z.number()),
        requestedBadgeIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db, user } = ctx;

      if (!user?.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a badge.",
        });
      }

      const requestedUser = await db.user.findFirst({
        where: {
          username: input.to,
        },
      });

      if (!requestedUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "The user you are trading with does not exist.",
        });
      }

      const userBadge = await db.userBadge.findMany({
        where: {
          id: {
            in: input.badgeIds,
          },
          userId: user.sub,
        },
      });

      if (userBadge.length !== input.badgeIds.length) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must own the badges to trade it.",
        });
      }

      const requestedUserBadge = await db.userBadge.findMany({
        where: {
          id: {
            in: input.requestedBadgeIds,
          },
          user: {
            username: input.to,
          },
        },
      });

      if (requestedUserBadge.length !== input.requestedBadgeIds.length) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "The user you are trading with does not own the badges you are requesting.",
        });
      }

      const trade = await db.trade.create({
        data: {
          senderId: user.sub,
          receiverId: requestedUser.id,
        },
      });

      for (const badgeId of input.badgeIds) {
        await db.tradeItem.create({
          data: {
            tradeId: trade.id,
            userBadgeId: badgeId,
          },
        });
      }

      for (const badgeId of input.requestedBadgeIds) {
        await db.tradeItem.create({
          data: {
            tradeId: trade.id,
            userBadgeId: badgeId,
          },
        });
      }

      return trade;
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    if (!user?.sub) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to view trades.",
      });
    }

    return await db.trade.findMany({
      include: {
        sender: true,
        receiver: true,
        tradeItem: {
          include: {
            userBadge: {
              include: {
                badge: true,
              },
            },
          },
        },
      },
      where: {
        accepted: null,
        OR: [
          {
            senderId: user.sub,
          },
          {
            receiverId: user.sub,
          },
        ],
      },
    });
  }),
  reject: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db, user } = ctx;

      if (!user?.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to reject a trade.",
        });
      }

      const trade = await db.trade.findFirst({
        where: {
          id: input.id,
          receiverId: user.sub,
        },
      });

      if (!trade) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be the receiver of the trade to reject it.",
        });
      }

      await db.trade.update({
        where: {
          id: input.id,
        },
        data: {
          accepted: false,
        },
      });

      return OK(null);
    }),
  accept: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db, user } = ctx;

      if (!user?.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to accept a trade.",
        });
      }

      const trade = await db.trade.findFirst({
        include: {
          tradeItem: {
            include: {
              userBadge: true,
            },
          },
        },
        where: {
          id: input.id,
          receiverId: user.sub,
        },
      });

      if (!trade) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be the receiver of the trade to accept it.",
        });
      }

      await db.trade.update({
        where: {
          id: input.id,
        },
        data: {
          accepted: true,
        },
      });

      const badges = await db.userBadge.findMany({
        where: {
          id: {
            in: trade.tradeItem.map((tradeItem) => tradeItem.userBadgeId),
          },
        },
      });

      for (const badge of badges) {
        await db.userBadge.update({
          where: {
            id: badge.id,
          },
          data: {
            userId:
              badge.userId === trade.senderId
                ? trade.receiverId
                : trade.senderId,
          },
        });
      }

      await db.boardBadge.deleteMany({
        where: {
          userBadgeId: {
            in: trade.tradeItem.map((tradeItem) => tradeItem.userBadgeId),
          },
        },
      });

      return OK(null);
    }),
  cancel: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db, user } = ctx;

      if (!user?.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to accept a trade.",
        });
      }

      const trade = await db.trade.findFirst({
        where: {
          id: input.id,
          senderId: user.sub,
        },
      });

      if (!trade) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be the sender of the trade to cancel it.",
        });
      }

      await db.tradeItem.deleteMany({
        where: {
          tradeId: trade.id,
        },
      });

      await db.trade.delete({
        where: {
          id: trade.id,
        },
      });

      return OK(null);
    }),
});
