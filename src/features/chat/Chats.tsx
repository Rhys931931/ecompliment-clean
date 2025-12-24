import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Clock } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';

export default function ChatsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [chatList, setChatList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchChats(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchChats = async (uid: string) => {
    try {
      // NEW ARCHITECTURE: Look at the Root 'chats' collection
      // This will be empty until you send your first message in the new system!
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", uid),
        orderBy("last_updated", "desc")
      );
      
      const snapshot = await getDocs(q);
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setChatList(chats);
    } catch (e) {
      console.error("Error fetching chats:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', maxWidth:'800px', width:'100%', padding:'20px'}}>
        
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}>
            <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer'}}>
                <ArrowLeft size={20} color="#666"/>
            </button>
            <h1 style={{margin:0, color:'#333'}}>Messages</h1>
        </div>

        <div className="fade-in" style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {loading ? (
                <div style={{padding:'40px', textAlign:'center', color:'#999'}}>Loading conversations...</div>
            ) : chatList.length === 0 ? (
                <div style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'12px', border:'1px solid #eee'}}>
                    <MessageCircle size={48} color="#ddd" style={{marginBottom:'15px'}}/>
                    <h3>No active chats</h3>
                    <p style={{color:'#999'}}>Conversations start when you message a friend from your Squad.</p>
                </div>
            ) : (
                chatList.map((chat) => (
                    <div 
                        key={chat.id} 
                        onClick={() => navigate(`/chat/${chat.id}`)} 
                        style={{
                            background:'white', padding:'15px', borderRadius:'12px', 
                            border:'1px solid #eee', cursor:'pointer',
                            display:'flex', alignItems:'center', gap:'15px',
                            boxShadow:'0 2px 4px rgba(0,0,0,0.02)'
                        }}
                    >
                        <div style={{
                            width:'50px', height:'50px', borderRadius:'50%', 
                            background:'#e0f2fe', display:'flex', alignItems:'center', justifyContent:'center',
                            color:'#0284c7', fontWeight:'bold', flexShrink:0
                        }}>
                            <MessageCircle size={24}/>
                        </div>

                        <div style={{flex:1, overflow:'hidden'}}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                <div style={{fontWeight:'bold', color:'#333', fontSize:'1rem'}}>
                                    {chat.compliment_title || 'Chat'}
                                </div>
                                <div style={{fontSize:'0.75rem', color:'#999', display:'flex', alignItems:'center', gap:'4px'}}>
                                    <Clock size={12}/>
                                    {chat.last_updated?.seconds ? new Date(chat.last_updated.seconds * 1000).toLocaleDateString() : ''}
                                </div>
                            </div>
                            <div style={{color:'#666', fontSize:'0.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                {chat.last_message || 'Start the conversation...'}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

      </main>
    </div>
  );
}