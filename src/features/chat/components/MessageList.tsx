import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  senderUid: string;
  senderName?: string;
  timestamp: any;
}

interface Props {
  messages: Message[];
  currentUserId: string;
}

export default function MessageList({ messages, currentUserId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'15px', background:'#f8fafc'}}>
        {messages.map((msg) => {
            const isMe = msg.senderUid === currentUserId;
            return (
                <div key={msg.id} style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start'
                }}>
                    {!isMe && (
                        <div style={{fontSize:'0.75rem', color:'#64748b', marginBottom:'4px', marginLeft:'10px'}}>
                            {msg.senderName || 'Friend'}
                        </div>
                    )}
                    
                    <div style={{
                        background: isMe ? '#4da6a9' : 'white', 
                        color: isMe ? 'white' : '#333',
                        padding: '12px 16px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        lineHeight: '1.5',
                        border: isMe ? 'none' : '1px solid #e2e8f0',
                        fontSize: '1rem'
                    }}>
                        {msg.text}
                    </div>
                    
                    <div style={{fontSize:'0.65rem', color:'#94a3b8', marginTop:'4px', margin: isMe ? '0 5px 0 0' : '0 0 0 5px'}}>
                        {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}
                    </div>
                </div>
            );
        })}
        <div ref={bottomRef} style={{height:'10px'}}/>
    </div>
  );
}
