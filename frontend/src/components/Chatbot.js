import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm the HR Assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const newMessages = [...messages, { text: text, sender: 'user' }];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // --- FIX: CORRECT URL (Removed 'employees/') ---
      const response = await axios.post('http://127.0.0.1:8000/api/chatbot/', 
        { message: text },
        { headers: { 'Authorization': `Token ${token}` } }
      );

      // 3. Add Bot Response
      setMessages(prev => [...prev, { text: response.data.response, sender: 'bot' }]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting to the server.", sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  // Quick suggestion chips
  const suggestions = [
    "How do I apply for leave?",
    "Where is my payslip?",
    "Update profile picture",
    "Attendance policy"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden">
          
          {/* Header */}
          <div className="bg-blue-600 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-white p-1 rounded-full">
                    <span className="material-icons text-blue-600 text-xl">smart_toy</span>
                </div>
                <h3 className="text-white font-semibold">HR Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-blue-700 rounded-full p-1">
              <span className="material-icons text-sm">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex justify-start">
                 <div className="bg-gray-200 px-4 py-2 rounded-full rounded-bl-none">
                   <div className="flex space-x-1">
                     <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                     <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   </div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length < 4 && (
             <div className="px-4 py-2 bg-gray-50 flex gap-2 overflow-x-auto">
                {suggestions.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSendMessage(s)}
                        className="whitespace-nowrap px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                        {s}
                    </button>
                ))}
             </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a question..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500 text-sm"
            />
            <button 
              onClick={() => handleSendMessage()} 
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <span className="material-icons text-lg">send</span>
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 focus:outline-none"
      >
        <span className="material-icons text-3xl">
            {isOpen ? 'keyboard_arrow_down' : 'chat'}
        </span>
      </button>
    </div>
  );
};

export default Chatbot;