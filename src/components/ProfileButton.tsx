import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileButton() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-full bg-romantic-card text-romantic-light hover:bg-romantic-secondary transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-romantic-primary flex items-center justify-center text-romantic-dark font-bold">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.username} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>
        <span className="text-sm font-medium hidden sm:block">{user.username}</span>
        <ChevronDown className="h-4 w-4 text-romantic-light" />
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="p-4 border-b border-romantic-secondary/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-romantic-primary flex items-center justify-center text-romantic-dark font-bold">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.username} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-medium text-romantic-light">{user.username}</p>
                <p className="text-xs text-romantic-muted">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left rounded-md hover:bg-romantic-secondary/20 text-romantic-light"
            >
              <LogOut className="h-4 w-4 text-romantic-primary" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}