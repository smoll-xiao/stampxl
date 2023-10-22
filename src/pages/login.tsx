import dynamic from "next/dynamic";
import { Suspense } from "react";

export default function LoginPage() {
  const HankoAuth = dynamic(
    () => import("@stampxl/components/auth/HankoAuth"),
    { ssr: false },
  );
  return (
    <Suspense fallback={"Loading ..."}>
      <div className="flex items-center">
        <HankoAuth />
      </div>
    </Suspense>
  );
}
