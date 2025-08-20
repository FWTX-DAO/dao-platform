import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
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
  { id: "innovation-lab", name: "Innovation Lab", href: "/innovation-lab", icon: Lightbulb },
  { id: "meeting-notes", name: "Meeting Notes", href: "/meeting-notes", icon: FileText },
  { id: "documents", name: "Documents", href: "/documents", icon: FolderOpen },
];

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = usePrivy();
  const [open, setOpen] = useState(false);
  const currentPath = router.pathname;

  const isActive = (href: string) => {
    return currentPath === href;
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="bg-gray-800 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section with logo and navigation */}
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0 mr-6">
              <Image
                src="/logo.svg"
                alt="Fort Worth TX DAO"
                width={40}
                height={40}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onClick={() => router.push("/dashboard")}
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="flex space-x-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className="text-gray-300 hover:text-white"
                      onClick={() => router.push(item.href)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right section with user menu */}
          <div className="flex items-center gap-4">
            {/* User dropdown - Desktop */}
            <div className="hidden md:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-12 w-12 rounded-full p-0 hover:bg-gray-700 ring-2 ring-gray-600 hover:ring-gray-500"
                  >
                    <div className="relative h-11 w-11 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                      <Image
                        src="/images/avatar.png"
                        alt="User avatar"
                        width={44}
                        height={44}
                        className="rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <User className="h-6 w-6 text-gray-300 hidden" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.email?.address || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.id?.substring(0, 8)}...
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
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

            {/* Mobile menu button */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-gray-300 hover:text-white hover:bg-gray-700 h-10 w-10"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4">
                  {/* Logo in mobile menu */}
                  <div className="flex items-center gap-2 pb-4 border-b">
                    <Image
                      src="/logo.svg"
                      alt="Fort Worth TX DAO"
                      width={32}
                      height={32}
                    />
                    <span className="font-semibold text-lg">FW TX DAO</span>
                  </div>

                  {/* Navigation items */}
                  <ScrollArea className="flex-1">
                    <div className="space-y-1">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.id}
                            variant={isActive(item.href) ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                              router.push(item.href);
                              setOpen(false);
                            }}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </Button>
                        );
                      })}
                    </div>

                    {/* User section and settings at bottom */}
                    <div className="mt-8 pt-4 border-t space-y-1">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                          <Image
                            src="/images/avatar.png"
                            alt="User avatar"
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <User className="h-5 w-5 text-gray-300 hidden" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {user?.email?.address || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user?.id?.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          router.push("/settings");
                          setOpen(false);
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          handleLogout();
                          setOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </ScrollArea>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
