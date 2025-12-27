import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, ChevronRight, User } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';
import { useChatGroups } from './hooks/useChatHelpers';

export default function ChatsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  const { groups, loading } = useChatGroups(user?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else navigate('/login');
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', maxWidth:'800px', width:'100%', padding:'20px'}}>
        
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer', color:'#666'}}>
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{margin:0, color:'#333', fontSize:'1.8rem'}}>Inbox</h1>
            </div>
        </div>

        {loading && (
            <div style={{padding:'40px', textAlign:'center', color:'#999'}}>Looking for messages...</div>
        )}

        {!loading && groups.length === 0 && (
            <div style={{textAlign:'center', padding:'60px 20px', background:'white', borderRadius:'16px', border:'1px solid #eee'}}>
                <MessageCircle size={48} color="#ddd" style={{marginBottom:'15px'}}/>
                <h3>No active chats</h3>
                <p style={{color:'#999'}}>Conversations appear here when you reply to a compliment.</p>
            </div>
        )}

        <div className="fade-in" style={{display:'flex', flexDirection:'column', gap:'25px'}}>
            {groups.map((group) => (
                <div key={group.complimentId}>
                    <div style={{padding:'0 10px 8px 10px', fontSize:'0.85rem', fontWeight:'bold', color:'#64748b', textTransform:'uppercase', letterSpacing:'1px', borderBottom:'1px solid #e2e8f0', marginBottom:'10px'}}>
                        Re: {group.complimentTitle}
                    </div>

                    <div style={{display:'grid', gap:'10px'}}>
                        {group.chats.map((chat) => (
                            <div 
                                key={chat.id} 
                                onClick={() => navigate(`/chat/${chat.id}`)} 
                                style={{
                                    background:'white', padding:'15px', borderRadius:'12px', 
                                    border:'1px solid #eee', cursor:'pointer',
                                    display:'flex', alignItems:'center', gap:'15px',
                                    boxShadow:'0 2px 4px rgba(0,0,0,0.02)',
                                    transition: 'transform 0.1s'
                                }}
                            >
                                <div style={{
                                    width:'45px', height:'45px', borderRadius:'50%', 
                                    background: chat.isGuest ? '#f1f5f9' : '#e0f2fe', 
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    color: chat.isGuest ? '#94a3b8' : '#0284c7', 
                                    flexShrink:0, border:'2px solid white', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'
                                }}>
                                    <User size={20}/>
                                </div>

                                <div style={{flex:1, overflow:'hidden'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                        <div style={{fontWeight:'bold', color:'#333', fontSize:'0.95rem'}}>
                                            {chat.otherUid === user?.uid ? 'Me' : (chat.isGuest ? 'Guest User' : 'App User')}
                                        </div>
                                        <div style={{fontSize:'0.7rem', color:'#999', display:'flex', alignItems:'center', gap:'4px'}}>
                                            {chat.lastUpdated?.seconds ? new Date(chat.lastUpdated.seconds * 1000).toLocaleDateString() : 'New'}
                                        </div>
                                    </div>
                                    <div style={{color:'#666', fontSize:'0.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                        {chat.lastMessage || 'Start the conversation...'}
                                    </div>
                                </div>
                                <ChevronRight size={18} color="#cbd5e1" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>

      </main>
    </div>
  );
}
