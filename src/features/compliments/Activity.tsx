import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Download } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';
import ActivityDetailModal from './ActivityDetailModal';
import ActivityItemCard from './components/ActivityItemCard';

export default function Activity() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [sentItems, setSentItems] = useState<any[]>([]);
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // SELECTION STATE
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectionType, setSelectionType] = useState<'sent' | 'received'>('sent');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await Promise.all([
            fetchSent(currentUser.uid),
            fetchReceived(currentUser.uid)
        ]);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchSent = async (uid: string) => {
    try {
      const q = query(collection(db, "compliment_secrets"), where("sender_uid", "==", uid), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      setSentItems(snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          recipient_name: 'Friend', // Placeholder, detail modal fetches real name
          date: d.data().created_at,
          active: true // Derived in modal
      })));
    } catch (e) { console.error("Sent fetch error", e); }
  };

  const fetchReceived = async (uid: string) => {
    try {
      const q = query(collection(db, "compliments"), where("claimer_uid", "==", uid), orderBy("approved_at", "desc"));
      const snap = await getDocs(q);
      setReceivedItems(snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          date: d.data().approved_at,
          claimed: true
      })));
    } catch (e) { console.error("Received fetch error", e); }
  };

  const items = activeTab === 'sent' ? sentItems : receivedItems;

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop: '60px', maxWidth:'800px', width:'100%', padding:'20px'}}>
        
        {/* HEADER */}
        <div style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer', color:'#666'}}><ArrowLeft size={20}/></button>
                <h1 style={{margin:0, fontSize:'1.8rem'}}>Activity</h1>
            </div>
        </div>

        {/* TABS */}
        <div style={{display:'flex', background:'#e2e8f0', padding:'4px', borderRadius:'12px', marginBottom:'20px'}}>
            <button 
                onClick={() => setActiveTab('sent')}
                style={{
                    flex:1, padding:'10px', borderRadius:'10px', border:'none', fontWeight:'bold',
                    background: activeTab === 'sent' ? 'white' : 'transparent',
                    color: activeTab === 'sent' ? '#0284c7' : '#64748b',
                    boxShadow: activeTab === 'sent' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                    cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'
                }}
            >
                <Send size={16}/> Given
            </button>
            <button 
                onClick={() => setActiveTab('received')}
                style={{
                    flex:1, padding:'10px', borderRadius:'10px', border:'none', fontWeight:'bold',
                    background: activeTab === 'received' ? 'white' : 'transparent',
                    color: activeTab === 'received' ? '#166534' : '#64748b',
                    boxShadow: activeTab === 'received' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                    cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'
                }}
            >
                <Download size={16}/> Received
            </button>
        </div>

        {/* LIST */}
        <div style={{minHeight:'300px'}}>
            {loading ? <div style={{textAlign:'center', padding:'40px', color:'#999'}}>Loading history...</div> : 
             items.length === 0 ? <div style={{textAlign:'center', padding:'40px', color:'#999'}}>No activity yet.</div> :
             items.map(item => (
                 <ActivityItemCard 
                    key={item.id} 
                    item={item} 
                    type={activeTab} 
                    onClick={() => { setSelectedItem(item); setSelectionType(activeTab); }}
                 />
             ))
            }
        </div>

        {/* MODAL */}
        {selectedItem && (
            <ActivityDetailModal 
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                secret={selectedItem} 
                mode={selectionType} // Pass mode to handle Sent vs Received logic
                onUpdate={() => {
                    if(user) { fetchSent(user.uid); fetchReceived(user.uid); }
                }}
            />
        )}

      </main>
    </div>
  );
}
