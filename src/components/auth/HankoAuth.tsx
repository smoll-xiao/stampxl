import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/router";
import { register, type Hanko } from "@teamhanko/hanko-elements";
import { env } from "@stampxl/env.mjs";
import { api } from "@stampxl/utils/api";

const hankoApi = env.NEXT_PUBLIC_HANKO_API_URL;

export default function HankoAuth() {
  const router = useRouter();
  const createUserMutation = api.user.create.useMutation();

  const [hanko, setHanko] = useState<Hanko>();

  useEffect(() => {
    void import("@teamhanko/hanko-elements").then(({ Hanko }) =>
      setHanko(new Hanko(hankoApi)),
    );
  }, []);

  const redirectAfterLogin = useCallback(() => {
    void router.replace("/dashboard");
  }, [router]);

  useEffect(
    () =>
      hanko?.onAuthFlowCompleted(({ userID }) => {
        createUserMutation.mutate({ id: userID });
        redirectAfterLogin();
      }),
    [hanko, redirectAfterLogin, createUserMutation],
  );

  useEffect(() => {
    register(hankoApi).catch((error) => {
      // TODO: handle error
      console.log(error);
    });
  }, []);

  return <hanko-auth />;
}
