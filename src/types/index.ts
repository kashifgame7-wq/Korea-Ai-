export type MessageSender = 'user' | 'ai';
export type MessageMode = 'chat' | 'image';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  mode?: MessageMode;
  imageUrl?: string;
  imagePrompt?: string;
  imageAspectRatio?: string;
  imageStyle?: string;
  isFavorite?: boolean;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ImageStyleOption {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  badge: string;
}

export interface AspectRatioOption {
  id: string;
  label: string;
  ratio: string;
  width: number;
  height: number;
  iconName: string;
}
