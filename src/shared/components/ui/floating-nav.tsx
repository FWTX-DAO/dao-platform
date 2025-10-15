"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import {
  Home,
  MessageSquare,
  Lightbulb,
  FileText,
  FolderOpen,
  Trophy,
  User,
} from "lucide-react";

export interface FloatingNavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
}

const defaultItems: FloatingNavItem[] = [
  { id: "dashboard", icon: <Home size={22} />, label: "Home", href: "/dashboard" },
  { id: "forums", icon: <MessageSquare size={22} />, label: "Forums", href: "/forums" },
  { id: "bounties", icon: <Trophy size={22} />, label: "Bounties", href: "/bounties" },
  { id: "innovation-lab", icon: <Lightbulb size={22} />, label: "Lab", href: "/innovation-lab" },
  { id: "meeting-notes", icon: <FileText size={22} />, label: "Notes", href: "/meeting-notes" },
  { id: "documents", icon: <FolderOpen size={22} />, label: "Docs", href: "/documents" },
  { id: "profile", icon: <User size={22} />, label: "Profile", href: "/settings" },
];

interface FloatingNavProps {
  items?: FloatingNavItem[];
}

const FloatingNav = ({ items = defaultItems }: FloatingNavProps) => {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Determine active item based on current route
  useEffect(() => {
    const currentPath = router.pathname;
    const activeIndex = items.findIndex((item) => item.href === currentPath);
    if (activeIndex !== -1) {
      setActive(activeIndex);
    }
  }, [router.pathname, items]);

  // Update indicator position when active changes or resize
  useEffect(() => {
    const updateIndicator = () => {
      if (btnRefs.current[active] && containerRef.current) {
        const btn = btnRefs.current[active];
        const container = containerRef.current;
        if (!btn) return;
        const btnRect = btn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setIndicatorStyle({
          width: btnRect.width,
          left: btnRect.left - containerRect.left,
        });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [active]);

  const handleNavigation = (index: number, href: string) => {
    setActive(index);
    router.push(href);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-3 md:hidden">
      <div
        ref={containerRef}
        className="relative flex items-center justify-between bg-gray-900 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] rounded-2xl px-2 py-3.5 border border-gray-700/50 ring-1 ring-white/10"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(el) => (btnRefs.current[index] = el)}
            onClick={() => handleNavigation(index, item.href)}
            className={`relative flex flex-col items-center justify-center flex-1 px-1.5 py-2 text-sm font-medium transition-all duration-200 rounded-xl ${
              active === index ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
            aria-label={item.label}
          >
            <div className="z-10 transition-transform duration-200" style={{ transform: active === index ? 'scale(1.1)' : 'scale(1)' }}>
              {item.icon}
            </div>
            {/* hide labels on very small screens */}
            <span className={`text-[9px] mt-1 hidden xs:block truncate max-w-[50px] transition-opacity duration-200 ${
              active === index ? 'opacity-100 font-semibold' : 'opacity-70'
            }`}>
              {item.label}
            </span>
          </button>
        ))}

        {/* Sliding Active Indicator */}
        <motion.div
          animate={indicatorStyle}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          className="absolute top-2.5 bottom-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 shadow-lg shadow-violet-500/50"
        />
      </div>
    </div>
  );
};

export default FloatingNav;
