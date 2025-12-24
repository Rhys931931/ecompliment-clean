import { useState, useEffect, useRef } from 'react';
import { 
  Shield, Layout, Users, Printer, Image as ImageIcon, Trash2, 
  Plus, Lock, Unlock, Coins, Download, ExternalLink, ShoppingCart, Truck, CheckCircle, MessageSquare, Edit2, PackagePlus, AlertCircle, Check, Eye, Palette
} from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, increment, writeBatch } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import NavBar from '../../components/NavBar';
import PrintableCard from '../../components/PrintableCard';
import type { ThemeData } from '../../types'; 
import '../../App.css';

interface AdData { id: string; name: string; offer: string; color: string; coupon_code: string; owner_email?: string; status?: string; }
interface UserData { id: string; email: string; display_name: string; balance: number; master_pin: string; economy_unlocked?: boolean; photo_url?: string; }
interface OrderData { id: string; user_email: string; uid: string; item_name: string; quantity?: number; total_price?: number; theme_id?: string; status: 'pending' | 'shipped'; timestamp: any; }
interface ComplimentData { id: string; sender: string; recipient_name: string; message: string; search_code?: string; timestamp: any; }

export default function SuperAdmin() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ads' | 'users' | 'themes' | 'print' | 'orders' | 'compliments' | 'visuals'>('orders');
  const [loading, setLoading] = useState(true);
  
  const [ads, setAds] = useState<AdData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [themes, setThemes] = useState<ThemeData[]>([]); 
  const [orders, setOrders] = useState<OrderData[]>([]); 
  const [compliments, setCompliments] = useState<ComplimentData[]>([]);

  // Forms
  const [name, setName] = useState('');
  const [offer, setOffer] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [color, setColor] = useState('#4da6a9');
  const [ownerEmail, setOwnerEmail] = useState('');
  
  const printRef = useRef<HTMLDivElement>(null);
  const [printCode, setPrintCode] = useState('12345678');
  const [printTheme, setPrintTheme] = useState<ThemeData | null>(null);
  const [printCustomer, setPrintCustomer] = useState<{photo?: string, pin: string}>({ pin: 'PENDING' });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const allowedAdmins = ['rhys@tvmenuswvc.com', 'rhyshaney@gmail.com']; 
        if (allowedAdmins.includes(currentUser.email || '')) {
            setUser(currentUser);
            loadAllData();
        } else {
            alert("Access Denied.");
            navigate('/dashboard');
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadAllData = async () => {
      setLoading(true);
      try {
          const adsSnap = await getDocs(collection(db, "ads"));
          setAds(adsSnap.docs.map(d => ({id: d.id, ...d.data()} as AdData)));
          
          const usersSnap = await getDocs(collection(db, "users"));
          setUsers(usersSnap.docs.map(d => ({id: d.id, ...d.data()} as UserData)));

          const themesSnap = await getDocs(collection(db, "themes"));
          const loadedThemes = themesSnap.docs.map(d => ({id: d.id, ...d.data()} as ThemeData));
          setThemes(loadedThemes);
          if (loadedThemes.length > 0 && !printTheme) setPrintTheme(loadedThemes[0]);

          const ordersQuery = query(collection(db, "orders"), orderBy("timestamp", "desc"));
          const ordersSnap = await getDocs(ordersQuery);
          setOrders(ordersSnap.docs.map(d => ({id: d.id, ...d.data()} as OrderData)));

          const compSnap = await getDocs(collection(db, "compliments"));
          setCompliments(compSnap.docs.map(d => ({id: d.id, ...d.data()} as ComplimentData)));

      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
  };

  const handleCreateAd = async () => { if (!name || !offer) return; await addDoc(collection(db, "ads"), { name, offer, coupon_code: couponCode, color, owner_email: ownerEmail || user.email, createdAt: serverTimestamp(), views: 0, claims: 0, status: 'active' }); setName(''); setOffer(''); setCouponCode(''); alert("Ad Created!"); loadAllData(); };
  const handleDeleteAd = async (id: string) => { if(!confirm("Delete?")) return; await deleteDoc(doc(db, "ads", id)); loadAllData(); };
  const handleApproveAd = async (id: string) => { await updateDoc(doc(db, "ads", id), { status: 'active' }); loadAllData(); };
  const toggleEconomyLock = async (userId: string, currentStatus: boolean) => { await updateDoc(doc(db, "users", userId), { economy_unlocked: !currentStatus }); setUsers(prev => prev.map(u => u.id === userId ? {...u, economy_unlocked: !currentStatus} : u)); };
  const handleGrantCoins = async (userId: string) => { if(!confirm("Grant 100 Coins to Wallet?")) return; await updateDoc(doc(db, "wallets", userId), { balance: increment(100) }); loadAllData(); alert("Coins minted."); };
  const handleDeleteUser = async (userId: string) => { if(!confirm("⚠️ DANGER: Delete user?")) return; await deleteDoc(doc(db, "users", userId)); setUsers(prev => prev.filter(u => u.id !== userId)); };
  const handleResetPin = async (userId: string) => { const newPin = prompt("Enter new 5-digit Master PIN:"); if(!newPin || newPin.length !== 5) return alert("Must be 5 digits."); await updateDoc(doc(db, "users", userId), { master_pin: newPin }); loadAllData(); alert("PIN Updated!"); };
  const handleDeleteCompliment = async (id: string) => { if(!confirm("Delete compliment?")) return; await deleteDoc(doc(db, "compliments", id)); setCompliments(prev => prev.filter(c => c.id !== id)); };
  const handleDeleteTheme = async (id: string) => { if (confirm("Delete?")) { await deleteDoc(doc(db, "themes", id)); loadAllData(); }};
  const handleSeedThemes = async () => { if(!confirm("Create starter themes?")) return; const batch = writeBatch(db); const starters = [ { name: 'Classic Teal', primaryColor: '#4da6a9', textColor: '#333333', backgroundImageUrl: '' }, { name: 'Midnight', primaryColor: '#1e293b', textColor: '#ffffff', backgroundImageUrl: '' }, { name: 'Gold Standard', primaryColor: '#d97706', textColor: '#ffffff', backgroundImageUrl: '' } ]; starters.forEach(t => { const ref = doc(collection(db, 'themes')); batch.set(ref, { ...t, createdAt: serverTimestamp() }); }); await batch.commit(); loadAllData(); alert("Themes created!"); };
  const handleMarkShipped = async (orderId: string) => { if(confirm("Complete?")) { await updateDoc(doc(db, "orders", orderId), { status: 'shipped' }); loadAllData(); }};
  
  const handleLoadOrderToPrinter = async (order: OrderData) => { 
      const customer = users.find(u => u.id === order.uid); 
      const theme = themes.find(t => t.id === order.theme_id); 
      if (customer && theme) { 
          setPrintCustomer({ photo: customer.photo_url, pin: customer.master_pin || 'PENDING' }); 
          setPrintTheme(theme); 
          setPrintCode(''); 
          setActiveTab('print'); 
          alert("Loaded."); 
      }
  };
  
  const downloadCardImage = async () => { if (printRef.current) { const dataUrl = await toPng(printRef.current, { cacheBust: true, pixelRatio: 6 }); saveAs(dataUrl, `eCompliment-${printCode}.png`); }};
  const generateRandomCode = () => { setPrintCode(Math.floor(10000000 + Math.random() * 90000000).toString()); };

  if (loading) return <div className="app-container"><p style={{marginTop:'100px'}}>Loading...</p></div>;

  const pendingAds = ads.filter(a => a.status === 'pending');
  const activeAds = ads.filter(a => a.status !== 'pending');

  return (
    <div className="app-container" style={{padding:0}}>
      <style>{`.admin-tabs-container { display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px; white-space: nowrap; scrollbar-width: none; } .admin-tabs-container::-webkit-scrollbar { display: none; } @media (min-width: 768px) { .admin-tabs-container { flex-wrap: wrap; overflow-x: visible; white-space: normal; } }`}</style>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop:'60px', padding:'20px', maxWidth:'1000px', width:'100%', boxSizing:'border-box'}}>
          <div style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h1 style={{fontSize:'1.8rem', display:'flex', alignItems:'center', gap:'10px', margin:0}}><Shield color="#ef4444" size={28}/> Super Admin</h1>
          </div>

          <div className="admin-tabs-container">
              {[
                  { id: 'orders', icon: <ShoppingCart size={18}/>, label: `Orders` },
                  { id: 'compliments', icon: <MessageSquare size={18}/>, label: `DB Cleanup` },
                  { id: 'users', icon: <Users size={18}/>, label: 'Users' },
                  { id: 'ads', icon: <Layout size={18}/>, label: 'Ad Manager' },
                  { id: 'themes', icon: <ImageIcon size={18}/>, label: 'Themes' },
                  { id: 'print', icon: <Printer size={18}/>, label: 'Print Lab' },
                  { id: 'visuals', icon: <Eye size={18}/>, label: 'Visuals' }
              ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className="claim-btn" style={{background: activeTab===tab.id ? '#1e293b' : 'white', color: activeTab===tab.id ? 'white' : '#64748b', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      {tab.icon} {tab.label}
                  </button>
              ))}
          </div>

          {activeTab === 'orders' && (
              <div className="result-card" style={{textAlign:'left'}}>
                  <h3>Incoming Orders</h3>
                  {orders.length === 0 ? <p style={{color:'#666'}}>No orders yet.</p> : (
                      <div style={{display:'grid', gap:'15px'}}>
                          {orders.map(order => (
                              <div key={order.id} style={{padding:'15px', background: order.status === 'shipped' ? '#f0fdfa' : 'white', border:'1px solid #eee', borderRadius:'12px'}}>
                                  <div style={{fontWeight:'bold'}}>{order.item_name}</div>
                                  <div style={{fontSize:'0.9rem', color:'#666'}}>{order.user_email}</div>
                                  <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                                      {order.status === 'pending' && <button onClick={() => handleLoadOrderToPrinter(order)} style={{background:'#1e293b', color:'white', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}><Printer size={14}/> Print</button>}
                                      {order.status === 'pending' ? <button onClick={() => handleMarkShipped(order.id)} style={{background:'white', color:'#166534', border:'1px solid #166534', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}><Truck size={14}/> Ship</button> : <div style={{color:'#166534', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}><CheckCircle size={14}/> Shipped</div>}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'visuals' && (
              <div className="result-card" style={{textAlign:'left'}}>
                  <h3 style={{marginBottom:'20px'}}>Theme Visualizer</h3>
                  <div style={{display:'grid', gap:'40px'}}>
                      {themes.map(theme => (
                          <div key={theme.id} style={{borderBottom:'1px solid #eee', paddingBottom:'40px'}}>
                              <h4 style={{margin:'0 0 15px 0'}}>{theme.name}</h4>
                              <div style={{display:'flex', flexWrap:'wrap', gap:'20px', alignItems:'flex-start'}}>
                                  
                                  {/* HOMEPAGE PREVIEW */}
                                  <div>
                                      <div style={{fontSize:'0.8rem', color:'#666', marginBottom:'5px', fontWeight:'bold'}}>HOME SCREEN</div>
                                      <div style={{
                                          width:'200px', height:'350px', 
                                          backgroundImage: theme.backgroundImageUrl ? `url(${theme.backgroundImageUrl})` : 'none',
                                          backgroundColor: '#f8fafc',
                                          backgroundSize:'cover', backgroundPosition:'center',
                                          borderRadius:'20px', border:'4px solid #333',
                                          position:'relative', overflow:'hidden',
                                          display:'flex', alignItems:'center', justifyContent:'center'
                                      }}>
                                          <div style={{background:'rgba(255,255,255,0.9)', padding:'15px', borderRadius:'12px', width:'80%', textAlign:'center', backdropFilter:'blur(5px)'}}>
                                              <div style={{fontSize:'0.8rem', fontWeight:'bold', color:'#333'}}>Redeem Card</div>
                                              <div style={{height:'30px', background:'white', border:'1px solid #ddd', borderRadius:'6px', margin:'10px 0'}}></div>
                                              <div style={{height:'30px', background: theme.primaryColor, borderRadius:'6px'}}></div>
                                          </div>
                                      </div>
                                  </div>

                                  {/* CARD PREVIEW */}
                                  <div>
                                      <div style={{fontSize:'0.8rem', color:'#666', marginBottom:'5px', fontWeight:'bold'}}>PHYSICAL CARD</div>
                                      <PrintableCard 
                                          theme={theme} 
                                          scale={0.25} 
                                          qrCodeValue="12345678" 
                                          userPin="ABC12" 
                                      />
                                  </div>

                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'ads' && (
              <div className="result-card" style={{textAlign:'left'}}>
                  {/* PENDING APPROVALS */}
                  {pendingAds.length > 0 && (
                      <div style={{marginBottom:'30px', background:'#fffbeb', padding:'15px', borderRadius:'12px', border:'2px solid #fcd34d'}}>
                          <h3 style={{margin:'0 0 15px 0', color:'#b45309', display:'flex', alignItems:'center', gap:'10px'}}><AlertCircle/> Pending Approvals</h3>
                          <div style={{display:'grid', gap:'10px'}}>
                              {pendingAds.map(ad => (
                                  <div key={ad.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', background:'white', borderRadius:'8px', borderLeft:`4px solid ${ad.color}`}}>
                                      <div><div style={{fontWeight:'bold'}}>{ad.name}</div><div style={{fontSize:'0.8rem', color:'#666'}}>{ad.offer}</div></div>
                                      <div style={{display:'flex', gap:'10px'}}>
                                          <button onClick={() => handleApproveAd(ad.id)} style={{background:'#16a34a', color:'white', border:'none', borderRadius:'6px', padding:'8px', cursor:'pointer', display:'flex', gap:'5px'}}><Check size={16}/> Approve</button>
                                          <button onClick={() => handleDeleteAd(ad.id)} style={{color:'#ef4444', background:'none', border:'none', cursor:'pointer'}}><Trash2 size={18}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <h3>Create New Ad Unit (Admin)</h3>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                      <div><label className="input-label">Business Name</label><input className="text-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bob's Burgers"/></div>
                      <div><label className="input-label">Ad Color</label><input type="color" className="text-input" value={color} onChange={e => setColor(e.target.value)} style={{height:'45px', padding:'5px'}}/></div>
                  </div>
                  <label className="input-label" style={{marginTop:'10px'}}>The Offer</label><input className="text-input" value={offer} onChange={e => setOffer(e.target.value)} placeholder="e.g. Free Fries"/>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'10px'}}>
                      <div><label className="input-label">Coupon Code</label><input className="text-input" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="e.g. YUMMY123"/></div>
                      <div><label className="input-label">Owner Email</label><input className="text-input" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="owner@gmail.com"/></div>
                  </div>
                  <button onClick={handleCreateAd} className="claim-btn" style={{marginTop:'20px'}}><Plus size={18}/> Create Ad</button>
                  
                  <div style={{borderTop:'1px solid #eee', marginTop:'30px', paddingTop:'20px'}}>
                      <h4 style={{margin:'0 0 15px 0', color:'#666'}}>Active Ads ({activeAds.length})</h4>
                      <div style={{display:'grid', gap:'10px'}}>
                          {activeAds.map(ad => (
                              <div key={ad.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', background:'#f8fafc', borderRadius:'8px', borderLeft:`4px solid ${ad.color}`}}>
                                  <div><div style={{fontWeight:'bold'}}>{ad.name}</div><div style={{fontSize:'0.8rem', color:'#666'}}>{ad.offer}</div></div>
                                  <button onClick={() => handleDeleteAd(ad.id)} style={{color:'#ef4444', background:'none', border:'none', cursor:'pointer'}}><Trash2 size={18}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'compliments' && (
              <div className="result-card" style={{textAlign:'left'}}>
                  <h3>Database Cleanup</h3>
                  <div style={{display:'grid', gap:'10px'}}>
                      {compliments.map(c => (<div key={c.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #eee'}}><div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}><div style={{fontWeight:'bold'}}>{c.recipient_name}</div><div style={{fontSize:'0.8rem', color:'#666'}}>{c.message ? c.message.substring(0,40) : 'No message'}...</div><div style={{fontSize:'0.7rem', color: c.search_code ? '#166534' : '#b91c1c', fontWeight:'bold'}}>{c.search_code ? `Code: ${c.search_code}` : '⚠️ OLD DATA (No Code)'}</div></div><button onClick={() => handleDeleteCompliment(c.id)} style={{color:'#ef4444', background:'none', border:'none', cursor:'pointer'}}><Trash2 size={18}/></button></div>))}
                  </div>
              </div>
          )}

          {activeTab === 'users' && (
              <div className="result-card" style={{textAlign:'left'}}>
                  <h3>User Database ({users.length})</h3>
                  <div style={{display:'grid', gap:'10px'}}>
                      {users.map(u => (<div key={u.id} style={{padding:'15px', background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0'}}><div style={{display:'flex', justifyContent:'space-between'}}><div style={{fontWeight:'bold'}}>{u.display_name}</div><div style={{fontSize:'0.8rem', fontFamily:'monospace'}}>PIN: {u.master_pin || '❌ BROKEN'}</div></div><div style={{fontSize:'0.8rem', color:'#666', marginBottom:'10px'}}>{u.email}</div><div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}><button onClick={() => handleResetPin(u.id)} style={{background:'#e0f2fe', color:'#0369a1', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.8rem'}}><Edit2 size={14}/> Reset PIN</button><button onClick={() => handleDeleteUser(u.id)} style={{background:'#fee2e2', color:'#b91c1c', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.8rem'}}><Trash2 size={14}/> Delete</button><button onClick={() => handleGrantCoins(u.id)} style={{background:'#dcfce7', color:'#166534', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.8rem'}}><Coins size={14}/> Grant 100</button><button onClick={() => toggleEconomyLock(u.id, u.economy_unlocked || false)} style={{display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold', background: u.economy_unlocked ? '#dcfce7' : '#fee2e2', color: u.economy_unlocked ? '#166534' : '#b91c1c'}}>{u.economy_unlocked ? <><Unlock size={14}/> Open</> : <><Lock size={14}/> Lock</>}</button></div></div>))}
                  </div>
              </div>
          )}

          {activeTab === 'themes' && (
            <div className="result-card" style={{textAlign:'left'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <h3>Theme Manager</h3>
                    <button onClick={() => navigate('/admin/builder')} style={{background:'#8b5cf6', color:'white', border:'none', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'5px', fontWeight:'bold'}}><Palette size={18}/> Open Theme Studio</button>
                </div>
                
                <button onClick={handleSeedThemes} style={{background:'#dcfce7', color:'#166534', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'5px', fontWeight:'bold', marginBottom:'20px'}}><PackagePlus size={18}/> Seed Starters</button>

                <div style={{borderTop:'1px solid #eee', paddingTop:'20px'}}>
                    <h4 style={{margin:'0 0 15px 0', color:'#666'}}>Existing Themes ({themes.length})</h4>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'15px'}}>
                        {themes.map(theme => (
                            <div key={theme.id} style={{border:'1px solid #eee', borderRadius:'8px', overflow:'hidden', position:'relative'}}>
                                <div style={{height:'100px', backgroundImage: theme.backgroundImageUrl ? `url(${theme.backgroundImageUrl})` : 'none', backgroundColor: theme.primaryColor, backgroundSize:'cover', backgroundPosition:'center', display:'flex', alignItems:'flex-end'}}>
                                    <div style={{width:'100%', padding:'5px 10px', backgroundColor: theme.primaryColor, color: theme.textColor, fontSize:'0.8rem', fontWeight:'bold'}}>{theme.name}</div>
                                </div>
                                <button onClick={() => theme.id && handleDeleteTheme(theme.id)} style={{position:'absolute', top:'5px', right:'5px', background:'rgba(255,255,255,0.8)', border:'none', borderRadius:'50%', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#ef4444'}}>
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'print' && (
              <div className="result-card" style={{textAlign:'left'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}><h3 style={{margin:0}}>Print Lab</h3><button onClick={downloadCardImage} className="claim-btn" style={{background:'#4da6a9'}}><Download size={18}/> Download PNG</button></div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'20px'}}>
                      <div style={{flex: '1 1 300px', border:'1px dashed #ccc', padding:'20px', display:'flex', justifyContent:'center', background:'#f8fafc', overflow:'auto'}}>
                          {printTheme ? (
                            <PrintableCard 
                                ref={printRef}
                                theme={printTheme}
                                qrCodeValue={printCode} 
                                scale={0.5}
                                userPhoto={printCustomer.photo} 
                                userPin={printCustomer.pin}     
                            />
                          ) : <p>Please create a theme first.</p>}
                      </div>
                      <div style={{flex: '1 1 300px', padding:'20px', background:'#f1f5f9', borderRadius:'12px'}}><label className="input-label" style={{marginBottom:'10px'}}>Test Theme Link:</label>{printTheme ? (<div style={{marginBottom:'20px', padding:'10px', background:'white', borderRadius:'6px', border:'1px solid #ddd', wordBreak:'break-all'}}><a href={`https://ecompliment.app/?theme=${printTheme.id}`} target="_blank" rel="noreferrer" style={{color:'#4da6a9', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px', textDecoration:'none'}}><ExternalLink size={16}/> Open Theme</a></div>) : <div style={{color:'#999'}}>Select a theme...</div>}<label className="input-label" style={{marginTop:'15px'}}>Generate New Code:</label><div style={{display:'flex', gap:'10px'}}><input className="text-input" value={printCode} onChange={e=>setPrintCode(e.target.value)} /><button onClick={generateRandomCode} style={{padding:'8px', cursor:'pointer'}}>🎲</button></div><label className="input-label" style={{marginTop:'15px'}}>Override Theme:</label><div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>{themes.map(theme => (<button key={theme.id} onClick={()=>setPrintTheme(theme)} style={{padding:'5px 10px', cursor:'pointer', border: printTheme?.id === theme.id ? '2px solid #4da6a9' : '1px solid #ccc', backgroundColor: printTheme?.id === theme.id ? '#e6fffa' : 'white', borderRadius:'4px'}}>{theme.name}</button>))}</div></div>
                  </div>
              </div>
          )}

      </main>
    </div>
  );
}
