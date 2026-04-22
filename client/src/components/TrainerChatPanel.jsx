import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./TrainerChatPanel.module.css";

const MessageSquare = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

const X = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const Send = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);

export default function TrainerChatPanel({ selectedClientId, selectedClientName }) {
  const { apiFetch } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const togglePanel = () => setIsOpen(!isOpen);

  const extractWorkoutJson = (text) => {
    const codeBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
    const match = text.match(codeBlockRegex);
    if (match && match[1]) {
      try {
        const data = JSON.parse(match[1]);
        if (data.workoutSuggested) {
          return { data, textWithoutJson: text.replace(codeBlockRegex, '').trim() };
        }
      } catch (e) {}
    }
    return { data: null, textWithoutJson: text };
  };

  const applyProgram = (programData) => {
    localStorage.setItem("wf_pending_program", JSON.stringify(programData));
    window.location.hash = "#workout";
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const history = messages.map(m => ({ role: m.role, content: m.rawContent || m.content }));
    const newMessage = { role: "user", content: inputValue, rawContent: inputValue };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/ai/trainer-chat", {
        method: "POST",
        body: JSON.stringify({
          clientId: selectedClientId,
          message: newMessage.content,
          conversationHistory: history
        })
      });
      
      const { textWithoutJson, data } = extractWorkoutJson(res.content || "");
      
      setMessages(prev => [...prev, {
        role: "assistant", 
        content: textWithoutJson, 
        rawContent: res.content,
        suggestedProgram: data
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant", 
        content: `Sorry, I encountered an error: ${err.message || "Failed to fetch response."}`,
        rawContent: "Error"
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        className={styles.fab}
        onClick={togglePanel}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {isOpen && (
        <div className={styles.panelContainer}>
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <strong>Trainer AI Assistant</strong>
              <small>Context: {selectedClientName || "General"}</small>
            </div>
            <button className={styles.closeBtn} onClick={togglePanel}><X size={18} /></button>
          </div>
          
          <div className={styles.messagesArea}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                Ask me about {selectedClientName || "your clients"}! Example: "What should I assign today?"
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`${styles.messageWrapper} ${m.role === 'user' ? styles.userRow : styles.assistantRow}`}>
                <div className={`${styles.messageBubble} ${m.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                  {m.content}
                </div>
                {m.suggestedProgram && (
                  <button 
                    className={styles.applyBtn}
                    onClick={() => applyProgram(m.suggestedProgram)}
                  >
                    Apply as Today's Program ✨
                  </button>
                )}
              </div>
            ))}
            {loading && <div className={styles.loadingBubble}>AI is typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <input 
              type="text" 
              placeholder="Ask anything about the client..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading || !selectedClientId}
            />
            <button 
              className={styles.sendBtn} 
              onClick={handleSend}
              disabled={loading || !inputValue.trim() || !selectedClientId}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
