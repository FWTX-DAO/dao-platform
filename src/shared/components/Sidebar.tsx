import React, { memo, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { AnimatedSidebar, CollapsibleSection } from "./ui/sidebar";
import { useSidebar } from "../contexts/SidebarContext";
import { useProfile } from "@shared/hooks/useProfile";
import {
  Home,
  MessageSquare,
  Settings,
  User,
  Lightbulb,
  FileText,
  LogOut,
  FolderOpen,
  Trophy,
  Users,
  Send,
  Activity,
  CreditCard,
  ShieldCheck,
  BookOpen,
  Stamp,
} from "lucide-react";

export type NavbarItem = {
  id: string;
  name: string;
  href: string;
  icon: any;
};

const navigationItems: NavbarItem[] = [
  { id: "dashboard", name: "Dashboard", href: "/dashboard", icon: Home },
  { id: "forums", name: "Forums", href: "/forums", icon: MessageSquare },
  { id: "bounties", name: "Bounties", href: "/bounties", icon: Trophy },
  {
    id: "innovation-lab",
    name: "Innovation Lab",
    href: "/innovation-lab",
    icon: Lightbulb,
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    href: "/meeting-notes",
    icon: FileText,
  },
  { id: "documents", name: "Documents", href: "/documents", icon: FolderOpen },
];

interface SidebarItemProps {
  item: NavbarItem;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem = memo(({ item, isActive, onClick }: SidebarItemProps) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
        isActive
          ? "bg-dao-surface text-white hover:bg-dao-surface/80"
          : "text-dao-cool hover:text-white hover:bg-dao-surface/50"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="mr-3 h-5 w-5 shrink-0" />
      <span className="truncate">{item.name}</span>
    </Link>
  );
});

SidebarItem.displayName = "SidebarItem";

const UserAvatar = memo(
  ({ src, size = 40 }: { src: string; size?: number }) => (
    <div
      className="relative rounded-full overflow-hidden bg-dao-surface flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt="User avatar"
        width={size}
        height={size}
        className="rounded-full object-cover"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.nextElementSibling?.classList.remove("hidden");
        }}
      />
      <User className="h-6 w-6 text-dao-cool hidden" />
    </div>
  ),
);

UserAvatar.displayName = "UserAvatar";

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = usePrivy();
  const queryClient = useQueryClient();
  const { isOpen, close } = useSidebar();
  const { data: profile } = useProfile();
  const currentPath = pathname;
  const isAdmin = profile?.roleNames?.includes("admin");

  const isActive = useCallback(
    (href: string) => currentPath === href,
    [currentPath],
  );

  // Memoize handlers to prevent recreation on each render
  const handleLogout = useCallback(async () => {
    queryClient.clear();
    await logout();
    router.replace("/");
  }, [logout, queryClient, router]);

  const handleNavigation = useCallback(
    (href: string) => {
      router.push(href);
      // Auto-close on mobile
      if (window.innerWidth < 768) {
        close();
      }
    },
    [router, close],
  );

  // Memoize derived user info
  const userInfo = useMemo(
    () => ({
      email: user?.email?.address || "User",
      id: user?.id?.substring(0, 8) || "",
    }),
    [user?.email?.address, user?.id],
  );

  // Profile Section Component
  const profileSection = (
    <div className="flex items-center space-x-3">
      <UserAvatar src="/images/avatar.webp" size={48} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white truncate">{userInfo.email}</p>
        {userInfo.id && (
          <p className="text-sm text-dao-cool/70 truncate">
            {userInfo.id}
            {"…"}
          </p>
        )}
      </div>
    </div>
  );

  // Navigation Content
  const navigationContent = (
    <>
      {/* Main Navigation */}
      <div className="space-y-1 mb-4">
        {navigationItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isActive={isActive(item.href)}
            onClick={() => handleNavigation(item.href)}
          />
        ))}
      </div>

      {/* Collapsible Sections */}
      <CollapsibleSection title="Community" defaultOpen={false}>
        <div className="space-y-1">
          <Link
            href="/members"
            className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface/50 transition-colors duration-200"
          >
            <Users className="mr-3 h-4 w-4" />
            Members
          </Link>
          <Link
            href="/activity"
            className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface/50 transition-colors duration-200"
          >
            <Activity className="mr-3 h-4 w-4" />
            Activity
          </Link>
          <a
            href="https://t.me/fwtxdao"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface/50 transition-colors duration-200"
          >
            <Send className="mr-3 h-4 w-4" />
            Telegram
          </a>
        </div>
      </CollapsibleSection>

      {isAdmin && (
        <CollapsibleSection title="Admin" defaultOpen={false}>
          <div className="space-y-1">
            <Link
              href="/admin"
              className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface/50 transition-colors duration-200"
            >
              <ShieldCheck className="mr-3 h-4 w-4" />
              Admin Panel
            </Link>
            <Link
              href="/admin/bounties"
              className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface/50 transition-colors duration-200"
            >
              <Trophy className="mr-3 h-4 w-4" />
              Bounty Screening
            </Link>
            <Link
              href="/admin/stamps"
              className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface/50 transition-colors duration-200"
            >
              <Stamp className="mr-3 h-4 w-4" />
              Stamps
            </Link>
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Resources" defaultOpen={false}>
        <div className="space-y-1">
          <a
            href="https://constitution.fwtx.city"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface/50 transition-colors duration-200"
          >
            About DAO
          </a>
          <a
            href="https://github.com/fwtx-dao"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface/50 transition-colors duration-200"
          >
            GitHub
          </a>
        </div>
      </CollapsibleSection>
    </>
  );

  // Footer Section Component
  const footerSection = (
    <div className="space-y-2">
      <Link
        href="/passport"
        className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface transition-colors duration-200"
      >
        <BookOpen className="mr-3 h-4 w-4" />
        Passport
      </Link>
      <Link
        href="/billing"
        className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface transition-colors duration-200"
      >
        <CreditCard className="mr-3 h-4 w-4" />
        Billing
      </Link>
      <Link
        href="/settings"
        className="flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-dao-cool hover:text-white hover:bg-dao-surface transition-colors duration-200"
      >
        <Settings className="mr-3 h-4 w-4" />
        Settings
      </Link>
      <Button
        variant="ghost"
        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
        onClick={handleLogout}
      >
        <LogOut className="mr-3 h-4 w-4" />
        Log out
      </Button>
    </div>
  );

  return (
    <AnimatedSidebar
      isOpen={isOpen}
      onClose={close}
      profileSection={profileSection}
      footerSection={footerSection}
    >
      {navigationContent}
    </AnimatedSidebar>
  );
}

export default memo(Sidebar);
