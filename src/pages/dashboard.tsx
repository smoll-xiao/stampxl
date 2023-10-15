import { Button } from "@tatak-badges/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tatak-badges/components/ui/Dialog";
import { Label } from "@tatak-badges/components/ui/Label";
import { Input } from "@tatak-badges/components/ui/Input";
import { Switch } from "@tatak-badges/components/ui/Switch";
import { type ChangeEvent, useState } from "react";
import { api, type RouterOutputs } from "@tatak-badges/utils/api";
import { Card } from "@tatak-badges/components/ui/Card";
import Chip from "@tatak-badges/components/ui/Chip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tatak-badges/components/ui/DropdownMenu";
import { MoreVertical, Sparkles, User, Trash } from "lucide-react";

export default function Dashboard() {
  const rolesQuery = api.user.roles.useQuery();
  const roles = rolesQuery.data ?? [];
  const hasCreatorRole = roles.includes("creator");

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 flex items-center justify-between gap-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {hasCreatorRole && <CreateBadgeDialog />}
      </div>
      {hasCreatorRole && <CreatedBadgeList />}
    </div>
  );
}

function CreatedBadgeList() {
  const getAllCreatedBadgesQuery = api.badge.getAllCreated.useQuery();
  const createdBadges = getAllCreatedBadgesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">Badges Created</h2>
      <div className="grid grid-cols-3 gap-2">
        {createdBadges.map((badge) => (
          <CreatedBadgeListItem badge={badge} key={badge.id} />
        ))}
      </div>
    </div>
  );
}

type Badge = RouterOutputs["badge"]["getAllCreated"][0];

function CreatedBadgeListItem({ badge }: { badge: Badge }) {
  const svgXML = atob(badge.svg);
  const svgElement = svgXML.substring(svgXML.indexOf("<svg"));

  return (
    <Card className="flex items-center gap-1 p-2">
      <div
        className="svg-preview-container"
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

function CreatedBadgeActions({ badge }: { badge: Badge }) {
  const disableClaimMutation = api.badge.disable.useMutation();
  const deleteMutation = api.badge.delete.useMutation();
  const generateClaimTokenMutation = api.badge.generateClaimToken.useMutation({
    onSuccess: (token) => {
      const claimURL = `${window.location.origin}/claim?token=${token}`;
      void navigator.clipboard.writeText(claimURL);
      alert("Copied to clipboard!");
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
        <Button variant={null}>
          <MoreVertical className="h-6 w-6" />
        </Button>
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
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<CreateBadgeFormValues>(
    defaultCreateBadgeFormValues,
  );

  const createBadgeMutation = api.badge.create.useMutation({
    onSuccess: () => setOpen(false),
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
