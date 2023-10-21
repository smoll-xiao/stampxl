import { OK, z } from "zod";

import { createTRPCRouter, publicProcedure } from "@stampxl/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";

export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;

      const existingUser = await db.user.findFirst({
        where: {
          id: input.id,
        },
      });

      if (existingUser) return OK(null);

      await db.user.create({
        data: {
          username: `newbie-${input.id}`,
          id: input.id,
          roles: [Role.USER],
        },
      });

      await db.board.create({
        data: {
          userId: input.id,
        },
      });

      return OK(null);
    }),
  me: publicProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    if (!user?.sub) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this operation.",
      });
    }

    const dbUser = await db.user.findFirst({
      where: {
        id: user.sub,
      },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "User not found.",
      });
    }

    return dbUser;
  }),
  updateUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
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

      const existingUser = await db.user.findFirst({
        where: {
          username: input.username,
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Username already exists.",
        });
      }

      await db.user.update({
        where: {
          id: user.sub,
        },
        data: {
          username: input.username,
        },
      });

      return OK(null);
    }),
  getAllUsernames: publicProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;

    const users = await db.user.findMany({
      select: {
        username: true,
      },
      where: {
        id: {
          not: user?.sub,
        },
      },
    });

    return users.map((user) => user.username);
  }),
});
