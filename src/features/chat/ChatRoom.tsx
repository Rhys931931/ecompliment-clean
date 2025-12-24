import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react'; 
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';

export default function ChatRoom() {
  const { complimentId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [roomDetails, setRoomDetails] = useState<any>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const handleInput = (e: any) => {
      setNewMessage(e.target.value);
      if (textAreaRef.current) {
          textAreaRef.current.style.height = 'auto';
          textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 120)}px`;
      }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (complimentId) {
             const unsubRoom = onSnapshot(doc(db, "chats", complimentId), (docSnap) => {
                 if (docSnap.exists()) {
                     setRoomDetails({ id: docSnap.id, ...docSnap.data() });
                 } else {
                     // If chatting via compliment ID, fetch that instead
                     onSnapshot(doc(db, "compliments", complimentId), (compSnap) => {
                         if(compSnap.exists()) setRoomDetails({ id: compSnap.id, ...compSnap.data() });
                     });
                 }
             });
             return () => unsubRoom();
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, complimentId]);

  useEffect(() => {
    if (!complimentId) return;

    const q = query(
      collection(db, "chats", complimentId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [complimentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !complimentId) return;

    const text = newMessage.trim();
    setNewMessage(''); 
    if (textAreaRef.current) textAreaRef.current.style.height = 'auto'; // Reset height

    try {
      await addDoc(collection(db, "chats", complimentId, "messages"), {
        text: text,
        senderUid: user.uid,
        senderName: user.displayName || 'Anonymous',
        timestamp: serverTimestamp(),
        type: 'text'
      });

      const chatRef = doc(db, "chats", complimentId);
      await setDoc(chatRef, {
        last_message: text,
        last_updated: serverTimestamp(),
        participants: [user.uid, roomDetails?.recipient_uid || '', roomDetails?.sender_uid || ''].filter(Boolean),
        compliment_title: roomDetails?.recipient_name || 'Chat'
      }, { merge: true });

    } catch (err) { console.error("Error sending:", err); }
  };

  if (loading) return (
      <div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>
  );

  return (
    <div className="app-container" style={{background:'#fff', height:'100dvh', display:'flex', flexDirection:'column', padding:0}}>
      
      {/* HEADER */}
      <div style={{
          background:'#4da6a9', padding:'15px', 
          display:'flex', alignItems:'center', gap:'15px', position:'sticky', top:0, zIndex:10,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
          <button onClick={() => navigate('/chats')} style={{background:'none', border:'none', cursor:'pointer', padding:0, display:'flex'}}>
              <ArrowLeft size={24} color="white" />
          </button>
          <div style={{flex:1}}>
              <div style={{fontWeight:'bold', fontSize:'1.1rem', color:'white'}}>
                  {roomDetails?.compliment_title || roomDetails?.recipient_name || 'Chat'}
              </div>
          </div>
      </div>

      {/* MESSAGES */}
      <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'12px', background:'#f8fafc'}}>
          {messages.map((msg) => {
              const isMe = msg.senderUid === user?.uid;
              return (
                  <div key={msg.id} style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}>
                      <div style={{
                          background: isMe ? '#4da6a9' : 'white', 
                          color: isMe ? 'white' : '#333',
                          padding: '12px 16px',
                          borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          wordWrap: 'break-word',
                          lineHeight: '1.5',
                          border: isMe ? 'none' : '1px solid #e2e8f0',
                          fontSize: '1rem'
                      }}>
                          {msg.text}
                      </div>
                      <div style={{fontSize:'0.65rem', color:'#94a3b8', marginTop:'4px', margin:'0 5px'}}>
                          {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                      </div>
                  </div>
              );
          })}
          <div ref={bottomRef} style={{height:'10px'}}/>
      </div>

      {/* INPUT AREA (Improved) */}
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
              value={newMessage}
              onChange={handleInput}
              onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                  }
              }}
          />
          <button 
              onClick={handleSend}
              disabled={!newMessage.trim()}
              style={{
                  background: newMessage.trim() ? '#4da6a9' : '#cbd5e1', 
                  border:'none', borderRadius:'50%', width:'44px', height:'44px',
                  display:'flex', alignItems:'center', justifyContent:'center', 
                  cursor: newMessage.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s', marginBottom:'2px'
              }}
          >
              <Send size={20} color="white" />
          </button>
      </div>

    </div>
  );
}
