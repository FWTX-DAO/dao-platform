import React, { useCallback, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { AnimatedMenuToggle } from "./ui/sidebar";
import { useSidebar } from "../contexts/SidebarContext";

function Navbar() {
  const router = useRouter();
  const { toggle, isOpen } = useSidebar();

  const handleNavigation = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-lg">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side: Hamburger Menu + Logo */}
          <div className="flex items-center gap-4">
            <AnimatedMenuToggle toggle={toggle} isOpen={isOpen} />

            <button
              className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded"
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
