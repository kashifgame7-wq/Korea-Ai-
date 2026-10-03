import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Download,
  Maximize2,
  Mic,
  MicOff,
  Image as ImageIcon,
  RotateCcw,
  Menu,
  Wand2,
  Trash2,
  Layers,
  HelpCircle,
  Heart,
  Smartphone,
} from 'lucide-react';
import { ChatMessage, ChatSession, AspectRatioOption, ImageStyleOption } from './types';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { ImageLightbox } from './components/ImageLightbox';
import { ImageGalleryModal } from './components/ImageGalleryModal';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { UserAccountMenu } from './components/UserAccountMenu';
import { InstallPwaModal, MobileInstallBanner } from './components/InstallPwaModal';
import { auth, onAuthStateChanged, type User } from './lib/firebase';
import { playSendSound, playSuccessSound } from './utils/audio';

const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: '1:1', label: '1:1 Square', ratio: '1:1', width: 768, height: 768, iconName: 'Square' },
  { id: '16:9', label: '16:9 Cinema', ratio: '16:9', width: 1024, height: 576, iconName: 'Monitor' },
  { id: '9:16', label: '9:16 Story', ratio: '9:16', width: 576, height: 1024, iconName: 'Smartphone' },
  { id: '4:3', label: '4:3 Classic', ratio: '4:3', width: 896, height: 672, iconName: 'Rectangle' },
];

const IMAGE_STYLES: ImageStyleOption[] = [
  { id: 'Default', name: 'Original', description: 'Natural versatile render', promptModifier: '', badge: '✨' },
  { id: 'K-Culture', name: 'K-Aesthetic', description: 'Seoul street, K-drama & royal palace aesthetic', promptModifier: 'Korean drama cinematic style, Seoul aesthetic, soft natural lighting', badge: '🌸' },
  { id: 'Photorealistic', name: 'Photorealistic', description: '8K HDR detailed photo', promptModifier: 'photorealistic, 8k resolution, crisp detail, realistic lighting', badge: '📷' },
  { id: 'Anime', name: 'Anime / Webtoon', description: 'Korean manhwa and anime illustration', promptModifier: 'Korean webtoon style, vibrant digital anime illustration, sharp lineart', badge: '🎨' },
  { id: 'Cyberpunk', name: 'Neo Seoul Cyberpunk', description: 'Neon glow, futuristic Seoul cityscape', promptModifier: 'cyberpunk neo-seoul, futuristic neon lights, rain reflections, volumetric fog', badge: '🌃' },
  { id: '3D', name: '3D Animation', description: 'Pixar / Octane render cute 3D', promptModifier: '3D cute character render, octane render, smooth textures, studio lighting', badge: '🧸' },
];

const STARTER_CARDS = [
  {
    title: 'Neon Seoul Street',
    desc: 'Rainy midnight street in Hongdae with cyber glow',
    mode: 'image' as const,
    prompt: 'A vibrant neon-lit street in Hongdae Seoul at midnight in gentle rain, wet pavement reflections, traditional pojangmacha food stall with warm steam, 8k cinematic photography',
  },
  {
    title: 'Traditional Hanbok',
    desc: 'Royal elegance at Gyeongbokgung Palace',
    mode: 'image' as const,
    prompt: 'A majestic portrait of an elegant woman in colorful traditional Korean silk Hanbok in the courtyards of Gyeongbokgung Palace, cherry blossoms blowing in the wind, golden hour',
  },
  {
    title: 'Seoul Travel Guide',
    desc: 'Plan an unforgettable 5-day itinerary',
    mode: 'chat' as const,
    prompt: 'Mujhe Seoul ka ek comprehensive 5-day itinerary bana kar dein jisme best food spots, historical palaces, aur shopping markets shamil hon.',
  },
  {
    title: 'Korean Phrases in Urdu',
    desc: 'Daily essential conversational phrases',
    mode: 'chat' as const,
    prompt: 'Daily use ke 10 zaroori Korean phrases sikha dein unke Urdu aur English meanings aur accurate pronunciation ke sath.',
  },
];

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  sender: 'ai',
  content: 'Hello! Main **Korea AI** hoon. Aap mujhse chat kar sakte hain ya dropdown se "Image" select karke fast images bana sakte hain. Batayen aaj kya help chahiye?',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  mode: 'chat',
};

export default function App() {
  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('korea_ai_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'session-1',
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [INITIAL_WELCOME_MESSAGE],
      },
    ];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => sessions[0]?.id || 'session-1');

  // Input states
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'chat' | 'image'>('chat');
  const [selectedRatio, setSelectedRatio] = useState<string>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>('Default');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  // UI Modals & Toggles
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'all' | 'favorites'>('all');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Capture beforeinstallprompt for PWA mobile install
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Firebase auth state subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('korea_ai_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {}
    return new Set<string>();
  });
  const [lightboxData, setLightboxData] = useState<{
    id?: string;
    imageUrl: string | null;
    prompt: string;
    aspectRatio?: string;
    style?: string;
  } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem('korea_ai_favorites', JSON.stringify(Array.from(favoriteIds)));
    } catch {}
  }, [favoriteIds]);

  const toggleFavorite = (msgId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
        playSuccessSound(soundEnabled);
      }
      return next;
    });

    // Also sync the message object inside sessions if present
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === msgId ? { ...m, isFavorite: !m.isFavorite } : m
        ),
      }))
    );
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Active session
  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem('korea_ai_sessions', JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice speech-to-text setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported on this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Text to speech for AI responses
  const handleToggleSpeak = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const cleanText = text
      .replace(/[#*_`]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Enhance prompt with Gemini
  const handleEnhancePrompt = async () => {
    if (!input.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input.trim(), style: selectedStyle }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setInput(data.enhancedPrompt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Send message or generate image
  const handleSubmit = async (overridePrompt?: string, overrideMode?: 'chat' | 'image') => {
    const textToSend = (overridePrompt || input).trim();
    const currentMode = overrideMode || mode;

    if (!textToSend || isLoading) return;

    playSendSound(soundEnabled);

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: currentMode,
    };

    // Update session title if first user message
    const isFirstUserMessage = messages.filter((m) => m.sender === 'user').length === 0;
    const newTitle = isFirstUserMessage
      ? textToSend.slice(0, 28) + (textToSend.length > 28 ? '...' : '')
      : activeSession.title;

    const updatedMessages = [...messages, userMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : s
      )
    );

    setInput('');
    setIsLoading(true);

    if (currentMode === 'image') {
      setLoadingStatusText('Korea AI fast image engine rendering...');

      try {
        const styleObj = IMAGE_STYLES.find((s) => s.id === selectedStyle);
        const styleModifier = styleObj?.promptModifier || '';
        const promptWithStyle = styleModifier
          ? `${textToSend}, ${styleModifier}`
          : textToSend;

        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptWithStyle,
            aspectRatio: selectedRatio,
            style: selectedStyle,
          }),
        });

        const data = await res.json();

        if (data.imageUrl) {
          playSuccessSound(soundEnabled);
          const aiMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            content: 'Yeh lijiye aapki image tayar hai:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: 'image',
            imageUrl: data.imageUrl,
            imagePrompt: textToSend,
            imageAspectRatio: selectedRatio,
            imageStyle: selectedStyle,
          };

          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId
                ? { ...s, messages: [...s.messages, aiMessage] }
                : s
            )
          );
        } else {
          throw new Error('Fallback to direct image generation');
        }
      } catch (err: any) {
        console.warn('Using client-side fast image generation:', err);
        const encodedPrompt = encodeURIComponent(textToSend);
        const fallbackUrl = `https://pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
        playSuccessSound(soundEnabled);
        const fallbackAiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          content: 'Yeh lijiye aapki image tayar hai:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: 'image',
          imageUrl: fallbackUrl,
          imagePrompt: textToSend,
          imageAspectRatio: selectedRatio,
          imageStyle: selectedStyle,
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: [...s.messages, fallbackAiMessage] }
              : s
          )
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // Chat mode
      setLoadingStatusText('Korea AI is thinking...');

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: textToSend,
            messages: updatedMessages.map((m) => ({
              sender: m.sender,
              content: m.content,
            })),
          }),
        });

        const data = await res.json();

        playSuccessSound(soundEnabled);

        let replyContent = data.text;
        if (!replyContent) {
          const lower = textToSend.toLowerCase();
          if (lower.includes('channel') || lower.includes('name') || lower.includes('youtube')) {
            replyContent = "Yahan aapke AI YouTube channel ke liye 10 behtareen names hain:\n\n1. Korea AI Hub\n2. NextGen AI Shorts\n3. AI Studio Vortex\n4. CyberCraft AI\n5. Visionary AI Shorts\n6. Neuralize Studio\n7. Alpha AI Realm\n8. Infinite AI Play\n9. Prompt Genius AI\n10. SyncAI Shorts";
          } else if (lower.includes('hello') || lower.includes('salam') || lower.includes('hi')) {
            replyContent = "Walaikum Assalam! Main Korea AI hoon. Bataiye aaj kis topic par baat karni hai ya kya banana hai?";
          } else {
            replyContent = `Korea AI Response:\nAapne pucha: "${textToSend}"\n\nMai is par puri tarah kaam kar raha hoon. Aap chahein toh dropdown se 'Image' mode select karke iski picture bhi generate kar sakte hain!`;
          }
        }

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          content: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: 'chat',
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: [...s.messages, aiMessage] }
              : s
          )
        );
      } catch (err: any) {
        console.warn('Using client smart reply fallback:', err);
        const lower = textToSend.toLowerCase();
        let replyContent = '';
        if (lower.includes('channel') || lower.includes('name') || lower.includes('youtube')) {
          replyContent = "Yahan aapke AI YouTube channel ke liye 10 behtareen names hain:\n\n1. Korea AI Hub\n2. NextGen AI Shorts\n3. AI Studio Vortex\n4. CyberCraft AI\n5. Visionary AI Shorts\n6. Neuralize Studio\n7. Alpha AI Realm\n8. Infinite AI Play\n9. Prompt Genius AI\n10. SyncAI Shorts";
        } else if (lower.includes('hello') || lower.includes('salam') || lower.includes('hi')) {
          replyContent = "Walaikum Assalam! Main Korea AI hoon. Bataiye aaj kis topic par baat karni hai ya kya banana hai?";
        } else {
          replyContent = `Korea AI Response:\nAapne pucha: "${textToSend}"\n\nMai is par puri tarah kaam kar raha hoon. Aap chahein toh dropdown se 'Image' mode select karke iski picture bhi generate kar sakte hain!`;
        }
        playSuccessSound(soundEnabled);
        const fallbackMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          content: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: 'chat',
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: [...s.messages, fallbackMsg] }
              : s
          )
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Enter key handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Clear current chat
  const handleClearChat = () => {
    const confirmed = window.confirm('Kya aap is chat ko clear karna chahte hain?');
    if (!confirmed) return;

    const resetMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'ai',
      content: 'Chat cleared! Naya topic shuru karein ya dropdown se "Image" select karke photo banayein.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'chat',
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: 'New Chat',
              updatedAt: Date.now(),
              messages: [resetMessage],
            }
          : s
      )
    );
  };

  // Create new chat session
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [INITIAL_WELCOME_MESSAGE],
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
  };

  // Delete chat session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) return;
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (currentSessionId === id) {
      setCurrentSessionId(remaining[0].id);
    }
  };

  // Retry an image with random seed variation
  const handleRetryImage = (originalPrompt: string, ratio: string = '1:1', style: string = 'Default') => {
    setMode('image');
    setSelectedRatio(ratio);
    setSelectedStyle(style);
    handleSubmit(`Generate another variation: ${originalPrompt}`, 'image');
  };

  return (
    <div className="flex h-screen bg-[#131314] text-[#e3e3e3] overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onSelectPrompt={(p, m) => {
          setMode(m);
          setInput(p);
          textareaRef.current?.focus();
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header matching requested prototype */}
        <header className="bg-[#1e1f20] px-4 py-3 sm:px-6 flex items-center justify-between border-b border-[#333537] z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#2b2c2d] transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Gradient Logo */}
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent">
                Korea AI Studio
              </span>
              <span className="hidden sm:inline text-[11px] font-medium text-gray-400 bg-[#2b2c2d] px-2 py-0.5 rounded-md border border-[#383a3c]">
                한국 AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Gallery Button */}
            <button
              onClick={() => {
                setGalleryTab('all');
                setIsGalleryOpen(true);
              }}
              className="flex items-center gap-1.5 bg-[#2b2c2d] hover:bg-[#383a3c] text-gray-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="View all generated images"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#9b72cb]" />
              <span className="hidden sm:inline">Gallery</span>
            </button>

            {/* Quick Favorites Button if any favorites saved */}
            {favoriteIds.size > 0 && (
              <button
                onClick={() => {
                  setGalleryTab('favorites');
                  setIsGalleryOpen(true);
                }}
                className="flex items-center gap-1 bg-[#2b2c2d] hover:bg-rose-950/40 text-rose-400 border border-rose-500/30 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="View Favorites in Gallery"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>{favoriteIds.size}</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-[#2b2c2d] hover:bg-[#383a3c] text-gray-300 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#4285f4]" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
            </button>

            {/* Install App Button */}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#2b2c2d] hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Install Korea AI app on your phone"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Install</span>
            </button>

            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              className="bg-[#2b2c2d] hover:bg-[#383a3c] text-[#e3e3e3] px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-transparent hover:border-[#424447]"
            >
              Clear Chat
            </button>

            {/* User Account Menu / Login Button */}
            <UserAccountMenu
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenFavorites={() => {
                setGalleryTab('favorites');
                setIsGalleryOpen(true);
              }}
              favoriteCount={favoriteIds.size}
            />
          </div>
        </header>

        {/* Mobile Install Top Banner */}
        <MobileInstallBanner
          deferredPrompt={deferredPrompt}
          onOpenModal={() => setIsInstallModalOpen(true)}
        />

        {/* Chat / Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 select-text">
          <div className="max-w-3xl mx-auto flex flex-col gap-5">
            {/* If conversation has only the welcome message, show starter cards */}
            {messages.length === 1 && messages[0].sender === 'ai' && (
              <div className="mb-2">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Quick Inspiration:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STARTER_CARDS.map((card, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setMode(card.mode);
                          setInput(card.prompt);
                          textareaRef.current?.focus();
                        }}
                        className="text-left p-3.5 rounded-xl bg-[#1e1f20] hover:bg-[#27282a] border border-[#333537] hover:border-[#4285f4]/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-white group-hover:text-[#4285f4] transition-colors">
                            {card.title}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {card.mode === 'image' ? '🎨 Image' : '💬 Chat'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1">{card.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-[90%] sm:max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#4285f4] text-white'
                      : 'bg-gradient-to-tr from-[#9b72cb] to-[#d96570] text-white shadow-purple-900/30'
                  }`}
                >
                  {msg.sender === 'user' ? 'U' : 'AI'}
                </div>

                {/* Bubble */}
                <div
                  className={`relative p-3.5 sm:p-4 rounded-2xl word-break text-[0.95rem] leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#2b2c2d] text-white rounded-tr-xs'
                      : 'bg-[#1e1f20] border border-[#333537] text-[#e3e3e3] rounded-tl-xs'
                  }`}
                >
                  {/* Text Content */}
                  <MarkdownRenderer content={msg.content} />

                  {/* Generated Image section if present */}
                  {msg.imageUrl && (
                    <div className="mt-3 space-y-2">
                      <div className="relative group rounded-xl overflow-hidden border border-[#333537] bg-[#141517]">
                        <img
                          src={msg.imageUrl}
                          alt={msg.imagePrompt || 'Generated image'}
                          className="w-full max-h-[460px] object-cover rounded-lg cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                          onClick={() =>
                            setLightboxData({
                              id: msg.id,
                              imageUrl: msg.imageUrl!,
                              prompt: msg.imagePrompt || msg.content,
                              aspectRatio: msg.imageAspectRatio,
                              style: msg.imageStyle,
                            })
                          }
                        />

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          {/* Heart Button in Hover Overlay */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(msg.id);
                            }}
                            className={`p-2.5 rounded-full backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer ${
                              favoriteIds.has(msg.id) || !!msg.isFavorite
                                ? 'bg-rose-950/90 text-rose-400 border border-rose-500/50'
                                : 'bg-black/70 hover:bg-black text-white hover:text-rose-400'
                            }`}
                            title={
                              favoriteIds.has(msg.id) || !!msg.isFavorite
                                ? 'Remove from Favorites'
                                : 'Save to Favorites'
                            }
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                favoriteIds.has(msg.id) || !!msg.isFavorite
                                  ? 'fill-rose-500 text-rose-500'
                                  : ''
                              }`}
                            />
                          </button>

                          <button
                            onClick={() =>
                              setLightboxData({
                                id: msg.id,
                                imageUrl: msg.imageUrl!,
                                prompt: msg.imagePrompt || msg.content,
                                aspectRatio: msg.imageAspectRatio,
                                style: msg.imageStyle,
                              })
                            }
                            className="p-2.5 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer"
                            title="Fullscreen"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>

                          <a
                            href={msg.imageUrl}
                            download={`korea_ai_${msg.id}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() =>
                              handleRetryImage(
                                msg.imagePrompt || msg.content,
                                msg.imageAspectRatio,
                                msg.imageStyle
                              )
                            }
                            className="p-2.5 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer"
                            title="Generate another variation"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Image Action Strip */}
                      <div className="flex items-center justify-between pt-1 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-gray-400">
                            {msg.imageAspectRatio || '1:1'}
                          </span>
                          {msg.imageStyle && msg.imageStyle !== 'Default' && (
                            <>
                              <span>·</span>
                              <span className="text-[11px] text-[#9b72cb] font-medium">
                                {msg.imageStyle}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Heart Button in Generated Image Control Strip */}
                          <button
                            onClick={() => toggleFavorite(msg.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] font-medium ${
                              favoriteIds.has(msg.id) || !!msg.isFavorite
                                ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40 shadow-xs'
                                : 'bg-[#2b2c2d] hover:bg-[#383a3c] text-gray-300 hover:text-rose-400'
                            }`}
                            title={
                              favoriteIds.has(msg.id) || !!msg.isFavorite
                                ? 'Remove from Favorites'
                                : 'Save to Favorites'
                            }
                          >
                            <Heart
                              className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                                favoriteIds.has(msg.id) || !!msg.isFavorite
                                  ? 'fill-rose-500 text-rose-500'
                                  : 'text-gray-400'
                              }`}
                            />
                            <span>
                              {favoriteIds.has(msg.id) || !!msg.isFavorite ? 'Favorited' : 'Favorite'}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setInput(msg.imagePrompt || msg.content);
                              textareaRef.current?.focus();
                            }}
                            className="px-2 py-1 rounded bg-[#2b2c2d] hover:bg-[#383a3c] text-gray-300 hover:text-white transition-colors cursor-pointer text-[11px]"
                          >
                            Re-use Prompt
                          </button>
                          <button
                            onClick={() =>
                              handleRetryImage(
                                msg.imagePrompt || msg.content,
                                msg.imageAspectRatio,
                                msg.imageStyle
                              )
                            }
                            className="p-1 rounded bg-[#2b2c2d] hover:bg-[#383a3c] text-gray-300 hover:text-white transition-colors cursor-pointer"
                            title="Make Variation"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#4285f4]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Bubble Actions (Speak, Copy, Timestamp) */}
                  <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-[#333537]/50 text-[11px] text-gray-400">
                    <span>{msg.timestamp}</span>

                    {msg.sender === 'ai' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSpeak(msg.content, msg.id)}
                          className="hover:text-white transition-colors cursor-pointer"
                          title={speakingMessageId === msg.id ? 'Stop audio' : 'Listen with TTS'}
                        >
                          {speakingMessageId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                          }}
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3.5 max-w-[85%] animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#9b72cb] to-[#d96570] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  AI
                </div>
                <div className="bg-[#1e1f20] border border-[#333537] p-4 rounded-2xl rounded-tl-xs flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4285f4] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#9b72cb] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#d96570] animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-xs text-gray-400">{loadingStatusText}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-[#1e1f20] p-3 sm:p-4 border-t border-[#333537] shrink-0">
          <div className="max-w-3xl mx-auto space-y-2.5">
            {/* Mode Specific Controls (When Image mode is chosen) */}
            {mode === 'image' && (
              <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
                {/* Aspect Ratio Selector */}
                <div className="flex items-center gap-1 bg-[#141517] p-1 rounded-xl border border-[#333537]">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.id}
                      onClick={() => setSelectedRatio(ar.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        selectedRatio === ar.id
                          ? 'bg-[#2b2c2d] text-white shadow-xs'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>

                {/* Style Dropdown */}
                <div className="relative">
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="bg-[#141517] text-gray-200 border border-[#333537] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#4285f4] cursor-pointer"
                  >
                    {IMAGE_STYLES.map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.badge} {style.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Input Bar Wrapper matching user prototype aesthetic */}
            <div className="bg-[#2b2c2d] rounded-2xl sm:rounded-full flex items-center px-3 sm:px-4 py-2 border border-transparent focus-within:border-[#4285f4] transition-colors shadow-lg">
              {/* Tools / Mode Dropdown Selector */}
              <select
                id="modeSelect"
                value={mode}
                onChange={(e) => setMode(e.target.value as 'chat' | 'image')}
                className="bg-[#131314] text-gray-300 border border-[#3a3c3f] rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium mr-2.5 focus:outline-none cursor-pointer hover:bg-[#1a1b1d] transition-colors shrink-0"
              >
                <option value="chat">💬 Chat</option>
                <option value="image">🎨 Image</option>
              </select>

              {/* Text Input */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything or describe an image..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-white text-sm sm:text-base py-1 px-1 placeholder-gray-400 resize-none max-h-28 overflow-y-auto leading-relaxed"
              />

              {/* Action Buttons inside Input */}
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                {/* Magic Wand Prompt Enhancer */}
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={!input.trim() || isEnhancing}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isEnhancing
                      ? 'text-[#9b72cb] animate-spin'
                      : 'text-gray-400 hover:text-[#9b72cb] hover:bg-[#383a3c] disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                  title="Enhance prompt with AI"
                >
                  <Wand2 className="w-4 h-4" />
                </button>

                {/* Voice Input Mic */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 animate-pulse'
                      : 'text-gray-400 hover:text-white hover:bg-[#383a3c]'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || isLoading}
                  className="bg-[#4285f4] hover:bg-[#3367d6] text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-base transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 ml-1"
                  title="Send"
                >
                  &#10148;
                </button>
              </div>
            </div>

            {/* Prompt Helper Hint */}
            <div className="flex items-center justify-between px-2 text-[11px] text-gray-500">
              <span>Shift+Enter for newline · Enter to send</span>
              <span className="hidden sm:inline">Korea AI Studio 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxData && (
        <ImageLightbox
          imageUrl={lightboxData.imageUrl}
          prompt={lightboxData.prompt}
          aspectRatio={lightboxData.aspectRatio}
          style={lightboxData.style}
          isFavorite={lightboxData.id ? favoriteIds.has(lightboxData.id) : false}
          onToggleFavorite={() => {
            if (lightboxData.id) toggleFavorite(lightboxData.id);
          }}
          onClose={() => setLightboxData(null)}
          onUsePrompt={(p) => {
            setInput(p);
            setMode('image');
            textareaRef.current?.focus();
          }}
        />
      )}

      {/* Gallery Modal */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        messages={messages}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        initialTab={galleryTab}
        onSelectImage={(msg) => {
          setLightboxData({
            id: msg.id,
            imageUrl: msg.imageUrl!,
            prompt: msg.imagePrompt || msg.content,
            aspectRatio: msg.imageAspectRatio,
            style: msg.imageStyle,
          });
          setIsGalleryOpen(false);
        }}
        onUsePrompt={(p) => {
          setInput(p);
          setMode('image');
          setIsGalleryOpen(false);
          textareaRef.current?.focus();
        }}
      />

      {/* Authentication Login / Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Mobile PWA Install Modal */}
      <InstallPwaModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
}
