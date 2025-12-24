import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Ticket, ArrowLeft, Globe } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; 
import { db, auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';

export default function BusinessProfile() {
  const { businessId } = useParams(); // URL param
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      if (businessId) loadBusiness(businessId);
  }, [businessId]);

  const loadBusiness = async (id: string) => {
      try {
          // 1. Get Profile
          const docSnap = await getDoc(doc(db, "public_profiles", id));
          if (docSnap.exists()) setProfile(docSnap.data());

          // 2. Get Active Ads (Coupons) for this business owner
          const q = query(collection(db, "ads"), where("owner_id", "==", id)); 
          const adsSnap = await getDocs(q);
          setAds(adsSnap.docs.map(d => ({id: d.id, ...d.data()})));

      } catch (e) { console.error(e); }
      setLoading(false);
  };

  if (loading) return <div className="app-container">Loading...</div>;
  if (!profile) return <div className="app-container">Business not found.</div>;

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={auth.currentUser} />
      
      {/* HEADER BANNER */}
      <div style={{height:'150px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', position:'relative'}}>
          <button onClick={() => navigate(-1)} style={{position:'absolute', top:'20px', left:'20px', background:'white', borderRadius:'50%', width:'40px', height:'40px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><ArrowLeft size={20}/></button>
      </div>

      <main className="content-area" style={{marginTop: '-60px', padding:'20px', maxWidth:'800px', position:'relative', zIndex:2}}>
          
          {/* INFO CARD */}
          <div className="result-card" style={{textAlign:'center', padding:'30px'}}>
              <div style={{width:'100px', height:'100px', borderRadius:'50%', border:'4px solid white', background:'white', overflow:'hidden', margin:'0 auto 15px auto', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}>
                  <img src={profile.photo_url} alt={profile.display_name} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
              </div>
              <h1 style={{margin:'0 0 5px 0', fontSize:'1.8rem'}}>{profile.display_name}</h1>
              <div style={{display:'flex', justifyContent:'center', gap:'5px', color:'#f59e0b', marginBottom:'15px'}}>
                  <Star fill="currentColor" size={18}/> <Star fill="currentColor" size={18}/> <Star fill="currentColor" size={18}/> <Star fill="currentColor" size={18}/> <Star size={18}/>
              </div>
              <p style={{color:'#666', lineHeight:'1.5', margin:'0 auto 20px auto', maxWidth:'500px'}}>{profile.bio || "A local business spreading kindness."}</p>
              
              <div style={{display:'flex', justifyContent:'center', gap:'15px', flexWrap:'wrap'}}>
                  {profile.links?.map((link: string, i: number) => (
                      <a key={i} href={link} target="_blank" className="claim-btn" style={{background:'#f1f5f9', color:'#333', fontSize:'0.9rem', padding:'8px 15px'}}>
                          <Globe size={14}/> Website {i+1}
                      </a>
                  ))}
              </div>
          </div>

          {/* ADS SECTION */}
          <h3 style={{margin:'30px 0 15px 0', color:'#666', textTransform:'uppercase', fontSize:'0.9rem', letterSpacing:'1px'}}>Active Offers</h3>
          {ads.length === 0 ? <p style={{color:'#999', textAlign:'center'}}>No active coupons right now.</p> : (
              <div style={{display:'grid', gap:'15px'}}>
                  {ads.map(ad => (
                      <div key={ad.id} style={{background:'white', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${ad.color || '#4da6a9'}`, display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                          <div>
                              <div style={{fontWeight:'bold', fontSize:'1.1rem'}}>{ad.name}</div>
                              <div style={{color:'#666'}}>{ad.offer}</div>
                          </div>
                          <div style={{background:'#f0fdfa', color:'#0f766e', padding:'5px 10px', borderRadius:'6px', fontSize:'0.8rem', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}>
                              <Ticket size={14}/> COUPON
                          </div>
                      </div>
                  ))}
              </div>
          )}

      </main>
    </div>
  );
}
