import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const FloatingChat = () => {
  const { messages, sendMessage, isConnected } = useChat();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() && user) {
      sendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };

  if (!user) return null;

  return (
    <div className="floating-chat">
      {/* Chat Button */}
      <button
        className="floating-chat-button"
        onClick={() => setIsOpen(!isOpen)}
        title="پیام‌رسان"
      >
        <i className="fas fa-comments"></i>
        {messages.length > 0 && (
          <span className="chat-badge">{messages.length}</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="floating-chat-window">
          <div className="chat-header">
            <h6 className="mb-0">
              <i className="fas fa-comments me-2"></i>
              پیام‌رسان
            </h6>
            <div className="chat-actions">
              <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                <i className={`fas fa-circle ${isConnected ? 'text-success' : 'text-danger'}`}></i>
              </span>
              <button
                className="btn btn-sm btn-link text-muted"
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="fas fa-comments fa-2x mb-2"></i>
                <p>هنوز پیامی ارسال نشده است</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.user === user.name ? 'own' : 'other'}`}
                >
                  <div className="message-content">
                    <div className="message-text">{msg.text}</div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="chat-input">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="پیام خود را بنویسید..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isConnected}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!message.trim() || !isConnected}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FloatingChat; 