import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { type Hanko } from "@teamhanko/hanko-elements";
import { Button } from "@stampxl/components/common/Button";
import { env } from "@stampxl/env.mjs";
import { LogOut } from "lucide-react";

const hankoApi = env.NEXT_PUBLIC_HANKO_API_URL;

export default function LogoutButton() {
  const router = useRouter();
  const [hanko, setHanko] = useState<Hanko>();

  useEffect(() => {
    void import("@teamhanko/hanko-elements").then(({ Hanko }) =>
      setHanko(new Hanko(hankoApi ?? "")),
    );
  }, []);

  const handleClick = async () => {
    try {
      await hanko?.user.logout();
      await router.push("/");
      return;
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <Button onClick={() => void handleClick()} variant="ghost" className="p-2">
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
