import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatedMenuToggle } from "./ui/sidebar";
import { useSidebar } from "../contexts/SidebarContext";

function Navbar() {
  const { toggle, isOpen } = useSidebar();

  return (
    <nav className="bg-dao-dark border-b border-dao-border sticky top-0 z-50 shadow-lg">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side: Hamburger Menu + Logo */}
          <div className="flex items-center gap-4">
            <AnimatedMenuToggle toggle={toggle} isOpen={isOpen} />

            <Link
              href="/dashboard"
              className="flex items-center gap-3 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-dao-dark rounded"
              aria-label="Go to dashboard"
            >
              <Image
                src="/logo.svg"
                alt="Fort Worth TX DAO"
                width={36}
                height={36}
                className="hover:opacity-80 transition-opacity"
                priority
              />
              <span className="text-white font-semibold text-lg tracking-tight hidden sm:block">
                Fort Worth DAO
              </span>
            </Link>
          </div>

          {/* Right side: Empty for now, all navigation in sidebar */}
          <div className="flex items-center">
            {/* Placeholder for future items if needed */}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default memo(Navbar);
