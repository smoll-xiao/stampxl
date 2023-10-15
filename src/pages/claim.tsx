import { usePathname, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@tatak-badges/components/ui/Card";
import { Input } from "@tatak-badges/components/ui/Input";
import { Button } from "@tatak-badges/components/ui/Button";
import { api } from "@tatak-badges/utils/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Claim() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const claimBadgeMutation = api.badge.claimBadge.useMutation({
    onSuccess: () => {
      void router.push(pathname);
      alert("Badge claimed!");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleClaimBadge = () => {
    claimBadgeMutation.mutate({ token });
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>Claim Badge</CardHeader>
        <CardContent>
          <Input
            placeholder="Enter token"
            value={token}
            onChange={(e) => {
              void router.push(`${pathname}?token=${e.target.value}`);
            }}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleClaimBadge}>Claim</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
