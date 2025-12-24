import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import ProfileModal from '../../components/ProfileModal'; 
import '../../App.css';

// IMPORT NEW COMPONENTS
import InviteCard from './components/InviteCard';
import ConnectionList from './components/ConnectionList';

interface Connection {
  id: string; 
  other_uid: string;
  name: string;
  role: 'Friend' | 'Connection';
  date: any;
  photo_url?: string;
  status: string;
  origin_compliment_id?: string;
}

export default function Connections() {
  const [user, setUser] = useState<any>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState<string | null>(null);

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
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
              setReferralCode(userDoc.data().referral_code || "GEN-CODE");
          }

          const q = query(collection(db, "connections"), where("participants", "array-contains", uid));
          const snap = await getDocs(q);
          
          const loaded: Connection[] = [];

          for (const d of snap.docs) {
              const data = d.data();
              const otherUid = data.participants.find((id: string) => id !== uid);
              
              if (otherUid) {
                  const friendSnap = await getDoc(doc(db, "users", otherUid));
                  const friendData = friendSnap.exists() ? friendSnap.data() : null;
                  
                  loaded.push({
                      id: d.id,
                      other_uid: otherUid,
                      name: friendData?.display_name || "Unknown",
                      role: 'Connection',
                      date: data.last_interaction,
                      photo_url: friendData?.photo_url,
                      status: data.status,
                      origin_compliment_id: data.origin_compliment_id
                  });
              }
          }
          loaded.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
          setConnections(loaded);

      } catch (e) {
          console.error("Error loading connections:", e);
      } finally {
          setLoading(false);
      }
  };

  const startChat = async (conn: Connection) => {
      if (!user) return;
      setChatLoading(conn.other_uid);
      
      try {
          // STRATEGY 1: Use the Origin Compliment ID (The "Guest House")
          if (conn.origin_compliment_id) {
              const chatRef = doc(db, "chats", conn.origin_compliment_id);
              const chatSnap = await getDoc(chatRef);
              
              if (!chatSnap.exists()) {
                  await setDoc(chatRef, {
                      participants: [user.uid, conn.other_uid],
                      last_updated: serverTimestamp(),
                      compliment_title: conn.name,
                      compliment_id: conn.origin_compliment_id
                  }, { merge: true });
              }
              navigate(`/chat/${conn.origin_compliment_id}`);
              return;
          }

          // STRATEGY 2: Find existing generic chat
          const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
          const snap = await getDocs(q);
          
          let existingChatId = null;
          for (const d of snap.docs) {
              const data = d.data();
              if (data.participants.includes(conn.other_uid)) {
                  existingChatId = d.id;
                  break;
              }
          }

          if (existingChatId) {
              navigate(`/chat/${existingChatId}`);
          } else {
              // STRATEGY 3: Create fresh chat
              const newChat = await addDoc(collection(db, "chats"), {
                  participants: [user.uid, conn.other_uid],
                  last_updated: serverTimestamp(),
                  last_message: "Chat started",
                  compliment_title: conn.name
              });
              navigate(`/chat/${newChat.id}`);
          }

      } catch (e) {
          console.error("Chat start failed:", e);
          alert("Could not open chat.");
      } finally {
          setChatLoading(null);
      }
  };

  const copyReferral = () => {
      const link = `https://ecompliment.app/login?ref=${referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const filteredConnections = connections.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container" style={{padding:0, background:'#f8fafc'}}>
      <NavBar user={user} />
      
      <main className="content-area" style={{marginTop:'60px', padding:'20px', maxWidth:'800px'}}>
          
          <div style={{marginBottom:'25px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'15px'}}>
              <div>
                  <h1 style={{fontSize:'1.8rem', display:'flex', alignItems:'center', gap:'10px', margin:0, color:'#333'}}>
                      <Users color="#4da6a9" size={28}/> My Connections
                  </h1>
                  <p style={{color:'#666', margin:'5px 0 0 0'}}>Your people.</p>
              </div>
              
              <div style={{background:'white', border:'1px solid #ddd', borderRadius:'20px', padding:'8px 15px', display:'flex', alignItems:'center', gap:'10px'}}>
                  <Search size={18} color="#999" />
                  <input 
                      placeholder="Search..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{border:'none', outline:'none', fontSize:'0.9rem', width:'120px'}}
                  />
              </div>
          </div>

          <InviteCard 
              referralCode={referralCode}
              onCopy={copyReferral}
              copied={copied}
          />

          <ConnectionList 
              connections={filteredConnections}
              loading={loading}
              chatLoadingId={chatLoading}
              onStartChat={startChat}
              onSelectUser={setSelectedUserId}
          />

          {selectedUserId && (
              <ProfileModal 
                  userId={selectedUserId} 
                  isOpen={!!selectedUserId} 
                  onClose={() => setSelectedUserId(null)}
              />
          )}

      </main>
    </div>
  );
}
