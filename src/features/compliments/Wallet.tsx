import { useState, useEffect } from 'react';
import { FolderHeart, RefreshCw } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase.prod';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import '../../App.css';

// Import Visual Component
import WalletList from './components/WalletList';

interface AdData {
  id: string;
  name: string;
  offer: string;
  coupon_code: string;
  color: string;
}

interface WalletItem {
  id: string;
  sender: string;
  message: string;
  date?: any;
  ads: AdData[];
}

export default function Wallet() {
  const [user, setUser] = useState<any>(null);
  const [walletItems, setWalletItems] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) loadWallet(currentUser);
        else loadWallet(null);
    });
    return () => unsubscribe();
  }, []);

  const loadWallet = async (currentUser: any) => {
      setLoading(true);
      const savedIds = JSON.parse(localStorage.getItem('ecomp_wallet') || '[]');
      
      const items: WalletItem[] = [];

      for (const compId of savedIds) {
          try {
              const compRef = doc(db, "compliments", compId);
              const compSnap = await getDoc(compRef);

              if (compSnap.exists()) {
                  const data = compSnap.data();
                  
                  // === SELF-HEALING LOGIC ===
                  // If logged in & card has no owner, claim it seamlessly
                  if (currentUser && !data.recipient_uid) {
                      console.log(`Fixing orphan card: ${compId}`);
                      await updateDoc(compRef, { recipient_uid: currentUser.uid });
                  }
                  // ==========================

                  const adsList: AdData[] = [];
                  if (data.ad_ids && Array.isArray(data.ad_ids)) {
                      for (const adId of data.ad_ids) {
                          const adSnap = await getDoc(doc(db, "ads", adId));
                          if (adSnap.exists()) {
                              adsList.push({ id: adSnap.id, ...adSnap.data() } as AdData);
                          }
                      }
                  }

                  items.push({
                      id: compId,
                      sender: data.sender_display || data.sender || "Friend",
                      message: data.message,
                      date: data.createdAt,
                      ads: adsList
                  });
              }
          } catch (e) {
              console.error("Error loading item", compId, e);
          }
      }

      setWalletItems(items);
      setLoading(false);
  };

  const removeFromWallet = (id: string) => {
      if(!confirm("Remove this from your wallet?")) return;
      
      const currentIds = JSON.parse(localStorage.getItem('ecomp_wallet') || '[]');
      const newIds = currentIds.filter((cid: string) => cid !== id);
      localStorage.setItem('ecomp_wallet', JSON.stringify(newIds));
      
      setWalletItems(prev => prev.filter(item => item.id !== id));
  };

  const openOriginal = (id: string) => {
      navigator.clipboard.writeText(id);
      alert("Code copied! You can use this to search on the home page.");
      navigate('/');
  };

  return (
    <div className="app-container" style={{padding:0}}>
      <NavBar user={user} />
      
      <main className="content-area" style={{marginTop:'60px', padding:'20px', maxWidth:'600px'}}>
          
          <div style={{textAlign:'left', marginBottom:'30px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                  <h1 style={{fontSize:'1.8rem', display:'flex', alignItems:'center', gap:'10px', margin:0}}>
                      <FolderHeart color="#4da6a9" size={28}/> My Wallet
                  </h1>
                  <p style={{color:'#666'}}>Your collection.</p>
              </div>
              <button onClick={() => loadWallet(user)} style={{background:'none', border:'none', cursor:'pointer', color:'#4da6a9'}}>
                  <RefreshCw size={20}/>
              </button>
          </div>

          <WalletList 
              items={walletItems} 
              loading={loading} 
              onRemove={removeFromWallet} 
              onView={openOriginal} 
          />

      </main>
    </div>
  );
}
