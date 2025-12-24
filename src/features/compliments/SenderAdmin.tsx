import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';
// IMPORT THE NEW COMPONENT
import CreateCompliment from './CreateCompliment';

export default function SenderAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchRecent(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchRecent = async (uid: string) => {
    try {
      const q = query(
        collection(db, "compliments"),
        where("sender_uid", "==", uid),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      setRecent(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.log("History fetch error"); }
  };

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', maxWidth:'600px', width:'100%', padding:'20px'}}>
        
        <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#666', marginBottom:'20px'}}>
            <ArrowLeft size={18} /> Back to Dashboard
        </button>

        {/* --- HERE IS THE NEW CLEAN COMPONENT --- */}
        {user && (
            <CreateCompliment 
                user={user} 
                onSuccess={() => fetchRecent(user.uid)} 
            />
        )}

        {/* --- MINI HISTORY --- */ }
        {recent.length > 0 && (
            <div style={{marginTop:'30px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                    <h3 style={{margin:0, fontSize:'1rem', color:'#666', display:'flex', alignItems:'center', gap:'8px'}}>
                        <History size={16}/> Recent History
                    </h3>
                    <span onClick={() => navigate('/activity')} style={{fontSize:'0.85rem', color:'#4da6a9', cursor:'pointer', fontWeight:'bold'}}>View All</span>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    {recent.map((item) => (
                        <div key={item.id} style={{background:'white', padding:'12px', borderRadius:'10px', border:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{textAlign:'left'}}>
                                <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{item.recipient_name}</div>
                                <div style={{fontSize:'0.8rem', color:'#999', fontFamily:'monospace'}}>
                                    Code: {item.search_code}
                                </div>
                            </div>
                            <span className={`badge ${item.claimed ? 'claimed' : 'published'}`}>
                                {item.claimed ? 'Claimed' : 'Active'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}