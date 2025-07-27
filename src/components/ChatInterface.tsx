import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, ChatSession } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { VoiceInput } from './VoiceInput';
import { Send, Loader2, MessageSquarePlus } from 'lucide-react';
import { groqService } from '../services/groqService';
import { chatService } from '../services/chatService';
import { User } from 'firebase/auth';
import toast from 'react-hot-toast';

interface ChatInterfaceProps {
  user: User;
  currentSession: ChatSession | null;
  onToggleSidebar: () => void;
  setActiveSessionId: (id: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  user,
  currentSession,
  onToggleSidebar,
  setActiveSessionId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Track if this is the initial load of a new chat
  const isNewChatRef = useRef(true);

  useEffect(() => {
    // Only scroll to bottom if there are messages or if this is not a new chat
    if (messages.length > 0 || !isNewChatRef.current) {
      scrollToBottom();
    }
    
    // Update the ref after the first render
    if (isNewChatRef.current && messages.length === 0) {
      isNewChatRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (currentSession) {
      console.log('Current session updated:', {
        id: currentSession.id,
        title: currentSession.title,
        messageCount: currentSession.messages?.length || 0
      });
      setMessages(currentSession.messages || []);
    } else {
      console.log('Current session cleared');
      setMessages([]);
    }
    
    // Reset the new chat ref when switching sessions
    isNewChatRef.current = !currentSession;
  }, [currentSession]);

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const sendMessage = useCallback(async (content: string, isVoice = false) => {
    if (!content.trim() || !user) return;

    setIsLoading(true);
    setInputValue('');

    let activeSessionId = currentSession?.id;

    const userMessage: Message = {
      id: generateMessageId(),
      content: content.trim(),
      sender: 'user',
      timestamp: Date.now(),
      isVoice: isVoice,
    };

    // If it's a new chat (no current session), create it first
    if (!activeSessionId) {
      try {
        const newSessionId = await chatService.createChatSession(user.uid, content.trim());
        activeSessionId = newSessionId;
        // App.tsx will see the new session and update the state, passing the new session object down.
        // We will proceed with the new ID.
      } catch (error) {
        console.error('Failed to create new chat session:', error);
        toast.error('Could not start a new chat. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // At this point, we must have a session ID.
    if (!activeSessionId) {
        toast.error('Could not determine the chat session. Please refresh.');
        setIsLoading(false);
        return;
    }

    setMessages(prev => [...prev, userMessage]);

    try {
      // Save user message
      await chatService.addMessage(activeSessionId, userMessage);

      // If this is the first message in a new chat (with default "New Chat" title), update the title
      if (currentSession && currentSession.title === 'New Chat' && messages.length === 0) {
        const firstMessageContent = content.trim();
        console.log('Updating chat title for first message:', firstMessageContent);
        
        try {
          // Generate a short, relevant title based on the first message
          const newTitle = await groqService.generateChatTitle(firstMessageContent);
          console.log('Generated new title:', newTitle);
          
          if (newTitle && newTitle !== 'New Chat') {
            // Update the title in Firestore
            await chatService.updateChatTitle(activeSessionId, newTitle);
            console.log('Chat title updated successfully');
            
            // Force a refresh of the current session by toggling the key
            // This will make the component re-render with the updated title
            const currentId = activeSessionId;
            setActiveSessionId('');
            setTimeout(() => setActiveSessionId(currentId), 0);
          }
        } catch (titleError) {
          console.error('Failed to update chat title:', titleError);
          // Continue even if title update fails
        }
      }

      // Get AI response
      const aiResponse = await groqService.sendMessage(content.trim(), user.uid, activeSessionId);
      const aiMessage: Message = {
        id: generateMessageId(),
        content: aiResponse,
        sender: 'ai',
        timestamp: Date.now(),
      };

      // Display AI response and save it
      setMessages(prev => [...prev, aiMessage]);
      await chatService.addMessage(activeSessionId, aiMessage);

    } catch (error) {
      console.error('Error in chat flow:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Error: ${errorMessage}`);
      const errorMsg: Message = {
        id: generateMessageId(),
        content: `Sorry, I encountered an error: ${errorMessage}`,
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentSession]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleVoiceTranscript = useCallback((transcript: string, isVoice: boolean) => {
    console.log('Received voice transcript:', transcript, 'isVoice:', isVoice);
    // Always set isVoice to true for voice transcripts
    sendMessage(transcript, true);
  }, [sendMessage]);

  // Determine if this is a new chat (no current session)
  const isNewChat = !currentSession;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 w-full">
      {/* Header */}
      <div className="sticky top-0 z-10 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center h-14 px-6">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            CopBot
          </h1>
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 w-full">
        {isNewChat && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center max-w-4xl mx-auto">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
              <MessageSquarePlus className="w-10 h-10 text-blue-600 dark:text-blue-300" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How can I help you today?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
              Ask me anything about police procedures, laws, or citizen services.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              {[
                'How to file a police complaint?',
                'What are my rights during a traffic stop?',
                'How to get a police clearance certificate?',
                'What to do in case of a road accident?'
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInputValue(suggestion)}
                  className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-gray-500 dark:text-gray-400 animate-spin" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-5xl mx-auto w-full px-4">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message CopBot..."
                className="w-full p-4 pr-14 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                rows={1}
                style={{ minHeight: '60px', maxHeight: '200px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute bottom-3 right-3 p-2 rounded-md text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <VoiceInput onTranscript={handleVoiceTranscript} />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                CopBot may produce inaccurate information. Verify important details.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};