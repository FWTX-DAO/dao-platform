"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface AnimatedMenuToggleProps {
  toggle: () => void;
  isOpen: boolean;
}

export const AnimatedMenuToggle = ({ toggle, isOpen }: AnimatedMenuToggleProps) => (
  <button
    onClick={toggle}
    aria-label="Toggle menu"
    className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded z-50"
  >
    <motion.div animate={{ y: isOpen ? 13 : 0 }} transition={{ duration: 0.3 }}>
      <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        transition={{ duration: 0.3 }}
        className="text-gray-300"
      >
        <motion.path
          fill="transparent"
          strokeWidth="3"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 2.5 L 22 2.5" },
            open: { d: "M 3 16.5 L 17 2.5" },
          }}
        />
        <motion.path
          fill="transparent"
          strokeWidth="3"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 12 L 22 12", opacity: 1 },
            open: { opacity: 0 },
          }}
          transition={{ duration: 0.2 }}
        />
        <motion.path
          fill="transparent"
          strokeWidth="3"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 21.5 L 22 21.5" },
            open: { d: "M 3 2.5 L 17 16.5" },
          }}
        />
      </motion.svg>
    </motion.div>
  </button>
);

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        className="w-full flex items-center justify-between py-2 px-4 rounded-xl hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-sm">{title}</span>
        {open ? <MinusIcon /> : <PlusIcon />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PlusIcon = () => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <motion.line x1="12" y1="5" x2="12" y2="19" />
    <motion.line x1="5" y1="12" x2="19" y2="12" />
  </motion.svg>
);

const MinusIcon = () => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <motion.line x1="5" y1="12" x2="19" y2="12" />
  </motion.svg>
);

interface AnimatedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  profileSection?: ReactNode;
  footerSection?: ReactNode;
}

export const AnimatedSidebar = ({
  isOpen,
  onClose,
  children,
  profileSection,
  footerSection,
}: AnimatedSidebarProps) => {
  const mobileSidebarVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 z-30 bg-black/50"
              onClick={onClose}
              aria-hidden="true"
            />
            {/* Mobile Sidebar */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={mobileSidebarVariants}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden fixed top-0 left-0 h-screen w-64 z-40 bg-gray-800 text-white shadow-xl"
            >
              <div className="flex flex-col h-full">
                {/* Top section with logo/branding space */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
                  <span className="text-white font-semibold">Navigation</span>
                  <button
                    onClick={onClose}
                    className="text-gray-300 hover:text-white hover:bg-gray-700 rounded p-2 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Section */}
                {profileSection && (
                  <div className="p-4 border-b border-gray-700">
                    {profileSection}
                  </div>
                )}

                {/* Navigation Section */}
                <nav className="flex-1 p-4 overflow-y-auto">
                  {children}
                </nav>

                {/* Footer / Action Button */}
                {footerSection && (
                  <div className="p-4 border-t border-gray-700">
                    {footerSection}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white shadow-xl border-r border-gray-700 z-40"
      >
        {/* Top spacer to account for navbar */}
        <div className="h-16 border-b border-gray-700" />
        {/* Profile Section */}
        {profileSection && (
          <div className="p-4 border-b border-gray-700">
            {profileSection}
          </div>
        )}

        {/* Navigation Section */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {children}
        </nav>

        {/* Footer / Action Button */}
        {footerSection && (
          <div className="p-4 border-t border-gray-700">
            {footerSection}
          </div>
        )}
      </motion.div>
    </>
  );
};
