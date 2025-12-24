import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, AlertCircle } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'; 
import { db, auth } from '../../../config/firebase.prod';

export default function AdsTab() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [offer, setOffer] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [color, setColor] = useState('#4da6a9');
  const [ownerEmail, setOwnerEmail] = useState('');

  useEffect(() => { loadAds(); }, []);

  const loadAds = async () => {
      try {
          const snap = await getDocs(collection(db, "ads"));
          setAds(snap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch(e) { console.error(e); }
      setLoading(false);
  };

  const handleCreateAd = async () => { 
      if (!name || !offer) return; 
      await addDoc(collection(db, "ads"), { name, offer, coupon_code: couponCode, color, owner_email: ownerEmail || auth.currentUser?.email, createdAt: serverTimestamp(), views: 0, claims: 0, status: 'active' }); 
      setName(''); setOffer(''); setCouponCode(''); alert("Ad Created!"); loadAds(); 
  };
  const handleDeleteAd = async (id: string) => { if(!confirm("Delete?")) return; await deleteDoc(doc(db, "ads", id)); loadAds(); };
  const handleApproveAd = async (id: string) => { await updateDoc(doc(db, "ads", id), { status: 'active' }); loadAds(); };

  const pendingAds = ads.filter(a => a.status === 'pending');
  const activeAds = ads.filter(a => a.status !== 'pending');

  if(loading) return <div>Loading Ads...</div>;

  return (
      <div className="result-card" style={{textAlign:'left'}}>
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

          <h3>Create New Ad Unit</h3>
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
  );
}
