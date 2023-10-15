import { OK, z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "@tatak-badges/server/api/trpc";
import { NextApiRequest } from "next";
import { decodeJwt, jwtVerify } from "jose";
import { TRPCError } from "@trpc/server";

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

      const role = await db.role.findFirst({
        where: {
          name: "user",
        },
      });

      if (!role) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User role not found.",
        });
      }

      await db.user.create({
        data: {
          id: input.id,
        },
      });

      await db.userRole.create({
        data: {
          userId: input.id,
          roleId: role.id,
        },
      });

      return OK(null);
    }),
  roles: publicProcedure.query(async ({ ctx }) => {
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

    const roles = await db.role.findMany({
      select: {
        name: true,
      },
    });

    return roles.map((role) => role.name);
  }),
});
