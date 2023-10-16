import { OK, z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "@tatak-badges/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";

export const badgeRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z
        .object({
          name: z.string(),
          description: z.string(),
          // TODO: consider uploading to S3 and receiving a URL instead of base64.
          svg: z.string(),
          limit: z.number(),
          tradeable: z.boolean(),
        })
        .refine((input) => {
          const svg = Buffer.from(input.svg, "base64").toString("utf-8");
          return svg.includes("<svg");
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

      const { id } = await db.badge.create({
        data: {
          creatorId: user.sub,
          name: input.name,
          description: input.description,
          svg: input.svg,
          limit: input.limit,
          tradeable: input.tradeable,
        },
      });

      return id;
    }),
  getAllCreated: publicProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    if (!user?.sub) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this operation.",
      });
    }

    const creatorRole = await db.userRole.findFirst({
      where: {
        userId: user.sub,
        role: {
          name: "creator",
        },
      },
    });

    if (!creatorRole) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be a creator to perform this operation.",
      });
    }

    return await db.badge.findMany({
      include: {
        _count: {
          select: {
            userBadges: true,
          },
        },
      },
      where: {
        creatorId: user.sub,
      },
    });
  }),
  disable: publicProcedure
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
          message: "You must be logged in to perform this operation.",
        });
      }

      const badge = await db.badge.findFirst({
        where: {
          id: input.id,
          creatorId: user.sub,
        },
      });

      if (!badge) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be a creator to perform this operation.",
        });
      }

      await db.badge.update({
        where: {
          id: input.id,
        },
        data: {
          active: false,
        },
      });

      return OK(null);
    }),
  generateClaimToken: publicProcedure
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
          message: "You must be logged in to perform this operation.",
        });
      }

      const badge = await db.badge.findFirst({
        where: {
          id: input.id,
          creatorId: user.sub,
        },
      });

      if (!badge) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "You must be the creator of the badge to perform this operation.",
        });
      }

      const claim = await db.claimToken.create({
        data: {
          token: uuidv4(),
          badgeId: input.id,
        },
      });

      return claim.token;
    }),
  claimBadge: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db, user } = ctx;

      if (!user?.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this operation.",
        });
      }

      const token = await db.claimToken.findFirst({
        where: {
          token: input.token,
        },
      });

      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid token.",
        });
      }

      const badge = await db.badge.findFirst({
        where: {
          id: token.badgeId,
          active: true,
          limit: {
            gt: await db.userBadge.count({
              where: {
                badgeId: token.badgeId,
              },
            }),
          },
        },
      });

      if (!badge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid token.",
        });
      }

      const alreadyClaimed = await db.userBadge.findFirst({
        where: {
          badgeId: token.badgeId,
          userId: user.sub,
        },
      });

      if (alreadyClaimed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already claimed this badge.",
        });
      }

      await db.userBadge.create({
        data: {
          badgeId: token.badgeId,
          userId: user.sub,
        },
      });

      return OK(null);
    }),
  delete: publicProcedure
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
          message: "You must be logged in to perform this operation.",
        });
      }

      const badge = await db.badge.findFirst({
        where: {
          id: input.id,
          creatorId: user.sub,
        },
      });

      if (!badge) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "You must be the creator of the badge to perform this operation.",
        });
      }

      await db.badge.delete({
        where: {
          id: input.id,
        },
      });

      return OK(null);
    }),
  getBadgesOwned: publicProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
          username: z.string().optional(),
        })
        .refine((input) => {
          return input.userId ?? input.username;
        }),
    )
    .query(async ({ input, ctx }) => {
      const { db, user } = ctx;

      if (!user?.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this operation.",
        });
      }

      return await db.userBadge.findMany({
        where: {
          OR: [
            {
              userId: input.userId,
            },
            {
              user: {
                username: input.username,
              },
            },
          ],
        },
        include: {
          badge: true,
        },
      });
    }),
  getBoard: publicProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    if (!user?.sub) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this operation.",
      });
    }

    const board = await db.board.findFirst({
      include: {
        boardBadge: {
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
        userId: user.sub,
      },
    });

    if (!board) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Board not found.",
      });
    }

    return board;
  }),
  saveBoard: publicProcedure
    .input(
      z
        .object({
          id: z.number(),
          userBadgeIds: z.array(z.number().optional()),
        })
        .transform((input) => {
          return {
            ...input,
            userBadgeIds: input.userBadgeIds
              .map((x, i) => ({ position: i, userBadgeId: x }))
              .filter((x) => x.userBadgeId !== undefined)
              // TODO: Fix the need for the bang operator here.
              .map((x) => ({ ...x, userBadgeId: x.userBadgeId! })),
          };
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db, user } = ctx;

      if (!user?.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this operation.",
        });
      }

      const board = await db.board.findFirst({
        where: {
          id: input.id,
          userId: user.sub,
        },
      });

      if (!board) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Board not found.",
        });
      }

      await db.boardBadge.deleteMany({
        where: {
          boardId: input.id,
        },
      });

      const ownedBadges = await db.userBadge.findMany({
        where: {
          id: {
            in: input.userBadgeIds.map((x) => x.userBadgeId),
          },
          userId: user.sub,
        },
      });

      const validUserBadgeIds = input.userBadgeIds.filter((badge) => {
        return ownedBadges.some(
          (ownedBadge) => ownedBadge.id === badge.userBadgeId,
        );
      });

      for (const { position, userBadgeId } of validUserBadgeIds) {
        await db.boardBadge.create({
          data: {
            boardId: input.id,
            position,
            userBadgeId,
          },
        });
      }

      return OK(null);
    }),
});
