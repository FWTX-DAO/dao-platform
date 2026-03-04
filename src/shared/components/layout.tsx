import React, { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Navbar from "./navbar";
import Sidebar from "./Sidebar";
import { useRouter } from "next/router";
import { useSidebar } from "../contexts/SidebarContext";

type Props = {
  children?: React.ReactNode;
};

export default function Layout({ children }: Props) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const { isOpen } = useSidebar();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-violet-500"
      >
        Skip to main content
      </a>
      <Navbar />
      <Sidebar />
      <main
        id="main-content"
        className={`pt-4 sm:pt-6 lg:pt-8 transition-all duration-300 ease-in-out ${
          isOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
