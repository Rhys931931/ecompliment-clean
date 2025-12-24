import { useState, useEffect } from 'react';
import { Eye, Users, CheckCircle, Save } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase.prod';

export default function CampaignManager() {
  const [myAds, setMyAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Form State
  const [newName, setNewName] = useState('');
  const [newOffer, setNewOffer] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newColor, setNewColor] = useState('#4da6a9');

  useEffect(() => { loadAds(); }, []);

  const loadAds = async () => {
      if (!auth.currentUser) return;
      try {
          const qAds = query(collection(db, "ads"), where("owner_email", "==", auth.currentUser.email));
          const adsSnap = await getDocs(qAds);
          setMyAds(adsSnap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch(e) { console.error(e); }
      setLoading(false);
  };

  const handleSubmitAd = async () => {
      if (!newName || !newOffer || !newCode || !auth.currentUser) return alert("Please fill all fields.");
      try {
          // Get blind key for profile link
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          const blindKey = userDoc.exists() ? userDoc.data().blind_key : '';

          await addDoc(collection(db, "ads"), {
              name: newName,
              offer: newOffer,
              coupon_code: newCode,
              color: newColor,
              owner_email: auth.currentUser.email,
              owner_id: blindKey,
              status: 'pending',
              createdAt: serverTimestamp(),
              views: 0,
              claims: 0
          });
          
          alert("Campaign submitted for approval!");
          setNewName(''); setNewOffer(''); setNewCode('');
          loadAds();
      } catch(e) { console.error(e); alert("Submission failed."); }
  };

  if(loading) return <div>Loading Campaigns...</div>;

  return (
    <>
        {/* CREATE FORM */}
        <div className="result-card" style={{textAlign:'left', marginBottom:'30px'}}>
            <h3 style={{marginTop:0}}>Draft New Campaign</h3>
            <p style={{fontSize:'0.9rem', color:'#666', marginBottom:'20px'}}>Create a coupon. It will be reviewed by an admin before going live.</p>
            
            <div style={{marginBottom:'15px'}}>
                <label className="input-label">Business Name</label>
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

        {/* ADS LIST */}
        <h3 style={{fontSize:'0.9rem', color:'#888', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'15px', textAlign:'left'}}>My Campaigns ({myAds.length})</h3>
        <div className="dashboard-list">
            {myAds.length === 0 && <p style={{color:'#999'}}>No campaigns yet.</p>}
            {myAds.map(ad => (
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
  );
}
