import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../../../config/firebase.prod';

export function useClaimSystem(user: any, complimentId: string | undefined, complimentData: any) {
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  // LOGGING: Check Inputs
  // console.log("🪝 useClaimSystem: Init", { uid: user?.uid, compId: complimentId, hasData: !!complimentData });

  const checkStatus = async () => {
      if (!user || !complimentId) return;
      console.log("🔍 useClaimSystem: Checking if already requested...");
      const q = query(
          collection(db, "claim_requests"), 
          where("compliment_id", "==", complimentId),
          where("requester_uid", "==", user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
          console.log("✅ useClaimSystem: Found existing request.");
          setHasRequested(true);
      }
  };

  const submitClaimRequest = async () => {
      console.log("🚀 useClaimSystem: STARTING CLAIM PROCESS...");
      
      if (!complimentId) {
          console.error("❌ useClaimSystem: Missing Compliment ID");
          return;
      }
      if (!complimentData) {
          console.error("❌ useClaimSystem: Missing Compliment Data");
          return;
      }

      setClaiming(true);
      try {
          // 1. GUEST CHECK
          if (!user || user.isAnonymous) {
              console.warn("🛑 useClaimSystem: User is Guest. Redirecting to login.");
              localStorage.setItem('pending_claim_id', complimentId);
              if (confirm("You must have a verified account to claim coins/gifts. Sign up now?")) {
                  navigate('/login');
              }
              return; 
          }

          // 2. CREATE REQUEST
          console.log("VX useClaimSystem: Writing to 'claim_requests'...");
          const requestData = {
              compliment_id: complimentId,
              sender_uid: complimentData.sender_uid, 
              requester_uid: user.uid,
              requester_name: user.displayName || 'Unknown',
              status: 'pending',
              timestamp: serverTimestamp(),
              tip_amount: complimentData.tip_amount || 0
          };
          console.log("📄 Payload:", requestData);

          await addDoc(collection(db, "claim_requests"), requestData);

          console.log("✅ useClaimSystem: SUCCESS! Write complete.");
          setHasRequested(true);
          alert("Request sent! The sender has been notified.");

      } catch (e: any) {
          console.error("🔥 useClaimSystem: WRITE FAILED", e);
          if (e.code === 'permission-denied') {
              alert("Database Error: Permission Denied. (Did you deploy the new rules?)");
          } else {
              alert(`Error: ${e.message}`);
          }
      } finally {
          setClaiming(false);
      }
  };

  return { submitClaimRequest, claiming, hasRequested, checkStatus };
}
