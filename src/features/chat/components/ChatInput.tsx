import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
}

export default function ChatInput({ onSend }: Props) {
  const [text, setText] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: any) => {
      setText(e.target.value);
      if (textAreaRef.current) {
          textAreaRef.current.style.height = 'auto';
          textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 120)}px`;
      }
  };

  const handleSendClick = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!text.trim()) return;
      
      onSend(text.trim());
      setText('');
      
      // Reset height
      if (textAreaRef.current) textAreaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if(e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendClick();
      }
  };

  return (
    <div style={{
        background:'white', padding:'10px 15px', borderTop:'1px solid #f0f0f0',
        paddingBottom: 'max(15px, env(safe-area-inset-bottom))',
        display:'flex', alignItems:'flex-end', gap:'10px'
    }}>
        <textarea 
            ref={textAreaRef}
            rows={1}
            style={{
                flex:1, background:'#f1f5f9', border:'none', borderRadius:'18px',
                fontSize:'1rem', outline:'none', padding:'12px 15px', color:'#333',
                resize:'none', maxHeight:'120px', fontFamily:'inherit'
            }}
            placeholder="Message..."
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
        />
        <button 
            onClick={handleSendClick}
            disabled={!text.trim()}
            style={{
                background: text.trim() ? '#4da6a9' : '#cbd5e1', 
                border:'none', borderRadius:'50%', width:'44px', height:'44px',
                display:'flex', alignItems:'center', justifyContent:'center', 
                cursor: text.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s', marginBottom:'2px'
            }}
        >
            <Send size={20} color="white" />
        </button>
    </div>
  );
}
