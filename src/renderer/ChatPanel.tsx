import React, { useState, useEffect, useRef, Suspense } from 'react';
import './ChatPanel.css'; // İleride stil eklemek için

// Mesaj yapısı
interface Message {
  id: number;
  sender: 'user' | 'ai' | 'system'; // Sistem mesajları için (örn: hata)
  text: string;
}

interface ChatPanelProps {
  currentCode: string; // App.tsx'ten gelen kod
}

const ChatPanel: React.FC<ChatPanelProps> = ({ currentCode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [MarkdownComponent, setMarkdownComponent] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Otomatik kaydırma için

  // Lazy load the markdown components
  useEffect(() => {
    const loadMarkdownComponents = async () => {
      try {
        const [ReactMarkdownModule, remarkGfmModule] = await Promise.all([
          import('react-markdown'),
          import('remark-gfm')
        ]);
        
        const ReactMarkdown = ReactMarkdownModule.default;
        const remarkGfm = remarkGfmModule.default;
        
        setMarkdownComponent(() => (props: any) => 
          <ReactMarkdown remarkPlugins={[remarkGfm]} {...props} />
        );
      } catch (error) {
        console.error('Failed to load markdown components:', error);
      }
    };
    
    loadMarkdownComponents();
  }, []);

  // Otomatik olarak en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Kod değiştiğinde sohbeti temizle (isteğe bağlı)
  useEffect(() => {
    // setMessages([]); // Yeni kod geldiğinde sohbeti temizlemek isterseniz
  }, [currentCode]);

  const handleSendMessage = async () => {
    const trimmedMessage = currentMessage.trim();
    if (!trimmedMessage || isChatLoading) return;
    if (!currentCode) {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'system', text: 'Açıklama istemek için önce bir kod üretmelisiniz.' }]);
        setCurrentMessage('');
        return;
    }

    const newUserMessage: Message = { id: Date.now(), sender: 'user', text: trimmedMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setCurrentMessage('');
    setIsChatLoading(true);

    try {
      const explanation = await window.electron.ipcRenderer.invoke('gemini-explain', currentCode, trimmedMessage);
      const aiMessage: Message = { id: Date.now() + 1, sender: 'ai', text: explanation };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Gemini açıklama hatası:', err);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'system',
        text: `Hata: ${err.message || 'Açıklama alınamadı.'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Enter ile gönderme (Shift+Enter yeni satır)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-panel-content">
      <div className="message-list">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            {msg.sender === 'ai' ? (
                MarkdownComponent ? (
                  <MarkdownComponent>
                    {msg.text}
                  </MarkdownComponent>
                ) : (
                  <div>
                    {msg.text.split('\n').map((line, index) => (
                      <React.Fragment key={index}>{line}<br /></React.Fragment>
                    ))}
                  </div>
                )
            ) : (
                msg.text.split('\n').map((line, index) => (
                   <React.Fragment key={index}>{line}<br /></React.Fragment>
                ))
            )}
          </div>
        ))}
        {isChatLoading && (
            <div className="message system loading">
                <span>.</span><span>.</span><span>.</span>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <textarea
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentCode ? "Kod hakkında bir soru sorun..." : "Önce kod üretin..."}
          rows={2} // Başlangıç satır sayısı
          disabled={isChatLoading || !currentCode}
        />
        <button onClick={handleSendMessage} disabled={isChatLoading || !currentMessage.trim() || !currentCode}>
          Gönder
        </button>
      </div>
    </div>
  );
};

export default ChatPanel; 