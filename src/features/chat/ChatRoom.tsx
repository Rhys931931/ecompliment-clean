import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';

import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';

export default function ChatRoom() {
  const { complimentId } = useParams(); // This is actually the Chat Room ID
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
             // Listener for Room Metadata (to get Title, Sender Name, etc)
             const unsubRoom = onSnapshot(doc(db, "chats", complimentId), (docSnap) => {
                 if (docSnap.exists()) {
                     setRoomDetails({ id: docSnap.id, ...docSnap.data() });
                 }
             });
             return () => unsubRoom();
        }
      } else {
        // If not logged in, we eventually want to handle "Guest Auth" here.
        // For now, redirect to login to test the "Happy Path".
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, complimentId]);

  // 2. Message Listener (The separate database you asked for)
  useEffect(() => {
    if (!complimentId) return;

    // This looks inside chats -> specific_room -> messages
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

  // 3. Send Handler (Server Authority Fix)
  const handleSendMessage = async (text: string) => {
    if (!user || !complimentId) return;

    try {
      // A. Write the message to the sub-collection
      await addDoc(collection(db, "chats", complimentId, "messages"), {
        text: text,
        senderUid: user.uid,
        senderName: user.displayName || 'Viewer',
        timestamp: serverTimestamp(),
        type: 'text'
      });

      // B. Update the Room Metadata (Last Message Only)
      // CRITICAL CHANGE: We do NOT touch 'participants'. 
      // The Server set them up, and we respect that.
      const chatRef = doc(db, "chats", complimentId);
      await updateDoc(chatRef, {
        last_message: text,
        last_updated: serverTimestamp(),
      });

    } catch (err) { console.error("Error sending:", err); }
  };

  if (loading) return (
      <div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading Chat...</div>
  );

  return (
    <div className="app-container" style={{background:'#fff', height:'100dvh', display:'flex', flexDirection:'column', padding:0}}>
      <ChatHeader title={roomDetails?.compliment_title || 'Chat'} />
      <MessageList messages={messages} currentUserId={user?.uid} />
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
}
