import React from 'react';
import { LogOut, MessageSquarePlus, Trash2, Menu } from 'lucide-react';
import { User } from 'firebase/auth';
import { ChatSession } from '../types/chat';

interface SidebarProps {
  user: User | null;
  chatSessions: ChatSession[];
  onNewChat: () => void;
  onSwitchSession: (id: string) => void;
  onDeleteChat: (id: string) => void;
  currentSessionId: string | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user,
  chatSessions,
  onNewChat,
  onSwitchSession,
  onDeleteChat,
  currentSessionId,
  isOpen,
  setIsOpen,
  onSignOut
}) => {
  // Get user initials for avatar
  const getInitials = (email: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-gray-200 transition-all duration-200 ${isOpen ? 'w-64' : 'w-16'}`}>
      {!isOpen ? (
        // Collapsed State - Show menu, new chat and sign out buttons
        <div className="flex flex-col items-center h-full py-4">
          <div className="space-y-4">
            <button 
              onClick={() => setIsOpen(true)}
              className="p-2.5 rounded-md hover:bg-gray-800 transition-colors"
              title="Menu"
            >
              <Menu size={20} className="text-gray-300" />
            </button>
            <button 
              onClick={onNewChat}
              className="p-2.5 rounded-md hover:bg-gray-800 transition-colors"
              title="New Chat"
            >
              <MessageSquarePlus size={20} className="text-gray-300" />
            </button>
          </div>
          <div className="mt-auto">
            <button 
              onClick={onSignOut}
              className="p-2.5 rounded-md hover:bg-gray-800 transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} className="text-gray-300" />
            </button>
          </div>
        </div>
      ) : (
        // Expanded State
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 flex items-center justify-between">
            <button 
              onClick={onNewChat}
              className="flex-1 flex items-center p-3 rounded-md border border-gray-600 hover:bg-gray-800 transition-colors"
            >
              <div className="p-1 rounded-md bg-white/20 mr-2">
                <MessageSquarePlus size={16} className="text-white" />
              </div>
              <span>New chat</span>
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="ml-2 p-2 rounded-md hover:bg-gray-800 transition-colors"
              title="Collapse sidebar"
            >
              <Menu size={18} className="text-gray-300" />
            </button>
          </div>
          
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto py-2">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center justify-between px-4 py-3 mx-2 rounded-md cursor-pointer ${
                  session.id === currentSessionId ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                }`}
                onClick={() => onSwitchSession(session.id)}
              >
                <div className="truncate">{session.title}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(session.id);
                  }}
                  className="opacity-100 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* User Section */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                {getInitials(user?.email || null)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-gray-400">{user?.email ? formatDate(Date.now()) : ''}</p>
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
