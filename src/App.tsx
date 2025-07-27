
import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthForm from './components/AuthForm';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatInterface } from './components/ChatInterface.tsx';
import ThemeToggle from './components/ThemeToggle';
import { chatService } from './services/chatService';
import { ChatSession } from './types/chat';

const AppContent: React.FC = () => {
  const { user, loading: authIsLoading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleNewChat = useCallback(async () => {
    // Create a new chat session immediately with 'New Chat' as the initial title
    try {
      const tempSessionId = await chatService.createChatSession(user?.uid || '');
      setCurrentSessionId(tempSessionId);
    } catch (error) {
      console.error('Failed to create new chat session:', error);
      toast.error('Could not create a new chat. Please try again.');
    }
  }, [user]);

  useEffect(() => {
    if (user && !authIsLoading) {
      const unsubscribe = chatService.subscribeToChatSessions(user.uid, (sessions) => {
        setChatSessions(sessions);
        if (sessions.length > 0) {
          if (!sessions.some(s => s.id === currentSessionId)) {
            setCurrentSessionId(sessions[0].id);
          }
        } else {
          // If user has no sessions, set to new chat mode.
          setCurrentSessionId(null);
        }
      });
      return () => unsubscribe();
    } else if (!user && !authIsLoading) {
      // Clear state on logout
      setChatSessions([]);
      setCurrentSessionId(null);
    }
  }, [user, authIsLoading, currentSessionId, handleNewChat]);

  const handleSelectChat = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleDeleteChat = async (sessionId: string) => {
    if (chatSessions.length <= 1) {
      toast.error("You can't delete the last chat.");
      return;
    }
    try {
      await chatService.deleteChat(sessionId);
      // The useEffect will handle resetting the currentSessionId
      toast.success('Chat deleted.');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat.');
    }
  };

  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div>Loading...</div>
      </div>
    );
  }

  const currentSession = chatSessions.find(s => s.id === currentSessionId) || null;

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Toaster position="top-center" />
      {user ? (
        <>
          <Sidebar
            user={user}
            chatSessions={chatSessions}
            onNewChat={handleNewChat}
            onSwitchSession={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            currentSessionId={currentSessionId}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            onSignOut={logout}
          />
          <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`} style={isSidebarOpen ? { marginLeft: '16rem' } : { marginLeft: '4rem' }}>
            <div className="w-full max-w-6xl mx-auto h-full flex flex-col px-4">
              <div className="flex justify-end p-4">
                <ThemeToggle />
              </div>
              <ChatInterface
                key={currentSessionId || 'new-chat'}
                user={user}
                currentSession={currentSession}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                setActiveSessionId={setCurrentSessionId}
              />
            </div>
          </main>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <AuthForm isSignUp={isSignUp} setIsSignUp={setIsSignUp} />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;