import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

interface ReadyResponse {
  type: 'voice' | 'text';
  message?: string;
  text?: string;
  audio?: any;
  timestamp: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const addMessage = (content: string, type: 'user' | 'assistant', isVoice = false) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      isVoice
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendToReaddy = async (message: string, type: 'text' | 'voice', audioData?: string) => {
    setIsLoading(true);
    try {
      const payload = {
        type,
        message: type === 'text' ? message : undefined,
        audio: type === 'voice' ? audioData : undefined
      };

      const response = await fetch('http://localhost:5678/webhook/readdy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ReadyResponse = await response.json();
      const responseText = data.message || data.text || 'I received your message but couldn\'t generate a response.';
      
      addMessage(responseText, 'assistant', data.type === 'voice');

      // Play audio response if available
      if (data.type === 'voice' && data.audio) {
        playAudioResponse(data.audio);
      }

    } catch (error) {
      console.error('Error communicating with Readdy:', error);
      addMessage('Sorry, I\'m having trouble connecting to the server right now. Please try again.', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudioResponse = (audioData: any) => {
    try {
      setIsSpeaking(true);
      // Convert audio data to playable format
      const audio = new Audio();
      if (typeof audioData === 'string') {
        audio.src = `data:audio/mpeg;base64,${audioData}`;
      } else {
        audio.src = URL.createObjectURL(new Blob([audioData], { type: 'audio/mpeg' }));
      }
      
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      const message = inputText.trim();
      addMessage(message, 'user');
      setInputText('');
      sendToReaddy(message, 'text');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioBase64 = await blobToBase64(audioBlob);
        
        addMessage('🎤 Voice message sent', 'user', true);
        sendToReaddy('', 'voice', audioBase64);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="flex flex-col h-96 max-w-md mx-auto bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h3 className="font-semibold flex items-center gap-2">
          🤖 Readdy - Your Bus Assistant
          {isSpeaking && <Volume2 className="w-4 h-4 animate-pulse" />}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>👋 Hi! I'm Readdy, your bus information assistant.</p>
            <p className="text-sm mt-2">Ask me about schedules, routes, or delays!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {message.isVoice && <Volume2 className="w-3 h-3 opacity-70" />}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleTextSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message or use voice..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isRecording}
          />
          
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || isRecording}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
          {isRecording && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Recording... Click mic to stop
            </span>
          )}
          {!isRecording && !isLoading && (
            <span>💬 Text or 🎤 Voice - I understand both!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
