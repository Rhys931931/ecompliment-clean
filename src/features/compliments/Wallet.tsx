import { useState, useEffect } from 'react';
import { Trash2, Search, Loader, FolderHeart, RefreshCw } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase.prod';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import '../../App.css';

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
        // Reload wallet when auth state changes to ensure user ID is available for self-healing
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
                  // If I am logged in, and this card has no owner, CLAIM IT!
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

          <div className="dashboard-list">
              {loading && <div style={{textAlign:'center'}}><Loader className="spin"/> Checking for cards...</div>}
              
              {!loading && walletItems.length === 0 && (
                  <div style={{padding:'30px', textAlign:'center', border:'1px dashed #ccc', borderRadius:'12px'}}>
                      <p style={{color:'#666'}}>Your wallet is empty.</p>
                      <small>Scan a QR code to start your collection.</small>
                  </div>
              )}

              {walletItems.map(item => (
                  <div key={item.id} className="result-card" style={{padding:'20px', marginBottom:'20px', textAlign:'left'}}>
                      
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                          <div>
                              <div style={{fontWeight:'bold', fontSize:'1.2rem', color:'#333'}}>{item.sender}</div>
                              <div style={{fontSize:'0.8rem', color:'#666'}}>
                                  "{item.message ? item.message.substring(0, 50) + (item.message.length > 50 ? '...' : '') : 'You are awesome!'}"
                              </div>
                          </div>
                          <button onClick={() => removeFromWallet(item.id)} style={{background:'none', border:'none', cursor:'pointer', color:'#999'}}>
                              <Trash2 size={18}/>
                          </button>
                      </div>

                      <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                          {item.ads.length === 0 && <p style={{fontSize:'0.8rem', color:'#ccc', fontStyle:'italic'}}>No coupons attached.</p>}
                          
                          {item.ads.map(ad => (
                              <div key={ad.id} style={{background:'#f9fafb', borderLeft:`4px solid ${ad.color}`, padding:'10px', borderRadius:'6px'}}>
                                  <div style={{fontWeight:'bold', fontSize:'1rem'}}>{ad.name}</div>
                                  <div style={{fontSize:'0.8rem', color:'#555'}}>{ad.offer}</div>
                                  <div style={{marginTop:'5px', fontSize:'0.75rem', fontWeight:'bold', color: ad.color, border:'1px dashed #ddd', display:'inline-block', padding:'2px 6px', borderRadius:'4px', background:'white'}}>
                                      CODE: {ad.coupon_code}
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
                          <button onClick={() => openOriginal(item.id)} className="claim-btn" style={{fontSize:'0.9rem', padding:'10px', background:'white', color:'#4da6a9', border:'1px solid #4da6a9'}}>
                              <Search size={16}/> View Chat
                          </button>
                      </div>

                  </div>
              ))}
          </div>

      </main>
    </div>
  );
}