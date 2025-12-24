import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Coins, Check, Package, Loader, Palette, Printer } from 'lucide-react';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';
import PrintableCard from '../../components/PrintableCard'; 
import type { ThemeData } from '../../types'; // <--- FIXED: Added 'type'

const PACK_SIZES = [
    { count: 5, price: 50, label: 'Starter Pack' },
    { count: 20, price: 180, label: 'Pro Pack' },
    { count: 50, price: 400, label: 'Influencer Pack' },
];

export default function Marketplace() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [myPin, setMyPin] = useState('.....'); 
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ThemeData | null>(null);
  const [selectedPack, setSelectedPack] = useState(PACK_SIZES[0]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadStoreData(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadStoreData = async (uid: string) => {
      try {
          const walletDoc = await getDoc(doc(db, "wallets", uid));
          if (walletDoc.exists()) setBalance(walletDoc.data().balance || 0);

          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) setMyPin(userDoc.data().master_pin || 'PENDING');

          const themesSnap = await getDocs(collection(db, "themes"));
          const loadedThemes = themesSnap.docs.map(d => ({id: d.id, ...d.data()} as ThemeData));
          setThemes(loadedThemes);
          if (loadedThemes.length > 0) setSelectedTheme(loadedThemes[0]);

      } catch(e) { console.error("Store load error", e); }
      setLoading(false);
  };

  const handlePurchase = async () => {
      if (!selectedTheme || !user) return;
      if (balance < selectedPack.price) { alert("Not enough coins!"); return; }
      if (!confirm(`Order ${selectedPack.count} cards?`)) return;

      setPurchasing(true);
      try {
          await updateDoc(doc(db, "wallets", user.uid), { balance: increment(-selectedPack.price) });
          await addDoc(collection(db, "transactions"), { uid: user.uid, type: 'merch_purchase', amount: -selectedPack.price, description: `Ordered ${selectedTheme.name} Cards`, timestamp: serverTimestamp() });
          await addDoc(collection(db, "orders"), { uid: user.uid, user_email: user.email, item_name: `${selectedTheme.name} Card Pack`, quantity: selectedPack.count, total_price: selectedPack.price, theme_id: selectedTheme.id, status: 'pending', timestamp: serverTimestamp() });
          setBalance(prev => prev - selectedPack.price);
          alert("Order Placed!");
          navigate('/dashboard');
      } catch (e) { console.error(e); alert("Error."); } finally { setPurchasing(false); }
  };

  if (loading) return <div className="app-container"><Loader className="spin" size={40} color="#4da6a9"/></div>;

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', maxWidth:'900px', width:'100%', padding:'20px'}}>
        
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}>
            <div>
                <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#666', marginBottom:'5px'}}><ArrowLeft size={18} /> Back</button>
                <h1 style={{margin:0, color:'#333', display:'flex', alignItems:'center', gap:'10px'}}><ShoppingBag size={24} fill="#f59e0b" color="#b45309"/> Card Boutique</h1>
            </div>
            <div style={{background:'white', padding:'8px 15px', borderRadius:'20px', border:'1px solid #ddd', fontWeight:'bold', color:'#333', display:'flex', alignItems:'center', gap:'6px'}}><Coins size={16} color="#f59e0b"/> {balance} Coins</div>
        </div>

        {/* PRINT STATION LINK */}
        <div onClick={() => navigate('/print-station')} className="result-card" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color:'white', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
            <div>
                <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Printer size={20}/> DIY Print Station</h3>
                <p style={{margin:'5px 0 0 0', opacity:0.8, fontSize:'0.9rem'}}>Download your Master Card PDF for free.</p>
            </div>
            <ArrowLeft size={20} style={{transform:'rotate(180deg)'}}/>
        </div>

        <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap:'25px', alignItems:'start'}}>
            {/* LEFT: PREVIEW */}
            <div className="result-card" style={{position:'sticky', top:'80px', textAlign:'center'}}>
                <h3 style={{marginTop:0, fontSize:'0.9rem', color:'#999', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'15px'}}>Live Preview</h3>
                {selectedTheme ? (
                    <div style={{borderRadius:'12px', overflow:'hidden', boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}}>
                         <PrintableCard 
                            theme={selectedTheme} 
                            scale={0.28} 
                            userPhoto={user?.photoURL} 
                            userPin={myPin} 
                         />
                    </div>
                ) : <div style={{padding:'40px'}}>No themes.</div>}
            </div>

            {/* RIGHT: CONTROLS */}
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                <div className="result-card">
                    <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}><Palette size={20} color="#4da6a9"/> 1. Choose Style</h3>
                    <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'10px'}}>
                        {themes.map(theme => (
                             <div key={theme.id} onClick={() => setSelectedTheme(theme)} style={{display:'flex', alignItems:'center', gap:'15px', padding:'12px', borderRadius:'10px', cursor:'pointer', border: selectedTheme?.id === theme.id ? '2px solid #4da6a9' : '1px solid #eee', background: selectedTheme?.id === theme.id ? '#f0fdfa' : 'white'}}>
                                  <div style={{width:'50px', height:'50px', borderRadius:'8px', backgroundImage: `url(${theme.backgroundImageUrl})`, backgroundColor: theme.primaryColor, backgroundSize: 'cover', backgroundPosition:'center'}}></div>
                                  <div style={{flex:1}}><div style={{fontWeight:'bold', color:'#333'}}>{theme.name}</div></div>
                                  {selectedTheme?.id === theme.id && <Check size={14} color="#4da6a9"/>}
                              </div>
                        ))}
                    </div>
                </div>

                <div className="result-card">
                    <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}><Package size={20} color="#4da6a9"/> 2. Select Quantity</h3>
                    <div style={{display:'flex', gap:'10px'}}>
                        {PACK_SIZES.map(pack => (
                            <div key={pack.count} onClick={() => setSelectedPack(pack)} style={{flex:1, padding:'15px 10px', textAlign:'center', cursor:'pointer', borderRadius:'10px', border: selectedPack.count === pack.count ? '2px solid #f59e0b' : '1px solid #eee', background: selectedPack.count === pack.count ? '#fffbeb' : 'white'}}>
                                <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#333'}}>{pack.count}</div>
                                <div style={{fontSize:'0.9rem', color:'#f59e0b', fontWeight:'bold'}}>{pack.price} Coins</div>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handlePurchase} disabled={purchasing || balance < selectedPack.price || !selectedTheme} style={{width: '100%', padding:'18px', borderRadius:'12px', border:'none', fontSize: '1.1rem', fontWeight:'bold', cursor: 'pointer', background: (balance >= selectedPack.price && selectedTheme) ? '#1e293b' : '#e2e8f0', color: (balance >= selectedPack.price && selectedTheme) ? 'white' : '#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                    {purchasing ? "Processing..." : <>Complete Order <Coins size={20}/></>}
                </button>
            </div>
        </div>
      </main>
    </div>
  );
}
