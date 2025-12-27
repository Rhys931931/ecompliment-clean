import { useState, useEffect } from 'react';
import { db, auth, functions } from '../../config/firebase.prod';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export interface NotificationItem {
  id: string;
  type: 'claim_request' | 'connection';
  message: string;
  timestamp: any;
  data: any;
  title?: string;
  preview?: string;
  iconType?: string;
  color?: string;
  isActionItem?: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    const setupListener = async () => {
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }

      // NEW: Listen to claim_requests instead of compliments
      const q = query(
        collection(db, 'claim_requests'),
        where('sender_uid', '==', user.uid),
        where('status', '==', 'pending')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const items: NotificationItem[] = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id, // Request ID
            type: 'claim_request',
            message: 'Claim Request',
            timestamp: data.timestamp,
            data: data,
            title: "Claim Request",
            preview: `${data.requester_name || 'Someone'} wants to claim your card!`,
            iconType: 'request', 
            color: '#f59e0b',
            isActionItem: true
          };
        });
        setNotifications(items);
        setLoading(false);
      });
    };
    setupListener();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const approveFn = httpsCallable(functions, 'approveClaim');
      await approveFn({ requestId: requestId });
      
      alert("Approved! Coins transferred.");

    } catch (err) {
      console.error("Approval Failed:", err);
      alert("Approval failed. Try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const reqRef = doc(db, 'claim_requests', requestId);
      await updateDoc(reqRef, { status: 'denied' });
    } catch (err) { console.error(err); } 
    finally { setProcessingId(null); }
  };

  return { 
    notifications, 
    loading, 
    processingId, 
    fetchNotifications: (_uid?: string) => {}, 
    handleApprove, 
    handleDeny 
  };
};
