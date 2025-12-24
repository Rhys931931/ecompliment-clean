import { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, Users, Eye, CheckCircle, Coins, History, ArrowUpRight, ArrowDownLeft, ArrowLeft, ExternalLink, Plus, Save } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import '../../App.css';

interface AdData { id: string; name: string; offer: string; views?: number; claims?: number; color: string; status?: string; }
interface Transaction { id: string; type: string; amount: number; description: string; timestamp: any; }

export default function BusinessDashboard() {
  const [user, setUser] = useState<any>(null);
  const [myAds, setMyAds] = useState<AdData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [blindKey, setBlindKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'history'>('overview');

  // Create Form State
  const [newName, setNewName] = useState('');
  const [newOffer, setNewOffer] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newColor, setNewColor] = useState('#4da6a9');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadBusinessData(currentUser);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadBusinessData = async (currentUser: any) => {
      try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
              setBalance(userDoc.data().balance || 0);
              setBlindKey(userDoc.data().blind_key || '');
          }

          const qAds = query(collection(db, "ads"), where("owner_email", "==", currentUser.email));
          const adsSnap = await getDocs(qAds);
          setMyAds(adsSnap.docs.map(d => ({id: d.id, ...d.data()} as AdData)));

          const qTrans = query(collection(db, "transactions"), where("uid", "==", currentUser.uid), orderBy("timestamp", "desc"), limit(20));
          const transSnap = await getDocs(qTrans);
          setTransactions(transSnap.docs.map(d => ({id: d.id, ...d.data()} as Transaction)));

      } catch (e) { console.error("Error loading data:", e); } finally { setLoading(false); }
  };

  const handleSubmitAd = async () => {
      if (!newName || !newOffer || !newCode) return alert("Please fill all fields.");
      
      try {
          await addDoc(collection(db, "ads"), {
              name: newName,
              offer: newOffer,
              coupon_code: newCode,
              color: newColor,
              owner_email: user.email,
              owner_id: blindKey, // LINK TO PROFILE
              status: 'pending',  // MODERATION QUEUE
              createdAt: serverTimestamp(),
              views: 0,
              claims: 0
          });
          
          alert("Campaign submitted for approval!");
          setNewName(''); setNewOffer(''); setNewCode('');
          setActiveTab('overview');
          loadBusinessData(user); // Refresh
      } catch(e) { console.error(e); alert("Submission failed."); }
  };

  const totalViews = myAds.reduce((acc, curr) => acc + (curr.views || 0), 0);

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop:'60px', padding:'20px', maxWidth:'800px'}}>
          <div style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                  <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#666', marginBottom:'5px'}}><ArrowLeft size={18} /> Back</button>
                  <h1 style={{fontSize:'1.8rem', display:'flex', alignItems:'center', gap:'10px', margin:0, color:'#333'}}><Briefcase color="#4da6a9" size={28}/> Business Portal</h1>
              </div>
              {blindKey && (
                  <button onClick={() => navigate(`/business/${blindKey}`)} className="claim-btn" style={{fontSize:'0.9rem', padding:'8px 12px', background:'white', border:'1px solid #4da6a9', color:'#4da6a9'}}>
                      <ExternalLink size={16}/> View Page
                  </button>
              )}
          </div>

          <div style={{display:'flex', gap:'10px', marginBottom:'20px', overflowX:'auto'}}>
              <button onClick={() => setActiveTab('overview')} className="claim-btn" style={{background: activeTab==='overview'?'#1e293b':'white', color: activeTab==='overview'?'white':'#64748b', border:'1px solid #cbd5e1'}}>Overview</button>
              <button onClick={() => setActiveTab('create')} className="claim-btn" style={{background: activeTab==='create'?'#1e293b':'white', color: activeTab==='create'?'white':'#64748b', border:'1px solid #cbd5e1'}}><Plus size={18}/> New Campaign</button>
              <button onClick={() => setActiveTab('history')} className="claim-btn" style={{background: activeTab==='history'?'#1e293b':'white', color: activeTab==='history'?'white':'#64748b', border:'1px solid #cbd5e1'}}><History size={18} style={{marginRight:'5px'}}/> Ledger</button>
          </div>

          {activeTab === 'create' && (
              <div className="result-card" style={{textAlign:'left'}}>
                  <h3 style={{marginTop:0}}>Draft New Campaign</h3>
                  <p style={{fontSize:'0.9rem', color:'#666', marginBottom:'20px'}}>Create a coupon. It will be reviewed by an admin before going live.</p>
                  
                  <div style={{marginBottom:'15px'}}>
                      <label className="input-label">Business Name (as it appears on card)</label>
                      <input className="text-input" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Joe's Coffee" />
                  </div>
                  <div style={{marginBottom:'15px'}}>
                      <label className="input-label">The Offer</label>
                      <input className="text-input" value={newOffer} onChange={e=>setNewOffer(e.target.value)} placeholder="e.g. Buy 1 Get 1 Free" />
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                      <div>
                          <label className="input-label">Coupon Code</label>
                          <input className="text-input" value={newCode} onChange={e=>setNewCode(e.target.value)} placeholder="JOE2025" />
                      </div>
                      <div>
                          <label className="input-label">Brand Color</label>
                          <input type="color" className="text-input" value={newColor} onChange={e=>setNewColor(e.target.value)} style={{height:'50px', padding:'5px'}} />
                      </div>
                  </div>
                  <button onClick={handleSubmitAd} className="claim-btn" style={{width:'100%', justifyContent:'center'}}><Save size={18}/> Submit for Approval</button>
              </div>
          )}

          {activeTab === 'overview' && (
              <>
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
                <h3 style={{fontSize:'0.9rem', color:'#888', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'15px', textAlign:'left'}}>My Campaigns ({myAds.length})</h3>
                <div className="dashboard-list">
                    {loading && <p>Loading...</p>}
                    {!loading && myAds.length === 0 && <p style={{color:'#999'}}>No campaigns yet.</p>}
                    {!loading && myAds.map(ad => (
                        <div key={ad.id} className="result-card" style={{borderLeft:`5px solid ${ad.color}`, padding:'20px', marginBottom:'15px', textAlign:'left', opacity: ad.status === 'pending' ? 0.7 : 1}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'15px'}}>
                                <div><div style={{fontWeight:'bold', fontSize:'1.2rem', color:'#333'}}>{ad.name}</div><div style={{color:'#666'}}>{ad.offer}</div></div>
                                <span style={{background: ad.status === 'pending' ? '#fef9c3' : '#dcfce7', color: ad.status === 'pending' ? '#854d0e' : '#166534', padding:'4px 8px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:'bold'}}>
                                    {ad.status === 'pending' ? 'PENDING' : 'ACTIVE'}
                                </span>
                            </div>
                            <div style={{display:'flex', gap:'20px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}><Eye size={18} color="#64748b"/><div><div style={{fontWeight:'bold', fontSize:'1.1rem'}}>{ad.views || 0}</div><div style={{fontSize:'0.7rem', color:'#999'}}>Views</div></div></div>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}><Users size={18} color="#4da6a9"/><div><div style={{fontWeight:'bold', fontSize:'1.1rem'}}>{ad.claims || 0}</div><div style={{fontSize:'0.7rem', color:'#999'}}>Claims</div></div></div>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}><CheckCircle size={18} color="#f59e0b"/><div><div style={{fontWeight:'bold', fontSize:'1.1rem'}}>{ad.views ? Math.round(((ad.claims || 0) / ad.views) * 100) : 0}%</div><div style={{fontSize:'0.7rem', color:'#999'}}>Conv. Rate</div></div></div>
                            </div>
                        </div>
                    ))}
                </div>
              </>
          )}

          {activeTab === 'history' && (
              <div className="dashboard-list">
                  {transactions.length === 0 && <p style={{color:'#999'}}>No transactions yet.</p>}
                  {transactions.map(t => (
                      <div key={t.id} className="result-card" style={{padding:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', textAlign:'left'}}>
                          <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                              <div style={{width:'40px', height:'40px', borderRadius:'50%', background: t.amount > 0 ? '#dcfce7' : '#fee2e2', display:'flex', alignItems:'center', justifyContent:'center'}}>{t.amount > 0 ? <ArrowDownLeft size={20} color="#166534"/> : <ArrowUpRight size={20} color="#b91c1c"/>}</div>
                              <div><div style={{fontWeight:'bold', color:'#333'}}>{t.description}</div><div style={{fontSize:'0.8rem', color:'#999'}}>{t.type.replace('_', ' ').toUpperCase()}</div></div>
                          </div>
                          <div style={{fontWeight:'bold', fontSize:'1.1rem', color: t.amount > 0 ? '#166534' : '#b91c1c'}}>{t.amount > 0 ? '+' : ''}{t.amount}</div>
                      </div>
                  ))}
              </div>
          )}
      </main>
    </div>
  );
}
