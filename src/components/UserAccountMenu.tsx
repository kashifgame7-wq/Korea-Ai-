import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  LogOut,
  LogIn,
  Shield,
  Sparkles,
  ChevronDown,
  Heart,
} from 'lucide-react';
import { type User, logOut } from '../lib/firebase';

interface UserAccountMenuProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenFavorites: () => void;
  favoriteCount: number;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  currentUser,
  onOpenAuth,
  onOpenFavorites,
  favoriteCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) {
    return (
      <button
        onClick={onOpenAuth}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4285f4] hover:bg-[#3367d6] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </button>
    );
  }

  const isGuest = currentUser.isAnonymous;
  const displayName = currentUser.displayName || (isGuest ? 'Guest User' : currentUser.email?.split('@')[0] || 'User');
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-[#2b2c2d] hover:bg-[#383a3c] border border-[#3e4144] transition-colors cursor-pointer"
        title="Account Settings"
      >
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] text-white text-xs font-bold flex items-center justify-center">
            {initial}
          </div>
        )}
        <span className="text-xs font-medium text-gray-200 hidden md:inline max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-[#1e1f20] border border-[#333537] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Details */}
          <div className="px-4 py-2 border-b border-[#333537]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white truncate block">
                {displayName}
              </span>
              {isGuest && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">
                  Guest
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 truncate mt-0.5">
              {currentUser.email || (isGuest ? 'Temporary guest session' : 'Signed in')}
            </p>
          </div>

          {/* Links */}
          <div className="p-1 space-y-0.5">
            {isGuest && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAuth();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-300 hover:text-white hover:bg-[#2b2c2d] rounded-lg transition-colors cursor-pointer text-left"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Link Google / Email account</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenFavorites();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-200 hover:text-white hover:bg-[#2b2c2d] rounded-lg transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>My Favorites</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2b2c2d] text-rose-300">
                {favoriteCount}
              </span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-[#333537] p-1 mt-1">
            <button
              onClick={async () => {
                setIsOpen(false);
                await logOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
