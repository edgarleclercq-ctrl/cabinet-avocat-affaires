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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <span className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary/12 ring-1 ring-sidebar-primary/25">
          <Scale className="size-4 text-sidebar-primary" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-heading text-lg uppercase tracking-[0.22em] text-sidebar-foreground">
            LexiCab
          </span>
          <span className="text-[0.625rem] uppercase tracking-[0.18em] text-sidebar-foreground/50">
            Cabinet d&apos;affaires
          </span>
        </div>
      </div>

      <div className="mx-5 h-px bg-sidebar-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-0.5 px-3">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary/15 text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-sidebar-primary"
                  />
                )}
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground/80"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="mx-5 h-px bg-sidebar-border" />

      {/* Theme toggle */}
      <div className="px-3 pt-3">
        <ThemeToggle />
      </div>

      {/* User info + logout */}
      <div className="px-4 pt-2 pb-4">
        {user && (
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar size="sm">
              <AvatarFallback className="bg-sidebar-primary/15 text-xs text-sidebar-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {user.name}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/55">
                {ROLES[user.role as keyof typeof ROLES] ?? user.role}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" />
          <span className="font-medium">Déconnexion</span>
        </button>
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
          <SheetContent
            side="left"
            className="w-64 border-r border-sidebar-border bg-sidebar p-0"
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <NavContent user={user} onSignOut={handleSignOut} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <NavContent user={user} onSignOut={handleSignOut} />
      </aside>
    </>
  );
}
