import dynamic from "next/dynamic";
import { Suspense } from "react";

export default function LoginPage() {
  const HankoAuth = dynamic(
    () => import("@tatak-badges/components/auth/HankoAuth"),
    { ssr: false },
  );
  return (
    <Suspense fallback={"Loading ..."}>
      <HankoAuth />
    </Suspense>
  );
}
