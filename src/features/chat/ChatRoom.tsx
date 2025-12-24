import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';

// Import New Components
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';

export default function ChatRoom() {
  const { complimentId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomDetails, setRoomDetails] = useState<any>(null);

  // 1. Auth & Room Setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (complimentId) {
             const unsubRoom = onSnapshot(doc(db, "chats", complimentId), (docSnap) => {
                 if (docSnap.exists()) {
                     setRoomDetails({ id: docSnap.id, ...docSnap.data() });
                 } else {
                     // Fallback: If chatting via compliment ID, fetch that instead
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

  // 2. Message Listener
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

  // 3. Send Handler
  const handleSendMessage = async (text: string) => {
    if (!user || !complimentId) return;

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
        compliment_title: roomDetails?.compliment_title || roomDetails?.recipient_name || 'Chat'
      }, { merge: true });

    } catch (err) { console.error("Error sending:", err); }
  };

  if (loading) return (
      <div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>
  );

  return (
    <div className="app-container" style={{background:'#fff', height:'100dvh', display:'flex', flexDirection:'column', padding:0}}>
      
      <ChatHeader title={roomDetails?.compliment_title || roomDetails?.recipient_name || 'Chat'} />
      
      <MessageList 
          messages={messages} 
          currentUserId={user?.uid} 
      />
      
      <ChatInput onSend={handleSendMessage} />

    </div>
  );
}
