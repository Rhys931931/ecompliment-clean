import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../../../config/firebase.prod';

export function useClaimSystem(user: any, complimentId: string | undefined, complimentData: any) {
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  // AUTO-CHECK: As soon as we have a valid ID and User, check the database
  useEffect(() => {
      const checkStatus = async () => {
          if (!user || !complimentId) return;
          
          const q = query(
              collection(db, "claim_requests"), 
              where("compliment_id", "==", complimentId),
              where("requester_uid", "==", user.uid)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
              console.log("✅ Already requested.");
              setHasRequested(true);
          }
      };
      checkStatus();
  }, [user, complimentId]);

  const submitClaimRequest = async () => {
      if (!complimentId || !complimentData) {
          console.error("❌ Missing Data. ID:", complimentId, "Data:", complimentData);
          return;
      }

      setClaiming(true);
      try {
          if (!user || !user.emailVerified) {
              // Optional: Add email verification check here if desired
          }
          
          if (!user || user.isAnonymous) {
              localStorage.setItem('pending_claim_id', complimentId);
              if (confirm("Sign up to claim this gift?")) navigate('/login');
              return; 
          }

          // THE FIX: We use the ID passed into the hook (The Card ID)
          await addDoc(collection(db, "claim_requests"), {
              compliment_id: complimentId, 
              sender_uid: complimentData.sender_uid, 
              requester_uid: user.uid,
              requester_name: user.displayName || 'Unknown',
              status: 'pending',
              timestamp: serverTimestamp(),
              tip_amount: complimentData.tip_amount || 0 
          });

          setHasRequested(true);
          alert("Request sent! The sender has been notified.");

      } catch (e: any) {
          console.error("🔥 Claim Error:", e);
          alert(`Error: ${e.message}`);
      } finally {
          setClaiming(false);
      }
  };

  return { submitClaimRequest, claiming, hasRequested };
}
