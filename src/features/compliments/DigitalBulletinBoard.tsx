import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'; 
import { db, auth } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';
import { GhostProtocol } from '../../services/GhostProtocol';

// Import New Components
import SearchScreen from './components/board/SearchScreen';
import UnlockScreen from './components/board/UnlockScreen';
import CardDisplay from './components/board/CardDisplay';

export default function DigitalBulletinBoard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [searchCode, setSearchCode] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compliment, setCompliment] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Theme State
  const [bgImage, setBgImage] = useState<string>('');
  const [themeColor, setThemeColor] = useState<string>('#4da6a9');
  const [themeText, setThemeText] = useState<string>('#ffffff');

  useEffect(() => {
    const magicToken = searchParams.get('magic');
    if (magicToken) handleMagicLogin(magicToken);

    const themeId = searchParams.get('theme');
    if (themeId) loadTheme(themeId);
  }, [searchParams]);

  const loadTheme = async (id: string) => {
      try {
          const docSnap = await getDoc(doc(db, "themes", id));
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.backgroundImageUrl) setBgImage(data.backgroundImageUrl);
              if (data.primaryColor) setThemeColor(data.primaryColor);
              if (data.textColor) setThemeText(data.textColor);
          }
      } catch (e) { console.error("Theme load failed", e); }
  };

  const handleMagicLogin = async (token: string) => {
      setLoading(true); setError('');
      try {
          const q = query(collection(db, "compliments"), where("magic_token", "==", token));
          const snap = await getDocs(q);
          if (!snap.empty) {
              const docData = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
              if (docData.magic_token_status === 'consumed') {
                  setError("This card has already been claimed.");
                  setCompliment(null); 
              } else {
                  const burned = await GhostProtocol.validateAndBurn(docData.id, token);
                  if (burned) { setCompliment(docData); setIsUnlocked(true); } 
                  else { setError("Security Check Failed."); }
              }
          } else { setError("Invalid Magic Link."); }
      } catch (err) { console.error(err); setError("Connection failed."); }
      setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (searchCode.length < 8) { setError("Code must be 8 digits."); return; }
      setLoading(true); setError(''); setCompliment(null); setIsUnlocked(false);
      try {
          const q = query(collection(db, "compliments"), where("search_code", "==", searchCode));
          const snap = await getDocs(q);
          if (!snap.empty) {
              setCompliment({ id: snap.docs[0].id, ...snap.docs[0].data() });
          } else { setError("Card not found. Check the code."); }
      } catch (err) { console.error(err); setError("Search failed."); }
      setLoading(false);
  };

  const handleClaim = async () => {
      if (!compliment) return;
      if (!auth.currentUser) {
          localStorage.setItem('pending_claim_id', compliment.id);
          navigate('/login');
          return;
      }
      if (auth.currentUser.uid === compliment.sender_uid) return alert("You can't claim your own card!");
      
      setLoading(true);
      try {
          await updateDoc(doc(db, "compliments", compliment.id), {
              status: 'pending_approval',
              claimer_uid: auth.currentUser.uid,
              claimer_name: auth.currentUser.displayName || 'Anonymous',
              claimed_at: serverTimestamp()
          });
          setCompliment({ ...compliment, status: 'pending_approval' });
          navigate(`/chat/${compliment.id}`);
      } catch (err) { console.error(err); setError("Could not claim."); }
      setLoading(false);
  };

  const checkPin = () => {
      // In a real app, verify PIN against DB/Server. 
      // For now, we simulate success to keep it simple or check local logic if needed.
      // (The GhostProtocol handles the actual secure burn on magic link)
      setIsUnlocked(true);
  };

  // Styles
  const containerStyle = bgImage ? { backgroundImage: `url(${bgImage})` } : {};
  const navStyle = bgImage ? { background: themeColor, color: themeText } : {};
  const btnStyle = { background: themeColor, color: themeText };

  return (
    <div className="app-container" style={containerStyle}>
      <NavBar user={auth.currentUser} style={navStyle} />
      
      <main className="content-area">
        {!compliment ? (
            <SearchScreen 
                searchCode={searchCode}
                setSearchCode={setSearchCode}
                onSearch={handleSearch}
                loading={loading}
                error={error}
                btnStyle={btnStyle}
            />
        ) : !isUnlocked ? (
            <UnlockScreen 
                senderName={compliment.sender}
                pinInput={pinInput}
                setPinInput={setPinInput}
                onUnlock={checkPin}
                onCancel={() => setCompliment(null)}
                themeColor={themeColor}
                btnStyle={btnStyle}
            />
        ) : (
            <CardDisplay 
                compliment={compliment}
                onClaim={handleClaim}
                btnStyle={btnStyle}
            />
        )}
      </main>

      {/* FOOTER */}
      {!bgImage && !compliment && (
        <div style={{padding:'20px', textAlign:'center', borderTop:'1px solid #eee', background:'var(--glass-bg)', backdropFilter:'blur(10px)'}}>
            <div style={{display:'flex', justifyContent:'center', gap:'20px', fontSize:'0.9rem', color:'var(--text-slate)', fontWeight:'bold'}}>
                <span onClick={()=>navigate('/business-intro')} style={{cursor:'pointer'}}>For Business</span>
                <span onClick={()=>navigate('/terms')} style={{cursor:'pointer'}}>Terms & Rules</span>
            </div>
        </div>
      )}
    </div>
  );
}
