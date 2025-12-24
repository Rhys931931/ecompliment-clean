import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase.prod'; // Correct path from features/compliments
import NavBar from '../../components/NavBar';
import ActivityDetailModal from './ActivityDetailModal';
import ActivityList from './components/ActivityList';

export default function Activity() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSecret, setSelectedSecret] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchHistory(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchHistory = async (uid: string) => {
    setLoading(true);
    try {
      const q = query(
          collection(db, "compliment_secrets"), 
          where("sender_uid", "==", uid),
          orderBy("created_at", "desc")
      );
      const snap = await getDocs(q);
      
      const items = snap.docs.map(d => {
          const data = d.data();
          return {
              id: d.id,
              search_code: data.search_code || 'PENDING',
              recipient_name: 'Friend', 
              message: data.private_note || data.message || 'No message',
              timestamp: data.created_at,
          };
      });
      setActivities(items);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', maxWidth:'1000px', width:'100%', padding:'20px'}}>
        
        <div style={{marginBottom:'25px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
                <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#666', marginBottom:'5px', padding:0}}>
                    <ArrowLeft size={18} /> Back
                </button>
                <h1 style={{margin:0, color:'#333', fontSize:'1.8rem'}}>Sent History</h1>
            </div>
            <div style={{background:'white', padding:'8px 12px', borderRadius:'12px', border:'1px solid #eee', fontSize:'0.9rem', fontWeight:'bold', color:'#666'}}>
                {activities.length} Sent
            </div>
        </div>

        <ActivityList 
            activities={activities} 
            loading={loading} 
            onSelect={setSelectedSecret}
            onCreate={() => navigate('/create')}
        />

        {selectedSecret && (
            <ActivityDetailModal 
                isOpen={!!selectedSecret}
                onClose={() => setSelectedSecret(null)}
                secret={selectedSecret}
                onUpdate={() => user && fetchHistory(user.uid)}
            />
        )}

      </main>
    </div>
  );
}
