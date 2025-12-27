import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging } from '../../../config/firebase.prod';

export function useNotificationPermission(user: any) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  // Check initial state
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Get the token (VAPID Key required)
        const token = await getToken(messaging, {
          vapidKey: "BEOUobS5y0B3qvsBj3NkM6KsiTWpSdVVbzQHq5jtMyGQViYO60I7iScV_oWQMREqW5Wby8SogaQMmWi5xatL8aM"
        });
        
        if (token) {
          // Save to User Profile
          await updateDoc(doc(db, "users", user.uid), { fcm_token: token });
          console.log("Notification Token Saved!");
        }
      }
    } catch (e) {
      console.error("Notification Error:", e);
      alert("Could not enable notifications. (Check browser settings).");
    } finally {
      setLoading(false);
    }
  };

  return { permission, requestPermission, loading };
}
