import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase.prod';

export interface ChatGroup {
  complimentId: string;
  complimentTitle: string;
  chats: ChatSession[];
}

export interface ChatSession {
  id: string;
  complimentId: string;      // <--- Added this
  complimentTitle: string;   // <--- Added this
  otherUid: string;
  otherName: string; 
  lastMessage: string;
  lastUpdated: any;
  isGuest: boolean;
}

export function useChatGroups(currentUserId: string | null) {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUserId),
      orderBy("last_updated", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawChats = snapshot.docs.map(doc => {
        const data = doc.data();
        const otherUid = data.participants.find((uid: string) => uid !== currentUserId) || 'unknown';
        
        return {
          id: doc.id,
          complimentId: data.compliment_id,
          complimentTitle: data.compliment_title || 'Unknown Compliment',
          otherUid: otherUid,
          otherName: 'Friend', 
          lastMessage: data.last_message || '',
          lastUpdated: data.last_updated,
          isGuest: data.is_guest_chat || false
        } as ChatSession;
      });

      const groupedMap = new Map<string, ChatGroup>();

      rawChats.forEach(chat => {
        if (!groupedMap.has(chat.complimentId)) {
          groupedMap.set(chat.complimentId, {
            complimentId: chat.complimentId,
            complimentTitle: chat.complimentTitle,
            chats: []
          });
        }
        groupedMap.get(chat.complimentId)?.chats.push(chat);
      });

      const groupArray = Array.from(groupedMap.values()).sort((a, b) => {
        const timeA = a.chats[0]?.lastUpdated?.seconds || 0;
        const timeB = b.chats[0]?.lastUpdated?.seconds || 0;
        return timeB - timeA;
      });

      setGroups(groupArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  return { groups, loading };
}
