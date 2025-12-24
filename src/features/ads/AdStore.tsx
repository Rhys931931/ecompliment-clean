import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Check, Plus } from 'lucide-react';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import '../../App.css';

interface AdData {
  id: string;
  name: string;
  offer: string;
  color: string;
}

export default function AdMarketplace() {
  const [user, setUser] = useState<any>(null);
  const [allAds, setAllAds] = useState<AdData[]>([]);
  const [myInventory, setMyInventory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadData(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadData = async (uid: string) => {
    try {
        const adsSnap = await getDocs(collection(db, "ads"));
        const adsList = adsSnap.docs.map(d => ({id: d.id, ...d.data()} as AdData));
        setAllAds(adsList);

        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            setMyInventory(userSnap.data().saved_ad_ids || []);
        } else {
            await setDoc(userRef, { saved_ad_ids: [] }, { merge: true });
        }
    } catch (e) {
        console.error("Error loading marketplace:", e);
    } finally {
        setLoading(false);
    }
  };

  const toggleAd = async (adId: string) => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const isSaved = myInventory.includes(adId);
      
      try {
          if (isSaved) {
              await updateDoc(userRef, { saved_ad_ids: arrayRemove(adId) });
              setMyInventory(prev => prev.filter(id => id !== adId));
          } else {
              await updateDoc(userRef, { saved_ad_ids: arrayUnion(adId) });
              setMyInventory(prev => [...prev, adId]);
          }
      } catch (e) {
          console.error("Error updating inventory:", e);
      }
  };

  const filteredAds = allAds.filter(ad => 
      ad.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ad.offer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container" style={{padding:0}}>
      <NavBar user={user} />
      
      <main className="content-area" style={{marginTop:'60px', padding:'20px', maxWidth:'800px'}}>
          
          <div style={{textAlign:'center', marginBottom:'30px'}}>
              <h1 style={{fontSize:'1.8rem', marginBottom:'5px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                  <ShoppingBag color="#4da6a9" size={28}/> Ad Inventory
              </h1>
              <p style={{color:'#666'}}>Select the offers you want to attach to your cards.</p>
          </div>

          <div className="search-bar-wrapper" style={{marginBottom:'20px'}}>
              <Search className="search-icon" size={20} />
              <input 
                  type="text" 
                  placeholder="Search local businesses..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>

          <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap:'15px'}}>
              {loading && <p>Loading...</p>}
              
              {!loading && filteredAds.map(ad => {
                  const isSelected = myInventory.includes(ad.id);
                  return (
                      <div key={ad.id} className="result-card" style={{
                          borderLeft: `5px solid ${ad.color}`,
                          padding: '15px',
                          background: isSelected ? '#f0fdfa' : 'white',
                          textAlign: 'left',
                          opacity: isSelected ? 1 : 0.9
                      }}>
                          <div style={{fontWeight:'bold', fontSize:'1.1rem', color:'#333'}}>{ad.name}</div>
                          <div style={{color:'#666', fontSize:'0.9rem', marginBottom:'10px'}}>{ad.offer}</div>
                          
                          <button 
                              onClick={() => toggleAd(ad.id)}
                              style={{
                                  width: '100%', padding: '8px', borderRadius: '6px', border: 'none',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                  fontWeight: 'bold',
                                  background: isSelected ? '#ccfbf1' : '#1f2937',
                                  color: isSelected ? '#0f766e' : 'white'
                              }}
                          >
                              {isSelected ? <><Check size={16}/> Selected</> : <><Plus size={16}/> Add to Inventory</>}
                          </button>
                      </div>
                  );
              })}
          </div>
      </main>
    </div>
  );
}