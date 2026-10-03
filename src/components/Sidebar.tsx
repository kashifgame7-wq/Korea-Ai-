import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Image as ImageIcon,
  Trash2,
  X,
  Compass,
  Sparkles,
  Search,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onSelectPrompt: (prompt: string, mode: 'chat' | 'image') => void;
  currentUser?: any;
  onOpenAuth?: () => void;
  onOpenInstall?: () => void;
}

const INSPIRATION_PROMPTS = [
  {
    category: '🎨 AI Images',
    mode: 'image' as const,
    items: [
      'Neon-lit Seoul street at midnight in heavy rain, cyberpunk reflections',
      'Traditional Korean royal Hanbok portrait with golden embroidery, cinematic',
      'Futuristic K-Pop idol concert stage with volumetric lasers and holograms',
      'Autumn foliage at Gyeongbokgung Palace in Seoul, golden hour lighting',
    ],
  },
  {
    category: '💬 Smart Chat & Korea',
    mode: 'chat' as const,
    items: [
      'Main Korea trip plan kar raha hoon, 5-day Seoul itinerary batayein',
      'Top 5 most delicious Korean street foods with Pakistani/Indian spice touch',
      'Explain how AI diffusion models generate images step by step in Roman Urdu',
      'Teach me 10 essential Korean phrases for daily travel with pronunciation',
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onSelectPrompt,
  currentUser,
  onOpenAuth,
  onOpenInstall,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'history' | 'templates'>('history');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-[#18191a] border-r border-[#333537] flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[#333537] flex items-center justify-between">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#2b2c2d] hover:bg-[#383a3c] text-white font-medium text-xs border border-[#3c3f42] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#4285f4]" />
            <span>New Chat</span>
          </button>
          <button
            onClick={onClose}
            className="ml-2 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2b2c2d] lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-4 pt-3 pb-2 flex gap-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
              activeTab === 'history'
                ? 'bg-[#2b2c2d] text-white shadow-xs'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
              activeTab === 'templates'
                ? 'bg-[#2b2c2d] text-white shadow-xs'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Inspirations
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === 'history' ? (
            <>
              {/* Search box if there are multiple sessions */}
              {sessions.length > 2 && (
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full bg-[#131314] text-xs text-gray-200 pl-8 pr-3 py-1.5 rounded-lg border border-[#333537] focus:outline-none focus:border-[#4285f4]"
                  />
                </div>
              )}

              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  Koi conversation nahi mili.
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  const hasImage = session.messages.some((m) => m.imageUrl);
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#2b2c2d] text-white font-medium border border-[#3e4043]'
                          : 'text-gray-300 hover:bg-[#202123] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {hasImage ? (
                          <ImageIcon className="w-4 h-4 shrink-0 text-[#9b72cb]" />
                        ) : (
                          <MessageSquare className="w-4 h-4 shrink-0 text-[#4285f4]" />
                        )}
                        <span className="text-xs truncate">{session.title || 'New Chat'}</span>
                      </div>

                      {sessions.length > 1 && (
                        <button
                          onClick={(e) => onDeleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 rounded transition-opacity"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <div className="space-y-4">
              {INSPIRATION_PROMPTS.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-gray-400 px-1 uppercase tracking-wider">
                    {cat.category}
                  </p>
                  <div className="space-y-1">
                    {cat.items.map((promptText, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => {
                          onSelectPrompt(promptText, cat.mode);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className="w-full text-left p-2 rounded-lg bg-[#202123] hover:bg-[#2b2c2d] text-xs text-gray-300 hover:text-white transition-colors border border-transparent hover:border-[#383a3c] cursor-pointer"
                      >
                        <p className="line-clamp-2 leading-relaxed">{promptText}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-[#333537] bg-[#141517] space-y-2">
          {currentUser ? (
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-gray-300 font-medium truncate max-w-[140px]">
                {currentUser.displayName || currentUser.email || 'Guest User'}
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/30">
                Active
              </span>
            </div>
          ) : (
            onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="w-full py-1.5 px-3 rounded-lg bg-[#2b2c2d] hover:bg-[#383a3c] text-white text-xs font-medium transition-colors cursor-pointer border border-[#3e4144] flex items-center justify-center gap-1.5"
              >
                <span>Sign In / Create Account</span>
              </button>
            )
          )}
          {onOpenInstall && (
            <button
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
                onOpenInstall();
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-400 text-xs font-medium transition-colors cursor-pointer border border-emerald-500/30 flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install App on Mobile</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
            <span>Korea AI Studio</span>
            <span>·</span>
            <span>Secure Cloud Auth</span>
          </div>
        </div>
      </aside>
    </>
  );
};
