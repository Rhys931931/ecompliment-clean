import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, TrendingUp, ArrowDownLeft, ArrowUpRight, CreditCard, ShoppingBag } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';

export default function BalancePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchData(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchData = async (uid: string) => {
    try {
      // 1. Get Balance from WALLET (Federated Vault)
      const walletDoc = await getDoc(doc(db, "wallets", uid));
      if (walletDoc.exists()) {
        setBalance(walletDoc.data().balance || 0);
      }

      // 2. Get History
      const q = query(collection(db, "transactions"), where("uid", "==", uid), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      setTransactions(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (e) {
      console.error("Balance fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', maxWidth:'800px', width:'100%', padding:'20px'}}>
        
        {/* HEADER */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#666'}}>
                <ArrowLeft size={18} /> Back
            </button>
            <h1 style={{margin:0, fontSize:'1.5rem', color:'#333', display:'flex', alignItems:'center', gap:'10px'}}>
                Wallet <Coins size={24} fill="#f59e0b" color="#b45309"/>
            </h1>
        </div>

        {/* MAIN BALANCE CARD */}
        <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
            borderRadius:'24px', padding:'30px', color:'white', 
            boxShadow:'0 10px 30px rgba(0,0,0,0.15)', marginBottom:'25px', position:'relative', overflow:'hidden'
        }}>
            <div style={{position:'relative', zIndex:2}}>
                <div style={{fontSize:'0.9rem', opacity:0.7, marginBottom:'5px', textTransform:'uppercase', letterSpacing:'2px'}}>Total Balance</div>
                <div style={{fontSize:'3.5rem', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px', textShadow:'0 2px 10px rgba(0,0,0,0.3)'}}>
                    {balance.toLocaleString()} 
                    <span style={{fontSize:'1.2rem', background:'rgba(255,255,255,0.2)', padding:'4px 12px', borderRadius:'20px'}}>COINS</span>
                </div>
            </div>
            {/* Decorative BG Icon */}
            <Coins size={180} style={{position:'absolute', right:'-30px', bottom:'-40px', opacity:0.1, transform:'rotate(-20deg)'}} />
        </div>

        {/* ACTION BUTTONS */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'30px'}}>
            <button 
                onClick={() => alert("Payment gateway coming soon!")}
                style={{
                    background:'white', border:'1px solid #eee', borderRadius:'16px', padding:'20px', 
                    cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px',
                    boxShadow:'0 4px 10px rgba(0,0,0,0.02)'
                }}
            >
                <div style={{background:'#dbeafe', width:'50px', height:'50px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#2563eb'}}>
                    <CreditCard size={24} />
                </div>
                <div style={{fontWeight:'bold', color:'#333'}}>Add Funds</div>
            </button>

            <button 
                onClick={() => navigate('/marketplace')}
                style={{
                    background:'white', border:'1px solid #eee', borderRadius:'16px', padding:'20px', 
                    cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px',
                    boxShadow:'0 4px 10px rgba(0,0,0,0.02)'
                }}
            >
                <div style={{background:'#fef3c7', width:'50px', height:'50px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#d97706'}}>
                    <ShoppingBag size={24} />
                </div>
                <div style={{fontWeight:'bold', color:'#333'}}>Redeem</div>
            </button>
        </div>

        {/* TRANSACTION HISTORY */}
        <h3 style={{color:'#666', fontSize:'1rem', marginBottom:'15px', display:'flex', alignItems:'center', gap:'8px'}}>
            <TrendingUp size={18} /> Transaction History
        </h3>
        
        <div className="fade-in">
            {loading ? (
                 <div style={{textAlign:'center', padding:'40px', color:'#999'}}>Loading history...</div>
            ) : transactions.length === 0 ? (
                 <div style={{textAlign:'center', padding:'40px', color:'#999', background:'white', borderRadius:'12px', border:'1px solid #eee'}}>
                    <p>No transactions yet.</p>
                 </div>
            ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    {transactions.map(t => (
                        <div key={t.id} style={{background:'white', padding:'15px', borderRadius:'12px', border:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                                <div style={{
                                    width:'40px', height:'40px', borderRadius:'10px', 
                                    background: t.amount > 0 ? '#dcfce7' : '#fee2e2', 
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    color: t.amount > 0 ? '#166534' : '#991b1b'
                                }}>
                                    {t.amount > 0 ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                                </div>
                                <div>
                                    <div style={{fontWeight:'bold', fontSize:'0.95rem', color:'#333'}}>{t.description || 'Transaction'}</div>
                                    <div style={{fontSize:'0.75rem', color:'#999'}}>
                                        {t.timestamp?.seconds ? new Date(t.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown Date'}
                                    </div>
                                </div>
                            </div>
                            <div style={{fontWeight:'bold', fontSize:'1.1rem', color: t.amount > 0 ? '#166534' : '#333'}}>
                                {t.amount > 0 ? '+' : ''}{t.amount}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </main>
    </div>
  );
}
