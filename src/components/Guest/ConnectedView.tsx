import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, XCircle, UserPlus, LayoutDashboard, ThumbsUp, Send, Lock } from 'lucide-react';
import type { ComplimentData, ChatMessage } from '../../types';
interface ConnectedViewProps {
  compliment: ComplimentData;
  coinAnimation: boolean;
  handleSeverConnection: () => void;
  user: any;
  chatMessages: ChatMessage[];
  messagesEndRef: any;
  textAreaRef: any;
  replyText: string;
  handleInput: (e: any) => void;
  handleSendReply: () => void;
}

export default function ConnectedView({
  compliment, coinAnimation, handleSeverConnection, user,
  chatMessages, messagesEndRef, textAreaRef, replyText, handleInput, handleSendReply
}: ConnectedViewProps) {
  const navigate = useNavigate();

  return (
      <div className="result-card slide-up" style={{borderColor: compliment?.is_severed ? '#999' : '#10b981', borderTopWidth: '4px', height: '70vh', display: 'flex', flexDirection: 'column', padding: '0'}}>
         <div style={{padding: '1rem', borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div><div style={{display: 'flex', alignItems: 'center', gap: '8px', color: compliment?.is_severed ? '#999' : '#10b981', fontWeight: 'bold'}}>{compliment?.is_severed ? <AlertCircle size={18}/> : <CheckCircle size={18}/>} {compliment?.is_severed ? "Disconnected" : "Connected"}</div>{coinAnimation && (<div style={{fontSize:'0.8rem', color:'#0f766e', fontWeight:'bold', marginTop:'2px'}}>+ Coins Added to Wallet!</div>)}</div>
            {!compliment?.is_severed && (<button onClick={handleSeverConnection} style={{background:'#fee2e2', border:'none', color:'#ef4444', padding:'6px 12px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px'}}><XCircle size={14}/> Disconnect</button>)}
         </div>
         
         <div style={{flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {!user ? (
                <div style={{background: '#1e293b', color: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', textAlign: 'center'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'5px'}}>
                        <UserPlus size={18} color="#4da6a9"/><span style={{fontWeight:'bold'}}>Save this moment!</span>
                    </div>
                    <p style={{fontSize:'0.85rem', color:'#cbd5e1', margin:'0 0 10px 0'}}>
                        Create a free account to save this compliment and keep the chat forever.
                    </p>
                    <button onClick={() => navigate(`/login?claiming=${compliment?.id}`)} style={{background: '#4da6a9', border: 'none', color: 'white', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize:'0.9rem'}}>
                        Sign Up & Save
                    </button>
                </div>
            ) : (
                <div style={{background: '#f0fdfa', color: '#0f766e', padding: '15px', borderRadius: '12px', marginBottom: '10px', textAlign: 'center', border:'1px solid #ccfbf1'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'5px'}}><LayoutDashboard size={18}/><span style={{fontWeight:'bold'}}>Dashboard Access</span></div>
                    <p style={{fontSize:'0.85rem', margin:'0 0 10px 0'}}>You currently have coins in your wallet.</p>
                    <button onClick={() => navigate('/dashboard')} style={{background: 'white', border: '1px solid #0f766e', color: '#0f766e', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize:'0.85rem'}}>Go to Dashboard</button>
                </div>
            )}
            {chatMessages.length === 0 && (<div style={{textAlign: 'center', color: '#666', marginTop: '1rem', padding: '20px', background: '#f8fafc', borderRadius: '12px'}}><ThumbsUp size={32} color="#4da6a9" style={{marginBottom:'10px'}}/><h3 style={{margin:'0 0 5px 0'}}>You're Connected!</h3><p style={{fontSize:'0.9rem', margin:0}}>Say "Thanks" to start the chat.</p></div>)}
            {chatMessages.map(msg => (<div key={msg.id} style={{alignSelf: msg.sender === 'Recipient' ? 'flex-end' : 'flex-start', background: msg.sender === 'Recipient' ? '#10b981' : '#f3f4f6', color: msg.sender === 'Recipient' ? 'white' : 'black', padding: '8px 14px', borderRadius: '16px', maxWidth: '80%', fontSize: '0.95rem', textAlign: 'left'}}>{msg.text}</div>))}
            <div ref={messagesEndRef} />
            {compliment?.is_severed && (<div style={{textAlign:'center', color:'#999', fontSize:'0.8rem', marginTop:'20px', fontStyle:'italic'}}>This conversation has been closed.</div>)}
         </div>
         
         {!compliment?.is_severed ? (
             <div style={{padding: '1rem', background: '#f9fafb', borderTop: '1px solid #eee'}}>
                 <div style={{display: 'flex', gap: '8px', alignItems:'flex-end'}}>
                     <textarea 
                         ref={textAreaRef}
                         value={replyText} 
                         onChange={handleInput} 
                         placeholder="Type a message..." 
                         rows={1}
                         style={{
                             flex: 1, padding: '12px', borderRadius: '18px', 
                             border: '1px solid #ddd', outline: 'none',
                             resize: 'none', overflow: 'hidden', minHeight:'20px', maxHeight:'120px',
                             fontFamily: 'inherit', fontSize:'1rem'
                         }} 
                         onKeyDown={(e) => {
                             if(e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handleSendReply();
                             }
                         }}
                     />
                     <button onClick={handleSendReply} style={{background: '#111827', color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom:'2px'}}><Send size={20} /></button>
                 </div>
             </div>
         ) : (<div style={{padding: '1rem', background: '#f3f4f6', borderTop: '1px solid #eee', textAlign:'center', color:'#666', fontSize:'0.9rem'}}><Lock size={16} style={{marginBottom:'-3px'}}/> Input Disabled</div>)}
      </div>
  );
}