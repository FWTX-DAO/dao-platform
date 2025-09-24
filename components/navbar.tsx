import React, { useState, useCallback, memo, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Menu,
  Home,
  MessageSquare,
  Settings,
  User,
  Lightbulb,
  FileText,
  LogOut,
  FolderOpen,
  Trophy,
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
  { id: "innovation-lab", name: "Innovation Lab", href: "/innovation-lab", icon: Lightbulb },
  { id: "meeting-notes", name: "Meeting Notes", href: "/meeting-notes", icon: FileText },
  { id: "documents", name: "Documents", href: "/documents", icon: FolderOpen },
];

const NavItem = memo(({ item, isActive, onClick }: { 
  item: NavbarItem; 
  isActive: boolean; 
  onClick: () => void;
}) => {
  const Icon = item.icon;
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className="text-gray-300 hover:text-white transition-colors"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-4 w-4 mr-2" />
      <span className="hidden lg:inline">{item.name}</span>
      <span className="lg:hidden">{item.name.split(' ')[0]}</span>
    </Button>
  );
});

NavItem.displayName = 'NavItem';

const MobileNavItem = memo(({ item, isActive, onClick }: {
  item: NavbarItem;
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = item.icon;
  return (
    <Button
      variant="ghost"
      className={`w-full justify-start ${
        isActive 
          ? 'bg-gray-800 text-white hover:bg-gray-800' 
          : 'text-gray-300 hover:text-white hover:bg-gray-800'
      }`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="mr-2 h-4 w-4" />
      {item.name}
    </Button>
  );
});

MobileNavItem.displayName = 'MobileNavItem';

const UserAvatar = memo(({ src, size = 44 }: { src: string; size?: number }) => (
  <div className="relative rounded-full overflow-hidden bg-gray-600 flex items-center justify-center"
    style={{ width: size, height: size }}>
    <Image
      src={src}
      alt="User avatar"
      width={size}
      height={size}
      className="rounded-full object-cover"
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        e.currentTarget.nextElementSibling?.classList.remove('hidden');
      }}
    />
    <User className="h-6 w-6 text-gray-300 hidden" />
  </div>
));

UserAvatar.displayName = 'UserAvatar';

function Navbar() {
  const router = useRouter();
  const { user, logout } = usePrivy();
  const [open, setOpen] = useState(false);
  const currentPath = router.pathname;

  const isActive = useCallback((href: string) => {
    return currentPath === href;
  }, [currentPath]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push("/");
  }, [logout, router]);

  const handleNavigation = useCallback((href: string, closeSheet = false) => {
    router.push(href);
    if (closeSheet) setOpen(false);
  }, [router]);

  const userInfo = useMemo(() => ({
    email: user?.email?.address || "User",
    id: user?.id?.substring(0, 8) || "",
  }), [user]);

  return (
    <nav className="bg-gray-800 border-b sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button
              className="flex-shrink-0 mr-4 lg:mr-6 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded"
              onClick={() => handleNavigation("/dashboard")}
              aria-label="Go to dashboard"
            >
              <Image
                src="/logo.svg"
                alt="Fort Worth TX DAO"
                width={40}
                height={40}
                className="hover:opacity-80 transition-opacity"
                priority
              />
            </button>

            <nav className="hidden md:block" aria-label="Main navigation">
              <div className="flex space-x-1 lg:space-x-2">
                {navigationItems.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={isActive(item.href)}
                    onClick={() => handleNavigation(item.href)}
                  />
                ))}
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-12 w-12 rounded-full p-0 hover:bg-gray-700 ring-2 ring-gray-600 hover:ring-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="User menu"
                  >
                    <UserAvatar src="/images/avatar.png" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userInfo.email}
                      </p>
                      {userInfo.id && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {userInfo.id}...
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-gray-300 hover:text-white hover:bg-gray-700 h-10 w-10"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0 bg-gray-900 text-white">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 p-6 border-b border-gray-700">
                    <Image
                      src="/logo.svg"
                      alt="Fort Worth TX DAO"
                      width={32}
                      height={32}
                    />
                    <span className="font-semibold text-lg text-white">FW TX DAO</span>
                  </div>

                  <nav 
                    className="flex-1 overflow-y-auto px-3 py-4 bg-gray-900" 
                    aria-label="Mobile navigation"
                  >
                    <div className="space-y-1">
                      {navigationItems.map((item) => (
                        <MobileNavItem
                          key={item.id}
                          item={item}
                          isActive={isActive(item.href)}
                          onClick={() => handleNavigation(item.href, true)}
                        />
                      ))}
                    </div>
                  </nav>

                  <div className="border-t border-gray-700 p-4 space-y-3 bg-gray-800">
                    <div className="flex items-center gap-3 px-3">
                      <UserAvatar src="/images/avatar.png" size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-white">
                          {userInfo.email}
                        </p>
                        {userInfo.id && (
                          <p className="text-xs text-gray-400">
                            {userInfo.id}...
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
                        onClick={() => handleNavigation("/settings", true)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => {
                          handleLogout();
                          setOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default memo(Navbar);