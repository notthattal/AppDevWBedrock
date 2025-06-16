import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import './Chatbot.css';

function stripMarkdownFences(text) {
  return text
    .replace(/```(?:\w+)?\n?/g, '') 
    .replace(/\n?```/g, '');
}

export default function Chatbot({ user, signOut }) {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: `Hey there, I'm CharacterBot! Let me know which of your favorite movie or tv charcters you'd like to speak with!`, 
      isBot: true, 
      timestamp: new Date() 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get authentication token on component mount
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();
        setAuthToken(token);
        setIsConnected(true);
      } catch (error) {
        console.error('Error getting auth token:', error);
        setIsConnected(false);
      }
    };

    if (user) {
      getAuthToken();
    }
  }, [user]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !authToken) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
 
    try {
      // Refresh token if needed
      let currentToken = authToken;
      try {
        const session = await Auth.currentSession();
        currentToken = session.getIdToken().getJwtToken();
        setAuthToken(currentToken);
      } catch (refreshError) {
        console.warn('Token refresh failed, using existing token');
      }

      const response = await fetch('http://localhost:5050/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: inputText
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw response:', data);
      
      const botMessage = {
        id: Date.now() + 1,
        text: stripMarkdownFences(data.completion),
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsConnected(true);
    } catch (error) {
      console.error('Error:', error);
      setIsConnected(false);
      
      let errorText = "Sorry, I'm having trouble connecting to the server";
      if (error.message.includes('Authentication')) {
        errorText = "Authentication error. Please try signing out and back in.";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        isBot: true,
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-wrapper">
        
        {/* Header */}
        <div className="chat-header">
          <div className="header-content">
            <div className="header-left">
              <div className="bot-avatar">
                <Bot className="bot-icon" />
              </div>
              <div className="header-info">
                <h1 className="chat-title">CharacterBot</h1>
                <div className="status-indicator">
                  <div className={`status-dot ${isConnected && authToken ? 'connected' : 'disconnected'}`}></div>
                  <span className="status-text">
                    {isConnected && authToken ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            <div className="header-right">
              <div className="user-info">
                <button onClick={handleSignOut} className="sign-out-button" title="Sign Out">
                  <LogOut className="sign-out-icon" />
                </button>
              </div>
              <div className="powered-by">
                Powered by Amazon Nova
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}
            >
              {message.isBot && (
                <div className="message-avatar bot-avatar-small">
                  <Bot className="avatar-icon" />
                </div>
              )}
              
              <div className="message-content">
                <div className={`message-bubble ${message.isBot ? (message.isError ? 'error-bubble' : 'bot-bubble') : 'user-bubble'}`}>
                    <ReactMarkdown className="message-text">{message.text}</ReactMarkdown>
                </div>
                <div className="message-timestamp">
                  {formatTime(message.timestamp)}
                </div>
              </div>

              {!message.isBot && (
                <div className="message-avatar user-avatar-small">
                  <User className="avatar-icon" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot-message">
              <div className="message-avatar bot-avatar-small">
                <Bot className="avatar-icon" />
              </div>
              <div className="message-content">
                <div className="message-bubble bot-bubble loading-bubble">
                  <div className="loading-content">
                    <Loader2 className="loading-spinner" />
                    <span className="loading-text">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={authToken ? "Type your message here..." : "Authenticating..."}
              className="message-input"
              rows="1"
              disabled={isLoading || !authToken}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading || !authToken}
              className="send-button"
            >
              {isLoading ? (
                <Loader2 className="button-icon spinning" />
              ) : (
                <Send className="button-icon" />
              )}
            </button>
          </div>
          <div className="input-hint">
            Press Enter to send • Shift+Enter for new line
            {!authToken && " • Waiting for authentication..."}
          </div>
        </div>
      </div>
    </div>
  );
}