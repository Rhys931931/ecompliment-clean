import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, Inbox } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import NavBar from '../../components/NavBar';
import ActivityDetailModal from './ActivityDetailModal';

export default function ActivityPage() {
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
      // Fetch SECRETS (Source of Truth for Sender)
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
        
        {/* HEADER */}
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

        {/* LIST */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
                <div className="p-10 text-center text-gray-400"><Loader className="spin mx-auto mb-2"/> Loading records...</div>
            ) : activities.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                    <Inbox size={40} className="mx-auto mb-2 opacity-20"/>
                    <p>You haven't sent any compliments yet.</p>
                    <button onClick={() => navigate('/create')} className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg font-bold">Send One Now</button>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <tr>
                            <th className="p-4">Code</th>
                            <th className="p-4">Message</th>
                            <th className="p-4 text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {activities.map((item) => (
                            <tr 
                                key={item.id} 
                                onClick={() => setSelectedSecret(item)}
                                className="hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                                <td className="p-4">
                                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                                        {item.search_code}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-700 font-medium">
                                    <div className="truncate max-w-[200px]">{item.message}</div>
                                </td>
                                <td className="p-4 text-right text-gray-400 text-sm">
                                    {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : '...'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        {/* MODAL */}
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
