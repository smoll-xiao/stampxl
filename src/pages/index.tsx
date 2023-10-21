import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@stampxl/components/common/NavigationMenu";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@stampxl/components/common/Button";

export default function Home() {
  return (
    <div className="container flex h-screen max-w-[64rem] flex-col items-center justify-center gap-4">
      <Navbar />
      <h1 className="text-center text-6xl font-bold">
        Collect and trade pixel badges.
      </h1>
      <p className="text-center text-xl text-muted-foreground">
        Built your empire of pixel badges. Show off your collection that
        reflects your personality and achievements. Participate in events or trade with
        others to grow your inventory.
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/">Contribute</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <NavigationMenu className="fixed top-0 flex-[0] py-4">
      <NavigationMenuList>
        <NavigationMenuItem className="pr-4 text-lg font-bold">
          👑 Stampxl
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Documentation
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              GitHub
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem className="justify-self-end">
          <Link href="/dashboard" legacyBehavior passHref>
            <NavigationMenuLink
              className={clsx(navigationMenuTriggerStyle(), "gap-2")}
            >
              <LogIn className="h-4 w-4" /> Login
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
