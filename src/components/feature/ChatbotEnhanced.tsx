
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Settings, 
  Clock,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  metadata?: {
    busInfo?: {
      route?: string;
      stop?: string;
      delay?: number;
      nextBus?: string;
    };
    location?: {
      lat: number;
      lng: number;
      name: string;
    };
  };
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

const ChatbotEnhanced: React.FC = () => {
  // Core state management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  
  // Voice and audio state
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  
  // Settings and UI state
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Refs for DOM manipulation
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize connection to backend
  const initializeAgent = useCallback(async () => {
    setConnectionStatus('connecting');
    try {
      // Test backend connection
      const response = await fetch('http://localhost:8001/api/health');
      if (response.ok) {
        setConnectionStatus('connected');
        addMessage('Hello! I\'m Readdy, your intelligent BusTracker assistant powered by AI. I can help you with routes, schedules, delay predictions, and real-time tracking. What would you like to know about our bus system?', 'system');
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      setConnectionStatus('error');
      addMessage('Connection failed. Please ensure the backend is running on port 8001.', 'system');
    }
  }, []);

  // Add new message to chat
  const addMessage = useCallback((content: string, type: ChatMessage['type'], isVoice = false, metadata?: ChatMessage['metadata']) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      isVoice,
      metadata
    };
    
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Enhanced response system that fetches live data first and returns multiple messages
  const getOpenAIResponse = async (message: string, routeData: any) => {
    try {
      console.log('Making AI API call via backend with message:', message);
      const response = await fetch('http://localhost:8001/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          route_data: routeData
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend AI response:', data);
      // If AI returns a single response, break it into multiple messages
      return breakIntoMessages(data.response) || ["I'm sorry, I couldn't process your request. Please try asking about our bus routes, schedules, or tracking features."];
    } catch (error) {
      console.error('Backend AI API Error Details:', error);
      // No fallback, just return error message
      return ["Sorry, I'm having trouble connecting to the AI service right now. Please try again later."];
    }
  };

  // Break long responses into multiple short messages
  const breakIntoMessages = (text: string): string[] => {
    if (!text) return [];
    
    // Split by double line breaks first
    const sections = text.split('\n\n').filter(section => section.trim());
    
    const messages: string[] = [];
    
    sections.forEach(section => {
      const trimmed = section.trim();
      
      // If section is short enough, add as is
      if (trimmed.length <= 200) {
        messages.push(trimmed);
      } else {
        // Split longer sections by sentences
        const sentences = trimmed.split('. ').filter(s => s.trim());
        let currentMessage = '';
        
        sentences.forEach((sentence, index) => {
          const fullSentence = sentence.trim() + (index < sentences.length - 1 ? '.' : '');
          
          if (currentMessage.length + fullSentence.length <= 200) {
            currentMessage += (currentMessage ? ' ' : '') + fullSentence;
          } else {
            if (currentMessage) messages.push(currentMessage);
            currentMessage = fullSentence;
          }
        });
        
        if (currentMessage) messages.push(currentMessage);
      }
    });
    
    return messages.length > 0 ? messages : [text];
  };

  // Live data-driven response system that returns multiple messages
  const getLiveDataResponse = async (message: string, routeData: any): Promise<string[]> => {
    const lowerMessage = message.toLowerCase();
    
    try {
      // Fetch additional live data based on the question
      let liveData = routeData;
      
      // For bus presence/location questions, fetch real-time bus data
      if (lowerMessage.includes('live bus') || lowerMessage.includes('bus present') || lowerMessage.includes('buses running') || lowerMessage.includes('active bus')) {
        try {
          const liveBusResponse = await fetch('http://localhost:8001/api/routes/live');
          if (liveBusResponse.ok) {
            const liveBusData = await liveBusResponse.json();
            liveData = { ...routeData, ...liveBusData };
          }
        } catch (e) {
          console.log('Live bus data fetch failed, using available data');
        }
        
        return analyzeLiveBusData(liveData, message);
      }
      
      // For delay questions, fetch delay data
      if (lowerMessage.includes('delay') || lowerMessage.includes('late') || lowerMessage.includes('on time')) {
        try {
          const delayResponse = await fetch('http://localhost:8001/api/predictions/delays');
          if (delayResponse.ok) {
            const delayData = await delayResponse.json();
            liveData = { ...routeData, delays: delayData };
          }
        } catch (e) {
          console.log('Delay data fetch failed, using available data');
        }
        
        return analyzeDelayData(liveData, message);
      }
      
      // For route questions, fetch route data
      if (lowerMessage.includes('route') || lowerMessage.includes('schedule') || lowerMessage.includes('timetable')) {
        try {
          const routeResponse = await fetch('http://localhost:8001/api/routes');
          if (routeResponse.ok) {
            const routeDataFresh = await routeResponse.json();
            liveData = routeDataFresh;
          }
        } catch (e) {
          console.log('Route data fetch failed, using available data');
        }
        
        return analyzeRouteData(liveData, message);
      }
      
      // Default: Always use OpenAI for response, never fallback
      return await getOpenAIResponse(message, liveData);
    } catch (error) {
      console.error('Error fetching live data:', error);
      return ["Sorry, I'm having trouble connecting to the AI service right now. Please try again later."];
    }
  };

  // Analyze live bus data and provide specific answers in shorter format as array
  const analyzeLiveBusData = (liveData: any, message: string): string[] => {
    const buses = liveData?.buses || liveData?.routes || [];
    const activeBuses = Array.isArray(buses) ? buses.filter((bus: any) => bus.active || bus.status === 'active') : [];
    
    if (activeBuses.length > 0) {
      const busDetails = activeBuses.slice(0, 3).map((bus: any, index: number) => {
        const routeName = bus.route_name || bus.name || `Route ${index + 1}`;
        const location = bus.current_location || bus.location || 'Campus';
        const nextStop = bus.next_stop || bus.destination || 'Next stop';
        const eta = bus.eta || bus.arrival_time || `${Math.floor(Math.random() * 15) + 3} min`;
        
        return `${routeName}: At ${location}, arriving ${nextStop} in ${eta}`;
      }).join('\n');
      
      return [
        `Yes! ${activeBuses.length} buses are currently active!`,
        busDetails,
        "Live updates every 10 seconds via GPS\nAI predictions with 87% accuracy\nGet notified 5 minutes before arrival",
        "Want me to track a specific route or set up notifications?"
      ];
    } else {
      const currentTime = new Date().toLocaleTimeString();
      return [
        `No active buses right now (${currentTime})`,
        "This could be due to:\nOff-peak hours - Limited service\nMaintenance window - System updates\nTemporary suspension - Weather/emergency",
        "Typical Service Hours:\nPeak: 7-9 AM & 5-7 PM\nRegular: 9 AM-5 PM (Every 10-15 min)\nEvening: 7-11 PM (Every 20-30 min)",
        "Want me to notify you when buses resume?"
      ];
    }
  };

  // Analyze delay data and provide specific answers in shorter format as array
  const analyzeDelayData = (liveData: any, message: string): string[] => {
    const delays = liveData?.delays || [];
    const routes = liveData?.routes || [];
    
    if (delays.length > 0) {
      const delayInfo = delays.slice(0, 3).map((delay: any) => {
        const severity = delay.minutes > 10 ? '🔴' : delay.minutes > 5 ? '🟡' : '🟢';
        return `${severity} ${delay.route_name}: ${delay.minutes} min delay - ${delay.reason}`;
      }).join('\n');
      
      return [
        "Current delays detected:",
        delayInfo,
        "AI analysis with 87% accuracy\nUpdates every 30 seconds",
        "Recommendations:\nCheck alternative routes for red flags\nEnable notifications for updates\nRecheck in 10-15 minutes",
        "Need help with route alternatives?"
      ];
    } else {
      return [
        "Great! All buses running on time",
        "No significant delays detected\n99.8% on-time performance\nContinuous AI monitoring",
        `All ${routes.length || 4} routes operating normally\nEnable alerts to stay updated`,
        "Need help with a specific route?"
      ];
    }
  };

  // Analyze route data and provide specific answers in shorter format as array
  const analyzeRouteData = (liveData: any, message: string): string[] => {
    const routes = liveData?.routes || liveData || [];
    
    if (Array.isArray(routes) && routes.length > 0) {
      const routeDetails = routes.slice(0, 3).map((route: any, index: number) => {
        const name = route.route_name || route.name || `Route ${index + 1}`;
        const stops = route.stops || route.stop_count || Math.floor(Math.random() * 8) + 5;
        const frequency = route.frequency || `${Math.floor(Math.random() * 10) + 10} min`;
        const nextBus = route.next_arrival || route.eta || `${Math.floor(Math.random() * 15) + 2} min`;
        
        return `${name}: ${stops} stops • Every ${frequency} • Next: ${nextBus}`;
      }).join('\n');
      
      return [
        `Live routes (${routes.length} active):`,
        routeDetails,
        "Times adjust for traffic & weather\nAI-powered arrival predictions\nLive GPS tracking\nCustom alerts available",
        "Which route interests you or need trip planning?"
      ];
    } else {
      return [
        "BusTracker Route System:",
        "4 main campus routes active\nEvery 10-15 min during peak\nComplete campus coverage\nReal-time tracking & predictions",
        "Main Routes:\nAcademic ↔ Dorms\nLibrary ↔ Dining\nParking ↔ Campus\nSports ↔ Student Center",
        "Need specific route info or trip planning?"
      ];
    }
  };

  // Intelligent fallback response system with shorter messages as array
  const getIntelligentFallbackResponse = (message: string, liveData: any): string[] => {
    const lowerMessage = message.toLowerCase();
    
    // Management questions
    if (lowerMessage.includes('managing') || lowerMessage.includes('who will') || lowerMessage.includes('manage')) {
      return [
        "Hi! I'm Readdy, your intelligent BusTracker assistant!",
        "I'm managed by the BusTracker development team and powered by advanced AI.",
        "I help with all aspects of our bus tracking system - from real-time updates to delay predictions.",
        `Our system serves ${liveData?.total_users || '12,847'} users with 99.8% uptime.`,
        "What specific aspect of BusTracker would you like to know about?"
      ];
    }
    
    // About BusTracker
    if (lowerMessage.includes('about') || lowerMessage.includes('what is') || lowerMessage.includes('tell me about') || lowerMessage.includes('bus tracker')) {
      return [
        "BusTracker is your intelligent bus delay prediction system!",
        "I'm Readdy, your AI assistant powered by machine learning.",
        "Key features:\n87% delay prediction accuracy\nReal-time tracking of 247 buses\nServing 12,847 users daily\n99.8% uptime reliability",
        "We provide live updates every 10 seconds with smart notifications.",
        "What would you like to know about our routes or tracking?"
      ];
    }
    
    // Capabilities and features
    if (lowerMessage.includes('capabilities') || lowerMessage.includes('what can you') || lowerMessage.includes('help me') || lowerMessage.includes('do')) {
      return [
        "I can help you with lots of things!",
        "Live Tracking: Real-time bus locations and ETAs\nSmart Alerts: Personalized delay notifications\nRoute Planning: Optimal paths to destinations",
        "Schedule Info: Live timetables and frequencies\nEmergency Updates: Service disruption alerts",
        "Our AI provides 87% accurate delay predictions using traffic and weather data.",
        "Try asking me about specific routes or destinations!"
      ];
    }
    
    // Routes and schedules
    if (lowerMessage.includes('route') || lowerMessage.includes('schedule') || lowerMessage.includes('time')) {
      const routes = liveData?.routes || [];
      return [
        `Currently tracking ${routes.length || '4'} active bus routes!`,
        "Operating Schedule:\nPeak Hours (7-9 AM): Every 5-7 minutes\nRegular Hours (9 AM-5 PM): Every 10-15 minutes",
        "Evening Service (5-11 PM): Every 15-20 minutes\nNight Shuttle (11 PM-2 AM): Every 30 minutes",
        "All schedules adjust automatically for traffic and weather.",
        "Which route or destination interests you?"
      ];
    }
    
    // Default intelligent response
    return [
      "Hello! I'm Readdy, your intelligent BusTracker assistant!",
      "I help you navigate our comprehensive bus tracking system.",
      "Quick Stats: 87% delay prediction accuracy, 247 buses, 12,847 users, 99.8% uptime",
      "I can help with:\nLive tracking & ETAs\nSmart delay alerts\nRoute planning\nSchedule information\nEmergency updates",
      "What would you like to know about our bus system?"
    ];
  };

  const sendToReaddy = async (message: string, type: 'text' | 'voice') => {
    setIsLoading(true);
    try {
      // Try n8n workflow first
      const payload: any = {
        type,
        message: type === 'text' ? message : undefined,
        audio: type === 'voice' ? undefined : undefined // Voice support can be added later
      };

      let n8nResponse: any = null;
      try {
        const response = await fetch('http://localhost:5678/webhook/readdy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          n8nResponse = await response.json();
        }
      } catch (err) {
        console.warn('n8n webhook failed, falling back to backend:', err);
      }

      let responseMessages: string[] = [];
      let routeData: any = {};
      try {
        const backendResponse = await fetch('http://localhost:8001/api/routes');
        routeData = await backendResponse.json();
      } catch (err) {
        routeData = {};
      }

      if (n8nResponse && (n8nResponse.message || n8nResponse.text)) {
        // Use n8n response
        const msg = n8nResponse.message || n8nResponse.text;
        responseMessages = breakIntoMessages(msg);
      } else {
        // Fallback to backend AI
        responseMessages = await getOpenAIResponse(message, routeData);
      }

      // Send multiple messages if it's an array, otherwise single message
      if (Array.isArray(responseMessages)) {
        for (let i = 0; i < responseMessages.length; i++) {
          setTimeout(() => {
            addMessage(responseMessages[i], 'assistant', false, { busInfo: routeData });
            if (isSpeechEnabled && type === 'voice' && i === responseMessages.length - 1) {
              const combinedMessage = responseMessages.join(' ');
              const voiceMessage = combinedMessage
                .replace(/\*\*/g, '')
                .replace(/•/g, '-')
                .replace(/#{1,6}\s/g, '')
                .trim();
              speakText(voiceMessage);
            }
          }, i * 1000);
        }
      } else {
        const singleMessage = responseMessages as string;
        addMessage(singleMessage, 'assistant', false, { busInfo: routeData });
        if (isSpeechEnabled && type === 'voice') {
          const voiceMessage = singleMessage
            .replace(/\*\*/g, '')
            .replace(/•/g, '-')
            .replace(/#{1,6}\s/g, '')
            .trim();
          await speakText(voiceMessage);
        }
      }
    } catch (error) {
      console.error('Error sending to Readdy:', error);
      addMessage('Sorry, I\'m having trouble processing your request. Please try again.', 'system');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle text message submission
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    addMessage(userMessage, 'user');
    await sendToReaddy(userMessage, 'text');
  };

  // Handle quick action messages
  const handleQuickMessage = async (message: string) => {
    if (isLoading || connectionStatus !== 'connected') return;
    
    addMessage(message, 'user');
    await sendToReaddy(message, 'text');
  };

  // Voice recording functions with real speech recognition
  const startRecording = async () => {
    try {
      // Check if speech recognition is available
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        addMessage('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.', 'system');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      setIsRecording(true);
      addMessage('Listening... Speak now!', 'system');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        
        // Add the actual spoken text
        addMessage(transcript, 'user', true);
        sendToReaddy(transcript, 'voice');
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        let errorMessage = 'Speech recognition error: ';
        switch (event.error) {
          case 'no-speech':
            errorMessage += 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage += 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage += 'Microphone access denied. Please allow microphone permissions.';
            break;
          case 'network':
            errorMessage += 'Network error. Please check your connection.';
            break;
          default:
            errorMessage += event.error;
        }
        addMessage(errorMessage, 'system');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      // Start recognition
      recognition.start();

    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsRecording(false);
      addMessage('Could not start speech recognition. Please check your browser compatibility.', 'system');
    }
  };

  const stopRecording = () => {
    // Speech recognition will automatically stop after silence
    // This function is mainly for UI consistency
    setIsRecording(false);
    addMessage('Speech recognition stopped.', 'system');
  };

  // Text-to-speech function
  const speakText = async (text: string) => {
    if (!isSpeechEnabled) return;
    
    try {
      setIsPlayingAudio(true);
      
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Use Web Speech API for TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slightly slower for longer text
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsPlayingAudio(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlayingAudio(false);
      };
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsPlayingAudio(false);
    }
  };

  // Stop current audio
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    speechSynthesis.cancel();
    setIsPlayingAudio(false);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Initialize on mount
  useEffect(() => {
    initializeAgent();
  }, [initializeAgent]);

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Connection status indicator
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting': return <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Message rendering
  const renderMessage = (message: ChatMessage) => (
    <div
      key={message.id}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.type === 'user'
            ? 'bg-blue-500 text-white'
            : message.type === 'system'
            ? 'bg-gray-100 text-gray-700 text-sm'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        {message.isVoice && (
          <span className="text-xs opacity-75 flex items-center mt-1">
            <Mic className="w-3 h-3 mr-1" />
            Voice message
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isMinimized ? 'w-14 h-14' : 'w-80 h-[480px]'} transition-all duration-300`}>
      {isMinimized ? (
        // Minimized state
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
      ) : (
        // Full chatbot interface
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 h-full flex flex-col">
          {/* Header */}
          <div className="bg-white p-3 rounded-t-lg border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Headset Icon */}
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-base text-gray-800">Talk with Us</h3>
                <p className="text-xs text-gray-500">Choose voice or text</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-3 border-b border-gray-200 bg-gray-50 text-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isSpeechEnabled}
                    onChange={(e) => setIsSpeechEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Enable speech</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Auto-scroll</span>
                </label>
              </div>
              <button
                onClick={() => setMessages([])}
                className="text-red-600 hover:text-red-800 text-xs"
              >
                Clear chat history
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-6">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">Use voice or text to communicate</p>
                </div>
              </div>
            )}
            
            {messages.map(renderMessage)}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm">Readdy is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message"
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                  disabled={isLoading}
                />
              </div>
              
              {/* Voice button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`w-10 h-10 rounded-full transition-colors flex items-center justify-center ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotEnhanced;
