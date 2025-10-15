import React, { memo } from 'react';
import { useRouter } from 'next/router';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { Button } from './ui/button';
import { AnimatedSidebar, CollapsibleSection } from './ui/sidebar';
import { useSidebar } from '../contexts/SidebarContext';
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
} from 'lucide-react';

export type NavbarItem = {
  id: string;
  name: string;
  href: string;
  icon: any;
};

const navigationItems: NavbarItem[] = [
  { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: Home },
  { id: 'forums', name: 'Forums', href: '/forums', icon: MessageSquare },
  { id: 'bounties', name: 'Bounties', href: '/bounties', icon: Trophy },
  { id: 'innovation-lab', name: 'Innovation Lab', href: '/innovation-lab', icon: Lightbulb },
  { id: 'meeting-notes', name: 'Meeting Notes', href: '/meeting-notes', icon: FileText },
  { id: 'documents', name: 'Documents', href: '/documents', icon: FolderOpen },
];

interface SidebarItemProps {
  item: NavbarItem;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem = memo(({ item, isActive, onClick }: SidebarItemProps) => {
  const Icon = item.icon;
  return (
    <Button
      variant="ghost"
      className={`w-full justify-start transition-all duration-200 ${
        isActive
          ? 'bg-gray-700 text-white hover:bg-gray-600'
          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
      }`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
      <span className="truncate">{item.name}</span>
    </Button>
  );
});

SidebarItem.displayName = 'SidebarItem';

const UserAvatar = memo(({ src, size = 40 }: { src: string; size?: number }) => (
  <div
    className="relative rounded-full overflow-hidden bg-gray-600 flex items-center justify-center"
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
        e.currentTarget.style.display = 'none';
        e.currentTarget.nextElementSibling?.classList.remove('hidden');
      }}
    />
    <User className="h-6 w-6 text-gray-300 hidden" />
  </div>
));

UserAvatar.displayName = 'UserAvatar';

function Sidebar() {
  const router = useRouter();
  const { user, logout } = usePrivy();
  const { isOpen, close } = useSidebar();
  const currentPath = router.pathname;

  const isActive = (href: string) => currentPath === href;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    // Auto-close on mobile
    if (window.innerWidth < 768) {
      close();
    }
  };

  const userInfo = {
    email: user?.email?.address || 'User',
    id: user?.id?.substring(0, 8) || '',
  };

  // Profile Section Component
  const profileSection = (
    <div className="flex items-center space-x-3">
      <UserAvatar src="/images/avatar.png" size={48} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white truncate">{userInfo.email}</p>
        {userInfo.id && (
          <p className="text-sm text-gray-400 truncate">{userInfo.id}...</p>
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
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
            onClick={() => handleNavigation('/members')}
          >
            <Users className="mr-3 h-4 w-4" />
            Members
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
            onClick={() => window.open('https://t.me/fwtxdao', '_blank')}
          >
            <Send className="mr-3 h-4 w-4" />
            Telegram
          </Button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Resources" defaultOpen={false}>
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50 text-sm"
            onClick={() => window.open('https://constitution.fwtx.city', '_blank')}
          >
            About DAO
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50 text-sm"
            onClick={() => window.open('https://github.com/fwtx-dao', '_blank')}
          >
            GitHub
          </Button>
        </div>
      </CollapsibleSection>
    </>
  );

  // Footer Section Component
  const footerSection = (
    <div className="space-y-2">
      <Button
        variant="ghost"
        className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
        onClick={() => handleNavigation('/settings')}
      >
        <Settings className="mr-3 h-4 w-4" />
        Settings
      </Button>
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
