import { useState, useEffect } from 'react';
import { TrendingUp, Coins } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase.prod';

export default function BusinessOverview() {
  const [balance, setBalance] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadStats = async () => {
          if (!auth.currentUser) return;
          try {
              // 1. Get Balance
              const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
              if (userDoc.exists()) setBalance(userDoc.data().balance || 0);

              // 2. Get Views from Ads
              const qAds = query(collection(db, "ads"), where("owner_email", "==", auth.currentUser.email));
              const adsSnap = await getDocs(qAds);
              const views = adsSnap.docs.reduce((acc, curr) => acc + (curr.data().views || 0), 0);
              setTotalViews(views);
          } catch(e) { console.error(e); }
          setLoading(false);
      };
      loadStats();
  }, []);

  if(loading) return <div>Loading Stats...</div>;

  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'30px'}}>
        <div className="result-card" style={{background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color:'white', textAlign:'left', padding:'20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><span style={{fontSize:'0.8rem', opacity:0.8, textTransform:'uppercase'}}>Total Reach</span><TrendingUp size={20} color="#4da6a9"/></div>
            <div style={{fontSize:'2rem', fontWeight:'bold'}}>{totalViews}</div>
            <div style={{fontSize:'0.8rem', opacity:0.6}}>Impressions</div>
        </div>
        <div className="result-card" style={{background: 'white', textAlign:'left', padding:'20px', border:'1px solid #e2e8f0'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><span style={{fontSize:'0.8rem', color:'#64748b', textTransform:'uppercase'}}>Ad Credits</span><Coins size={20} color="#f59e0b"/></div>
            <div style={{fontSize:'2rem', fontWeight:'bold', color:'#333'}}>{balance}</div>
            <div style={{fontSize:'0.8rem', color:'#999'}}>Coins Available</div>
        </div>
    </div>
  );
}
