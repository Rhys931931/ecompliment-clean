import { useState, useEffect } from 'react';
import { db, auth, functions } from '../../config/firebase.prod';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
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

      try {
        const userHubRef = doc(db, 'users', user.uid);
        const userHubSnap = await getDoc(userHubRef);
        if (!userHubSnap.exists()) return;

        const blindKey = userHubSnap.data().blind_key;
        if (!blindKey) return;

        const q = query(
          collection(db, 'compliments'),
          where('owner_index', '==', blindKey),
          where('status', '==', 'pending_approval')
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const items: NotificationItem[] = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              type: 'claim_request',
              message: 'Claim Request',
              timestamp: data.timestamp,
              data: data,
              title: "Claim Request",
              preview: `${data.claimer_name || 'Someone'} wants to claim your card!`,
              iconType: 'request', 
              color: '#f59e0b',
              isActionItem: true
            };
          });
          setNotifications(items);
          setLoading(false);
        });
      } catch (err) { console.error(err); setLoading(false); }
    };
    setupListener();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handleApprove = async (notificationId: string) => {
    setProcessingId(notificationId);
    try {
      // CALL THE SERVER FUNCTION (SECURE)
      const approveFn = httpsCallable(functions, 'approveClaim');
      await approveFn({ complimentId: notificationId });
      
      alert("Approved! Coins transferred.");

    } catch (err) {
      console.error("Approval Failed:", err);
      alert("Approval failed. Try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (notificationId: string) => {
    setProcessingId(notificationId);
    try {
      const compRef = doc(db, 'compliments', notificationId);
      await updateDoc(compRef, { status: 'denied' }); // Soft deny
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
