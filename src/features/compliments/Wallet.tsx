import { useState, useEffect } from 'react';
import { FolderHeart, RefreshCw } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
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
        else setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadWallet = async (currentUser: any) => {
      setLoading(true);
      try {
          // 1. THE "SHARED STAKE" QUERY
          // We ask the DB: "Find cards where *I* am the official claimer."
          // This works even if you switch phones.
          const q = query(
              collection(db, "compliments"), 
              where("claimer_uid", "==", currentUser.uid),
              orderBy("approved_at", "desc")
          );
          
          const snap = await getDocs(q);
          const items: WalletItem[] = [];

          for (const d of snap.docs) {
              const data = d.data();
              
              // Load Ads (Coupons) if attached
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
                  id: d.id,
                  sender: data.sender_display_name || data.sender || "Anonymous",
                  message: data.message,
                  date: data.approved_at || data.timestamp,
                  ads: adsList
              });
          }

          setWalletItems(items);

      } catch (e) {
          console.error("Wallet Load Error:", e);
      } finally {
          setLoading(false);
      }
  };

  const openChat = async (complimentId: string) => {
      // Find the chat associated with this compliment
      // Since I am the claimer, the chat ID is `chat_{complimentId}_{myUid}`
      const chatId = `chat_${complimentId}_${user.uid}`;
      navigate(`/chat/${chatId}`);
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
                  <p style={{color:'#666'}}>Gifts you have claimed.</p>
              </div>
              <button onClick={() => loadWallet(user)} style={{background:'none', border:'none', cursor:'pointer', color:'#4da6a9'}}>
                  <RefreshCw size={20}/>
              </button>
          </div>

          {!user ? (
              <div style={{textAlign:'center', padding:'40px'}}>
                  <p>Please log in to see your wallet.</p>
                  <button onClick={() => navigate('/login')} className="claim-btn">Log In</button>
              </div>
          ) : (
              <WalletList 
                  items={walletItems} 
                  loading={loading} 
                  onRemove={() => alert("You cannot delete a permanent record.")} 
                  onView={openChat} 
              />
          )}

      </main>
    </div>
  );
}
