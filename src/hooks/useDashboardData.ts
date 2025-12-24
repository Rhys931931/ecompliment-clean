import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase.prod';
import { useNavigate } from 'react-router-dom';

export function useDashboardData() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await ensureMasterPin(currentUser.uid);
        await fetchUserProfile(currentUser.uid);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (uid: string) => {
      try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
              setUserData(userDoc.data());
          }
      } catch (e) { console.error("Profile load error", e); }
  };

  const ensureMasterPin = async (uid: string) => {
      try {
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
              const data = userSnap.data();
              if (!data.master_pin) {
                  const safeChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
                  let newPin = '';
                  for (let i = 0; i < 5; i++) newPin += safeChars.charAt(Math.floor(Math.random() * safeChars.length));
                  await updateDoc(userRef, { master_pin: newPin });
              }
          }
      } catch (err) { console.error("Auto-Fix failed:", err); }
  };

  // Derived State
  const displayName = userData?.display_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Friend';
  const photoURL = userData?.photo_url || user?.photoURL;
  const isSuperAdmin = user?.email === 'rhys@tvmenuswvc.com' || user?.email === 'rhyshaney@gmail.com' || userData?.is_super_admin;
  const isBusiness = userData?.is_business;
  const balance = userData?.balance || 0;

  return { 
      user, 
      userData, 
      loading, 
      displayName, 
      photoURL, 
      isSuperAdmin, 
      isBusiness, 
      balance 
  };
}
