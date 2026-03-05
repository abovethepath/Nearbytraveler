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
  "How do I create an event?",
  "Can I share a Meetup or Couchsurfing event?",
  "What should I do after planning a trip?",
  "How do I create a Let's Meet Now?",
  "How do I find travelers in my city?"
];

const PREBUILT_ANSWERS: Record<string, string> = {
  "How do I create an event?": "Go to the Events tab and tap the '+' button. You can create events two ways: 1) Type in the details manually, or 2) Use AI Quick Create with voice input - just speak your event idea like 'hiking at Runyon Canyon Saturday at 9am'. Fill in title, description, date, time, and meeting point. Pro tip: Be specific about the meeting point so people can find you!",
  
  "Can I share a Meetup or Couchsurfing event?": "Yes! We made this super easy. When creating an event, look for the 'Import from URL' option. Just paste the link from Meetup.com, Couchsurfing, Eventbrite, or any event page - we'll automatically pull in the title, description, date, time, and location. Review the details and post!",
  
  "What should I do after planning a trip?": "Great question! After adding your trip dates and destination: 1) Go to the Match in City page for your destination, 2) Check off city-specific interests and activities you want to do there, 3) Use the 'Add Your Own' tab to add custom activities, 4) Browse who else will be there during your dates, 5) Send connection requests to people with matching interests!",
  
  "How do I create a Let's Meet Now?": "Go to the 'Let's Meet Now' tab in the navigation. Tap '+' to post a spontaneous meetup. Be SUPER SPECIFIC about where you are - include venue name, street, what you're wearing. Example: 'I'm at Blue Bottle Coffee on Abbot Kinney, patio table, blue jacket, here for 2 hours.' The expiration is how long YOU'LL be there - your availability window.",
  
  "How do I find travelers in my city?": "Go to the Discover page and select your city. You'll see travelers visiting or planning to visit. Use Advanced Search to filter by interests, age, dates, and more. People with matching interests appear at the top! You can also check the Match in City page for more detailed matching."
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
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = (navigator.userAgent || '').toLowerCase();
    const uaMobile =
      ua.includes('mobi') ||
      ua.includes('android') ||
      ua.includes('iphone') ||
      ua.includes('ipad') ||
      ua.includes('ipod');
    const coarsePointer =
      !!window.matchMedia &&
      (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches);
    const smallViewport = !!window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    return uaMobile || coarsePointer || smallViewport;
  });

  // Hide on landing/public pages - chatbot is for logged-in users only
  const landingPaths = ['/', '/landing', '/landing-new', '/locals-landing', '/travelers-landing', '/events-landing', '/business-landing', '/couchsurfing', '/cs', '/networking-landing', '/signup', '/signin', '/auth', '/join', '/launching-soon', '/about', '/privacy', '/terms', '/cookies', '/support', '/ambassador-program', '/forgot-password', '/reset-password', '/welcome', '/welcome-business', '/b', '/preview-landing', '/preview-first-landing', '/getting-started', '/quick-login'];
  const isLandingPage = landingPaths.includes(location);
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

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mqSmall = window.matchMedia('(max-width: 768px)');
    const mqCoarse = window.matchMedia('(pointer: coarse)');
    const mqHoverNone = window.matchMedia('(hover: none)');
    const update = () => {
      const ua = (navigator.userAgent || '').toLowerCase();
      const uaMobile =
        ua.includes('mobi') ||
        ua.includes('android') ||
        ua.includes('iphone') ||
        ua.includes('ipad') ||
        ua.includes('ipod');
      const coarsePointer = !!mqCoarse.matches || !!mqHoverNone.matches;
      const smallViewport = !!mqSmall.matches;
      setIsMobileViewport(uaMobile || coarsePointer || smallViewport);
    };
    update();
    mqSmall.addEventListener?.('change', update);
    mqCoarse.addEventListener?.('change', update);
    mqHoverNone.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      mqSmall.removeEventListener?.('change', update);
      mqCoarse.removeEventListener?.('change', update);
      mqHoverNone.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // Early return AFTER all hooks
  if (isMobileViewport || isMessagePage || isLandingPage) return null;

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

  const floatingStyle = {
    right: 'calc(env(safe-area-inset-right, 0px) + 16px)',
    // 60px = MobileBottomNav height; 44px = breathing room above it.
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 104px)',
  } as any;

  return (
    <div>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-[9999] h-11 w-11 md:h-14 md:w-14 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#F97316] text-white shadow-[0_12px_28px_rgba(0,0,0,0.28)] dark:shadow-[0_14px_34px_rgba(0,0,0,0.55)] ring-1 ring-white/10 hover:shadow-[0_16px_34px_rgba(0,0,0,0.33)] transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={floatingStyle}
          aria-label="Open help chat"
        >
          <MessageCircleQuestion className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>
      )}

      {isOpen && (
        <>
        <div 
          className="fixed inset-0 z-[9998] bg-black/95"
          onClick={() => setIsOpen(false)}
        />
        <div 
          className="fixed z-[9999] w-[360px] max-w-[calc(100vw-32px)] h-[420px] md:h-[480px] max-h-[calc(100dvh-190px)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-300 dark:border-gray-600 flex flex-col overflow-hidden"
          style={{ ...floatingStyle, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-gradient-to-r from-[#FF6B35] to-[#F97316] px-4 py-3 flex items-center justify-between">
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
        </>
      )}
    </div>
  );
}
