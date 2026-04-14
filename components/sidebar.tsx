"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { ROLES } from "@/lib/constants";
import { DEMO_MODE, DEMO_USER } from "@/lib/demo-data";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Receipt,
  Shield,
  Brain,
  Settings,
  LogOut,
  Scale,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Dossiers", href: "/dossiers", icon: FolderOpen },
  { label: "Facturation", href: "/facturation", icon: Receipt },
  {
    label: "Conflits",
    href: "/conflits",
    icon: Shield,
    roles: ["associe", "collaborateur"],
  },
  {
    label: "IA Juridique",
    href: "/ia",
    icon: Brain,
    roles: ["associe", "collaborateur"],
  },
  {
    label: "Admin",
    href: "/admin",
    icon: Settings,
    roles: ["associe"],
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function NavContent({
  user,
  onSignOut,
}: {
  user: { name: string; role: string } | null | undefined;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <Scale className="size-6 text-[#BF9874]" />
        <span className="font-heading text-xl font-normal uppercase tracking-widest text-white">
          LexiCab
        </span>
      </div>

      {/* Gold separator line */}
      <div className="mx-4 h-px bg-[#BF9874]/30" />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-0.5 px-3">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 rounded-none text-sm font-medium uppercase tracking-wider text-white/60 hover:bg-white/5 hover:text-white",
                    isActive &&
                      "bg-[#BF9874]/10 text-[#BF9874] border-l-2 border-[#BF9874] hover:bg-[#BF9874]/10 hover:text-[#BF9874]"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Gold separator line */}
      <div className="mx-4 h-px bg-[#BF9874]/30" />

      {/* User info + logout */}
      <div className="p-4">
        {user && (
          <div className="mb-3 flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback className="bg-[#BF9874]/20 text-xs text-[#BF9874]">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-white">
                {user.name}
              </span>
              <Badge
                variant="secondary"
                className="mt-0.5 w-fit bg-[#BF9874]/15 text-xs text-[#BF9874] hover:bg-[#BF9874]/15 border-0"
              >
                {ROLES[user.role as keyof typeof ROLES] ?? user.role}
              </Badge>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-none text-sm font-medium uppercase tracking-wider text-white/60 hover:bg-white/5 hover:text-white"
          onClick={onSignOut}
        >
          <LogOut className="size-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const convexUser = useQuery(api.users.me, DEMO_MODE ? "skip" : {});
  const user = DEMO_MODE ? DEMO_USER : convexUser;
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    if (DEMO_MODE) {
      router.push("/login");
      return;
    }
    await signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Mobile trigger */}
      <div className="fixed top-0 left-0 z-40 flex h-14 items-center px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="text-foreground" />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-[#001025] p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <NavContent user={user} onSignOut={handleSignOut} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 bg-[#001025] lg:block">
        <NavContent user={user} onSignOut={handleSignOut} />
      </aside>
    </>
  );
}
