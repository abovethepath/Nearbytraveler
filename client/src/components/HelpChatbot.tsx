import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MessageCircleQuestion, X, Send, Loader2, Sparkles, Mic, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "How do I create a quick meetup?",
  "What's the voice input feature?",
  "How do I find travelers in my city?",
  "Tell me about city chatrooms",
  "How do I earn Ambassador Points?"
];

const PREBUILT_ANSWERS: Record<string, string> = {
  "How do I create a quick meetup?": "Creating a quick meetup is easy! Go to the Quick Meetups section from your home page or navigation menu. Tap the '+' button, then either type a description like 'coffee at the pier in 2 hours' or use the voice input feature to speak your meetup idea. The AI will automatically fill in the details for you - just review and post!",
  
  "What's the voice input feature?": "The voice input feature lets you create meetups by speaking naturally! Just tap the microphone icon when creating a quick meetup, then say something like 'Let's grab tacos at the food truck near the beach at 6pm.' The AI understands natural language and converts your words into a structured meetup with title, location, time, and notes.",
  
  "How do I find travelers in my city?": "To find travelers visiting your city, go to the Discover page and select your city. You'll see a list of travelers who are currently visiting or planning to visit. You can also use the Advanced Search to filter by interests, age, and more. Travelers with matching interests will appear at the top!",
  
  "Tell me about city chatrooms": "City chatrooms are group chats for everyone in a specific city! Each city has its own chatroom where locals and travelers can connect, share tips, and plan meetups. Find chatrooms in the Chatrooms tab - you'll automatically be added to your hometown chatroom and any city you're traveling to.",
  
  "How do I earn Ambassador Points?": "You earn Ambassador Points by being active on the platform! Create events and meetups (+10 points), invite friends who sign up (+25 points), get connections (+5 points), and participate in chatrooms (+2 points per message, up to 20/day). Check your points on your profile - top ambassadors get special recognition!"
};

export function HelpChatbot() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide on message/chat pages to avoid blocking input
  const isMessagePage = location.startsWith('/messages') || location.startsWith('/chatroom');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Early return AFTER all hooks
  if (isMessagePage) return null;

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: messageText.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      const response = await apiRequest(
        'POST',
        '/api/ai/help-chat',
        {
          message: messageText.trim(),
          conversationHistory: messages // Pass previous messages only (current message sent separately)
        }
      );

      const data = await response.json();
      
      if (data.response) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: "Sorry, I couldn't process that. Please try again!" 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (question: string) => {
    const prebuiltAnswer = PREBUILT_ANSWERS[question];
    if (prebuiltAnswer) {
      const userMessage: ChatMessage = { role: 'user', content: question };
      const assistantMessage: ChatMessage = { role: 'assistant', content: prebuiltAnswer };
      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setShowSuggestions(false);
    } else {
      sendMessage(question);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[9999] w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          aria-label="Open help chat"
        >
          <MessageCircleQuestion className="w-6 h-6 md:w-7 md:h-7" />
        </button>
      )}

      {isOpen && (
        <div 
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[9999] w-[360px] max-w-[calc(100vw-32px)] h-[450px] md:h-[500px] max-h-[calc(100vh-140px)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        >
          <div className="bg-gradient-to-r from-blue-500 to-orange-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="font-semibold text-white">Nearby Helper</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-white/80 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && showSuggestions && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">Hi! I'm your Nearby Helper</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ask me anything about the platform! I can help with features like voice-powered meetups, events, chatrooms, and more.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Try asking:</p>
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(question)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <Mic className="w-4 h-4" />
                    <span className="text-xs font-medium">Pro tip: Try our voice features!</span>
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Create meetups & events by just speaking - tap the 🎤 icon!
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about features..."
                className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
