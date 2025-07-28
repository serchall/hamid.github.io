import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const { messages, sendMessage, isConnected, onlineUsers } = useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('general');
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

  if (!user) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-lock fa-3x text-muted mb-3"></i>
        <h4>برای استفاده از پیام‌رسان باید وارد شوید</h4>
        <p className="text-muted">لطفاً ابتدا وارد حساب کاربری خود شوید</p>
      </div>
    );
  }

  return (
    <div className="chat-page fade-in">
      <div className="row h-100">
        {/* Sidebar */}
        <div className="col-md-4 col-lg-3">
          <div className="chat-sidebar h-100">
            {/* Connection Status */}
            <div className="connection-status-card p-3 mb-3">
              <div className="d-flex align-items-center">
                <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                  <i className={`fas fa-circle ${isConnected ? 'text-success' : 'text-danger'}`}></i>
                </span>
                <span className="ms-2">
                  {isConnected ? 'متصل' : 'قطع اتصال'}
                </span>
              </div>
            </div>

            {/* Online Users */}
            <div className="online-users-card p-3 mb-3">
              <h6 className="mb-3">
                <i className="fas fa-users me-2"></i>
                کاربران آنلاین ({onlineUsers.length})
              </h6>
              <div className="online-users-list">
                {onlineUsers.map((user, index) => (
                  <div key={index} className="online-user d-flex align-items-center mb-2">
                    <span className="online-indicator"></span>
                    <span className="ms-2">{user.name}</span>
                  </div>
                ))}
                {onlineUsers.length === 0 && (
                  <p className="text-muted small">هیچ کاربر آنلاینی وجود ندارد</p>
                )}
              </div>
            </div>

            {/* Chat Rooms */}
            <div className="chat-rooms-card p-3">
              <h6 className="mb-3">
                <i className="fas fa-hashtag me-2"></i>
                اتاق‌های گفتگو
              </h6>
              <div className="chat-rooms-list">
                {['general', 'support', 'off-topic'].map(room => (
                  <button
                    key={room}
                    className={`chat-room-btn ${selectedRoom === room ? 'active' : ''}`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <i className="fas fa-hashtag me-2"></i>
                    {room === 'general' ? 'عمومی' : 
                     room === 'support' ? 'پشتیبانی' : 'متفرقه'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-md-8 col-lg-9">
          <div className="chat-area h-100">
            {/* Chat Header */}
            <div className="chat-header p-3">
              <h5 className="mb-0">
                <i className="fas fa-hashtag me-2"></i>
                {selectedRoom === 'general' ? 'عمومی' : 
                 selectedRoom === 'support' ? 'پشتیبانی' : 'متفرقه'}
              </h5>
            </div>

            {/* Messages */}
            <div className="chat-messages p-3">
              {messages.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-comments fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">هنوز پیامی ارسال نشده است</h5>
                  <p className="text-muted">اولین پیام را ارسال کنید!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.user === user.name ? 'own' : 'other'} mb-3`}
                  >
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-user">{msg.user}</span>
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="message-text">{msg.text}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="chat-input p-3">
              <form onSubmit={handleSend}>
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
          </div>
        </div>
      </div>

      <style jsx>{`
        .chat-page {
          height: calc(100vh - 200px);
        }
        
        .chat-sidebar {
          background: var(--bg-primary);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
        }
        
        .chat-area {
          background: var(--bg-primary);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }
        
        .connection-status-card,
        .online-users-card,
        .chat-rooms-card {
          background: var(--bg-secondary);
          border-radius: var(--border-radius);
          border: 1px solid var(--border-color);
        }
        
        .status-indicator {
          font-size: 0.75rem;
        }
        
        .online-indicator {
          width: 8px;
          height: 8px;
          background: var(--success-color);
          border-radius: 50%;
          display: inline-block;
        }
        
        .chat-room-btn {
          width: 100%;
          text-align: right;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          background: none;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          color: var(--text-primary);
          transition: var(--transition);
        }
        
        .chat-room-btn:hover,
        .chat-room-btn.active {
          background: var(--primary-color);
          color: var(--text-light);
          border-color: var(--primary-color);
        }
        
        .chat-header {
          background: var(--primary-color);
          color: var(--text-light);
          border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }
        
        .message {
          display: flex;
        }
        
        .message.own {
          justify-content: flex-end;
        }
        
        .message.other {
          justify-content: flex-start;
        }
        
        .message-content {
          max-width: 70%;
          padding: 0.75rem;
          border-radius: var(--border-radius);
          position: relative;
        }
        
        .message.own .message-content {
          background: var(--primary-color);
          color: var(--text-light);
        }
        
        .message.other .message-content {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }
        
        .message-user {
          font-weight: bold;
        }
        
        .message-time {
          opacity: 0.7;
        }
        
        .chat-input {
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
          border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
        }
      `}</style>
    </div>
  );
};

export default Chat; 