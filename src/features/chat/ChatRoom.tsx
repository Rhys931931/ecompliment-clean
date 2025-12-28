import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';

import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import { useNotificationPermission } from '../notifications/hooks/useNotificationPermission';
import { useClaimSystem } from '../commerce/hooks/useClaimSystem';

export default function ChatRoom() {
  const { complimentId } = useParams(); // NOTE: This is actually the CHAT ID from the URL
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Data State
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [complimentData, setComplimentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Hook for the Bell
  const { permission, requestPermission, loading: notifyLoading } = useNotificationPermission(user);
  
  // THE FIX: We pass 'roomDetails?.compliment_id' (The Parent Card) instead of 'complimentId' (The Chat)
  const realComplimentId = roomDetails?.compliment_id;
  const { submitClaimRequest, claiming, hasRequested } = useClaimSystem(user, realComplimentId, complimentData);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (complimentId) {
             // 1. Listen to Chat Room
             const unsubRoom = onSnapshot(doc(db, "chats", complimentId), async (docSnap) => {
                 if (docSnap.exists()) {
                     const data = docSnap.data();
                     setRoomDetails({ id: docSnap.id, ...data });
                     
                     // 2. Fetch Origin Compliment
                     if (data.compliment_id) {
                         const compSnap = await getDoc(doc(db, "compliments", data.compliment_id));
                         if (compSnap.exists()) {
                             setComplimentData(compSnap.data());
                         }
                     }
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
    const q = query(collection(db, "chats", complimentId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [complimentId]);

  const handleSendMessage = async (text: string) => {
    if (!user || !complimentId) return;
    try {
      await addDoc(collection(db, "chats", complimentId, "messages"), {
        text,
        senderUid: user.uid,
        senderName: user.displayName || 'Friend',
        timestamp: serverTimestamp(),
        type: 'text'
      });
      await updateDoc(doc(db, "chats", complimentId), { last_message: text, last_updated: serverTimestamp() });
    } catch (err) { console.error("Error sending:", err); }
  };

  if (loading) return <div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading Chat...</div>;

  // VISIBILITY LOGIC
  const isSender = user?.uid === complimentData?.sender_uid;
  const isClaimed = complimentData?.claimed;
  // Only show if: Data loaded, Not claimed, I'm not the sender, and I haven't asked yet
  const showClaim = complimentData && !isClaimed && !isSender && !hasRequested;

  return (
    <div className="app-container" style={{background:'#fff', height:'100dvh', display:'flex', flexDirection:'column', padding:0}}>
      
      <ChatHeader 
          title={roomDetails?.compliment_title || 'Chat'} 
          isGuest={roomDetails?.is_guest_chat}
          canClaim={showClaim}
          onClaim={submitClaimRequest}
          notificationPermission={permission}
          onRequestNotify={requestPermission}
          notifyLoading={notifyLoading || claiming}
      />
      
      <MessageList messages={messages} currentUserId={user?.uid} />
      
      <ChatInput onSend={handleSendMessage} />

    </div>
  );
}
