import { Button } from "@tatak-badges/components/common/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tatak-badges/components/common/Dialog";
import { Label } from "@tatak-badges/components/common/Label";
import { Input } from "@tatak-badges/components/common/Input";
import { Switch } from "@tatak-badges/components/common/Switch";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { api, type RouterOutputs } from "@tatak-badges/utils/api";
import { Card } from "@tatak-badges/components/common/Card";
import Chip from "@tatak-badges/components/common/Chip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tatak-badges/components/common/DropdownMenu";
import { MoreVertical, Sparkles, User, Trash } from "lucide-react";
import { clsx } from "clsx";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tatak-badges/components/common/Popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@tatak-badges/components/common/Command";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import LogoutButton from "@tatak-badges/components/auth/LogoutButton";

export default function Dashboard() {
  const rolesQuery = api.user.roles.useQuery();
  const roles = rolesQuery.data ?? [];
  const hasCreatorRole = roles.includes("creator");
  return (
    <div className="flex w-full flex-col gap-10">
      <div className="flex items-center justify-between gap-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <TradeBadgeDialog />
          {hasCreatorRole && <CreateBadgeDialog />}
          <LogoutButton />
        </div>
      </div>
      {hasCreatorRole && <CreatedBadgeList />}
      <BadgeBoard />
      <TradeList />
    </div>
  );
}

function TradeList() {
  const allTradesQuery = api.trade.getAll.useQuery();
  const allTrades = allTradesQuery.data ?? [];
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">Trades</h2>
      <div className="flex flex-col gap-2">
        {allTrades.length === 0 && (
          <div>
            You have no pending trade requests/offer. Click the &quot;Trade
            Badge&quot; to create one.
          </div>
        )}
        {allTrades.map((trade) => (
          <TradeCard key={trade.id} trade={trade} />
        ))}
      </div>
    </div>
  );
}

type Trade = RouterOutputs["trade"]["getAll"][0];

function TradeCard({ trade }: { trade: Trade }) {
  const utils = api.useContext();

  const meQuery = api.user.me.useQuery();
  const user = meQuery.data;

  const acceptTradeMutation = api.trade.accept.useMutation({
    onSuccess: () => {
      void utils.trade.getAll.invalidate();
      alert("Trade accepted!");
    },
  });

  const rejectTradeMutation = api.trade.reject.useMutation({
    onSuccess: () => {
      void utils.trade.getAll.invalidate();
      alert("Trade rejected!");
    },
  });

  const cancelTradeMutation = api.trade.cancel.useMutation({
    onSuccess: () => {
      void utils.trade.getAll.invalidate();
      alert("Trade cancelled!");
    },
  });

  const badges: { sender: UserBadge[]; receiver: UserBadge[] } = {
    sender: [],
    receiver: [],
  };

  trade.tradeItem?.forEach(({ userBadge }) => {
    badges[userBadge.userId === trade.senderId ? "sender" : "receiver"].push(
      userBadge,
    );
  });

  return (
    <Card className="flex flex-col gap-2 p-2">
      <div className="flex flex-col gap-6 p-2">
        <div className="flex items-start gap-2">
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold">From</span>
              <span className="text-sm">{trade.sender.username}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.sender.length === 0 && "Nothing to trade"}
              {badges.sender.map((userBadge) => (
                <BadgeCard
                  className="bg-gray-800"
                  userBadge={userBadge}
                  key={userBadge.id}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold">To</span>
                <span className="text-sm">{trade.receiver.username}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {badges.receiver.length === 0 && "Nothing to trade"}
                {badges.receiver.map((userBadge) => (
                  <BadgeCard
                    className="bg-gray-800"
                    userBadge={userBadge}
                    key={userBadge.id}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-gray-400">
            {new Date(trade.createdAt).toLocaleString()}
          </span>
          {user && user.id === trade.receiverId && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                onClick={() => {
                  void acceptTradeMutation.mutate({ id: trade.id });
                }}
              >
                Accept
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void rejectTradeMutation.mutate({ id: trade.id });
                }}
              >
                Reject
              </Button>
            </div>
          )}
          {user && user?.id === trade.senderId && (
            <Button
              variant="outline"
              onClick={() => {
                void cancelTradeMutation.mutate({ id: trade.id });
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function BadgeBoard() {
  const [activeGrid, setActiveGrid] = useState<number>();
  const [triggerDownload, setTriggerDownload] = useState(false);
  const [board, setBoard] = useState<Array<UserBadge | undefined>>(
    Array.from({ length: 12 * 3 }),
  );

  const boardRef = useRef<HTMLDivElement>(null);

  const meQuery = api.user.me.useQuery();
  const user = meQuery.data;

  const boardQuery = api.badge.getBoard.useQuery();
  const boardData = boardQuery.data;

  const getBadgesOwnedQuery = api.badge.getBadgesOwned.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user },
  );
  const userBadges = getBadgesOwnedQuery.data ?? [];

  const saveBoardMutation = api.badge.saveBoard.useMutation({
    onSuccess: () => {
      alert("Board saved!");
    },
  });

  const handleBadgeClick = (userBadge: UserBadge) => {
    if (activeGrid === undefined) return;
    setBoard((prev) =>
      prev.map((item, idx) => {
        if (idx === activeGrid) return userBadge;
        if (item?.id === userBadge.id) return undefined;
        return item;
      }),
    );
  };

  const handleSave = () => {
    setTriggerDownload(true);
  };

  const downloadBoard = async () => {
    if (!boardRef.current) return;
    const boardAsPNG = await toPng(boardRef.current);
    saveAs(boardAsPNG, "badge-board.png");
  };

  useEffect(() => {
    const newBoard: Array<UserBadge | undefined> = Array.from({
      length: 12 * 3,
    });

    boardData?.boardBadge.forEach(({ position, userBadge }) => {
      newBoard[position] = userBadge;
    });

    setBoard(newBoard);
  }, [boardData]);

  useEffect(() => {
    if (!triggerDownload) return;

    if (activeGrid) {
      setActiveGrid(undefined);
      return;
    }

    if (!boardData) {
      alert("Error loading board!");
      return;
    } else {
      void downloadBoard();
      saveBoardMutation.mutate({
        id: boardData.id,
        userBadgeIds: board.map((b) => b?.id),
      });
    }
    setTriggerDownload(false);
  }, [saveBoardMutation, board, boardData, triggerDownload, activeGrid]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">
          {user?.username ?? "Unknown"}&apos;s board
        </h2>
        <div className="flex items-center gap-2">
          {user && <EditUsernameDialog user={user} />}
          <Button onClick={() => void handleSave()}>Save</Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 ">
        <div
          className="relative grid grid-cols-12 border-2 bg-background"
          ref={boardRef}
        >
          {board.map((userBadge, i) => {
            const svgXML = userBadge ? atob(userBadge.badge.svg) : "";
            const svgElement = svgXML.substring(svgXML.indexOf("<svg"));
            return (
              <div
                key={i}
                className={clsx(
                  "svg-preview-container aspect-square cursor-pointer hover:bg-gray-800",
                  {
                    "border-2 border-dashed border-gray-400":
                      !triggerDownload && activeGrid === i,
                  },
                )}
                onClick={() => setActiveGrid(i)}
                dangerouslySetInnerHTML={
                  userBadge ? { __html: svgElement } : undefined
                }
              />
            );
          })}
          <div className="absolute bottom-2 right-2 rounded-lg bg-gray-800 px-2 py-1 opacity-80">
            {user?.username ?? "Unknown"}
          </div>
        </div>
        <BadgeInventory
          userBadges={userBadges}
          onBadgeClick={handleBadgeClick}
        />
      </div>
    </div>
  );
}

function BadgeInventory({
  userBadges,
  onBadgeClick,
}: {
  userBadges: UserBadge[];
  onBadgeClick: (userBadge: UserBadge) => void;
}) {
  const hasBadges = userBadges.length > 0;
  return (
    <div className="flex flex-col gap-2">
      <h5 className="text-md font-bold">Inventory</h5>
      <div className="flex flex-wrap gap-2">
        {!hasBadges && (
          <div className="col-span-3">You do not own any badge.</div>
        )}
        {userBadges.map((userBadge) => (
          <BadgeCard
            userBadge={userBadge}
            key={userBadge.id}
            onClick={onBadgeClick}
          />
        ))}
      </div>
    </div>
  );
}

function CreatedBadgeList() {
  const getAllCreatedBadgesQuery = api.badge.getAllCreated.useQuery();
  const createdBadges = getAllCreatedBadgesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">Creation</h2>
      {createdBadges.length === 0 ? (
        <div className="col-span-3 text-sm">
          You have not created any badges yet. Click the &quot;Create
          Badge&quot; button to get started.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {createdBadges.map((badge) => (
            <CreatedBadgeListItem badge={badge} key={badge.id} />
          ))}
        </div>
      )}
    </div>
  );
}

type BadgeCreated = RouterOutputs["badge"]["getAllCreated"][0];
type UserBadge = RouterOutputs["badge"]["getBadgesOwned"][0];

function CreatedBadgeListItem({ badge }: { badge: BadgeCreated }) {
  const svgXML = atob(badge.svg);
  const svgElement = svgXML.substring(svgXML.indexOf("<svg"));

  return (
    <Card className="flex items-center gap-1 p-2">
      <div
        className="svg-preview-container h-16 w-16"
        dangerouslySetInnerHTML={{ __html: svgElement }}
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h6 className="text-lg font-bold">{badge.name}</h6>
          <Chip>
            {badge._count.userBadges}/{badge.limit} claims
          </Chip>
          {badge.tradeable && <Chip>Tradeable</Chip>}
        </div>
        <p>{badge.description}</p>
      </div>
      <CreatedBadgeActions badge={badge} />
    </Card>
  );
}

function BadgeCard({
  className = "",
  userBadge,
  onClick,
}: {
  className?: string;
  userBadge: UserBadge;
  onClick?: (badge: UserBadge) => void;
}) {
  const svgXML = atob(userBadge.badge.svg);
  const svgElement = svgXML.substring(svgXML.indexOf("<svg"));

  return (
    <Card
      className={`${className} svg-preview-container h-16 w-16 cursor-pointer p-2`}
      dangerouslySetInnerHTML={{ __html: svgElement }}
      onClick={() => onClick?.(userBadge)}
    />
  );
}

function CreatedBadgeActions({ badge }: { badge: BadgeCreated }) {
  const disableClaimMutation = api.badge.disable.useMutation();
  const deleteMutation = api.badge.delete.useMutation();
  const generateClaimTokenMutation = api.badge.generateClaimToken.useMutation({
    onSuccess: (token) => {
      const claimURL = `${window.location.origin}/claim?token=${token}`;
      void navigator.clipboard.writeText(claimURL);
      alert("Claim link copied to clipboard!");
    },
  });

  const handleDistribute = () => {
    generateClaimTokenMutation.mutate({ id: badge.id });
  };

  const handleDisableClaim = () => {
    disableClaimMutation.mutate({ id: badge.id });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: badge.id });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MoreVertical className="h-8 w-8 cursor-pointer p-1" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="48">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleDistribute}
            disabled={badge._count.userBadges >= badge.limit}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Distribute</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={badge.active}
            onClick={handleDisableClaim}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Disable Claim</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={badge._count.userBadges > 0}
            onClick={handleDelete}
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type CreateBadgeFormValues = {
  name: string;
  description: string;
  svg: string;
  limit: number;
  tradeable: boolean;
};

const defaultCreateBadgeFormValues: CreateBadgeFormValues = {
  name: "",
  description: "",
  svg: "",
  limit: 100,
  tradeable: false,
};

function CreateBadgeDialog() {
  const utils = api.useContext();

  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<CreateBadgeFormValues>(
    defaultCreateBadgeFormValues,
  );

  const createBadgeMutation = api.badge.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      void utils.badge.getAllCreated.invalidate();
    },
    onError: () => alert("Something went wrong, please try again later."),
  });

  const handleSVGFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const content = await file?.text();
    const b64Encoded = btoa(content ?? "");
    setFormValues((prev) => ({ ...prev, svg: b64Encoded }));
  };

  const handleSubmit = () => createBadgeMutation.mutate(formValues);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Badge</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Badge</DialogTitle>
          <DialogDescription>
            Create a new badge that to share with others, consumes 0 credit(s).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              placeholder="Badge Name"
              className="col-span-3"
              value={formValues.name}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              placeholder="Enter description"
              className="col-span-3"
              value={formValues.description}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="SVG File" className="text-right">
              SVG File
            </Label>
            <Input
              id="svg"
              type="file"
              accept="image/svg+xml"
              className="col-span-3"
              onChange={(e) => {
                void handleSVGFileChange(e);
              }}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="limit" className="text-right">
              Claim Limit
            </Label>
            <Input
              id="limit"
              type="number"
              placeholder="Enter claim limit"
              value={formValues.limit}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  limit: +e.target.value,
                }))
              }
            />
            <Label htmlFor="tradeable" className="text-right">
              Tradeable
            </Label>
            <Switch
              id="tradeable"
              checked={formValues.tradeable}
              onCheckedChange={(checked) => {
                setFormValues((prev) => ({ ...prev, tradeable: checked }));
              }}
            />
          </div>
          <div className="rounded bg-gray-800 p-2 text-sm">
            Badges with at least 1 claim becomes permanent and cannot be
            modified nor removed.
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type User = RouterOutputs["user"]["me"];

function EditUsernameDialog({ user }: { user: User }) {
  const utils = api.useContext();

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");

  const updateUsernameMutation = api.user.updateUsername.useMutation({
    onSuccess: () => {
      setOpen(false);
      void utils.user.me.invalidate();
    },
    onError: () => alert("Something went wrong, please try again later."),
  });

  const handleSubmit = () => updateUsernameMutation.mutate({ username });

  useEffect(() => {
    setUsername(user.username);
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Edit username</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit username</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="Username" className="text-right">
              Username
            </Label>
            <Input
              id="Username"
              className="col-span-3"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TradeBadgeDialog() {
  const util = api.useContext();

  const [open, setOpen] = useState(false);
  const [targetUsername, setTargetUsername] = useState<string>("");

  const [selectedBadges, setSelectedBadges] = useState<
    Record<number, UserBadge>
  >({});

  const [selectedTargetBadges, setSelectedTargetBadges] = useState<
    Record<number, UserBadge>
  >({});

  const createTradeMutation = api.trade.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      void util.trade.getAll.invalidate();
    },
    onError: () => alert("Something went wrong, please try again later."),
  });

  const meQuery = api.user.me.useQuery();
  const user = meQuery.data;

  const currentUserBadges = api.badge.getBadgesOwned.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user },
  );

  const targetUserBadges = api.badge.getBadgesOwned.useQuery(
    { username: targetUsername },
    { enabled: !!targetUsername },
  );

  const targetUserBadgesLength = targetUserBadges.data?.length ?? 0;

  const handleCurrentBadgeClick = (userBadge: UserBadge) => {
    if (selectedBadges[userBadge.id]) {
      setSelectedBadges((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [userBadge.id]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setSelectedBadges((prev) => ({ ...prev, [userBadge.id]: userBadge }));
    }
  };

  const handleTargetBadgeClick = (userBadge: UserBadge) => {
    if (selectedTargetBadges[userBadge.id]) {
      setSelectedTargetBadges((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [userBadge.id]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setSelectedTargetBadges((prev) => ({
        ...prev,
        [userBadge.id]: userBadge,
      }));
    }
  };

  const handleSubmit = () => {
    createTradeMutation.mutate({
      to: targetUsername,
      badgeIds: Object.keys(selectedBadges).map(Number),
      requestedBadgeIds: Object.keys(selectedTargetBadges).map(Number),
    });
  };

  useEffect(() => {
    setSelectedTargetBadges({});
  }, [targetUsername]);

  useEffect(() => {
    if (open) return;
    setSelectedTargetBadges({});
    setSelectedBadges({});
    setTargetUsername("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Trade Badges</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Create new trade</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-end gap-2">
            <Label htmlFor="Username" className="text-right">
              Trade with
            </Label>
            <UsernameCombobox
              className="w-[200px]"
              onChange={setTargetUsername}
            />
          </div>
          <div className="flex items-stretch gap-6">
            <div className="flex flex-1 flex-col gap-2">
              <h6>You send</h6>
              <div className="flex flex-wrap gap-2 rounded-md border p-2">
                {currentUserBadges.data?.map((userBadge) => (
                  <BadgeCard
                    className={
                      selectedBadges[userBadge.id] ? "bg-gray-800" : ""
                    }
                    userBadge={userBadge}
                    key={userBadge.id}
                    onClick={handleCurrentBadgeClick}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <h6>You receive</h6>
              {!targetUsername && (
                <div className="flex flex-1 items-center justify-center">
                  <span className="text-sm text-gray-400">
                    Select a user to trade with
                  </span>
                </div>
              )}
              {targetUsername &&
                (targetUserBadgesLength > 0 ? (
                  <div className="flex flex-wrap gap-2 rounded-md border p-2">
                    {targetUserBadges.data?.map((userBadge) => (
                      <BadgeCard
                        className={
                          selectedTargetBadges[userBadge.id]
                            ? "bg-gray-800"
                            : ""
                        }
                        userBadge={userBadge}
                        key={userBadge.id}
                        onClick={handleTargetBadgeClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <span className="text-sm text-gray-400">
                      {targetUserBadges.isLoading
                        ? "Loading..."
                        : "No badges found"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
          <div className="flex flex-1"></div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Send Trade Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsernameCombobox({
  className = "",
  onChange,
}: {
  className?: string;
  onChange: (username: string) => unknown;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const getAllUsernameQuery = api.user.getAllUsernames.useQuery();
  const usernames = getAllUsernameQuery.data ?? [];

  const handleSelect = (username: string) => {
    setValue(username);
    setOpen(false);
    onChange(username);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`${className} justify-between`}
        >
          {value
            ? usernames.find((username) => username === value)
            : "Select username"}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search username" className="h-9" />
          <CommandEmpty>No framework found.</CommandEmpty>
          <CommandGroup>
            {usernames.map((username) => (
              <CommandItem
                key={username}
                onSelect={(currentValue) => {
                  handleSelect(currentValue === value ? "" : currentValue);
                }}
              >
                {username}
                <CheckIcon
                  className={clsx(
                    "ml-auto h-4 w-4",
                    username === value ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
