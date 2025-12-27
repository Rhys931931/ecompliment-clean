import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; 
import { httpsCallable } from 'firebase/functions';
import { signInAnonymously, updateProfile } from 'firebase/auth'; 
import { db, auth, functions } from '../../config/firebase.prod';
import NavBar from '../../components/NavBar';
import { GhostProtocol } from '../../services/GhostProtocol';
import SearchScreen from './components/board/SearchScreen';
import UnlockScreen from './components/board/UnlockScreen';
import CardDisplay from './components/board/CardDisplay';
import SelectionScreen from './components/board/SelectionScreen';

export default function DigitalBulletinBoard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // MATCHING STATE
  const [compliment, setCompliment] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]); // <--- NEW: For collisions
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
              
              if (docData.claimed) {
                  setError("This gift has already been claimed.");
                  setLoading(false);
                  return;
              }

              const burned = await GhostProtocol.validateAndBurn(docData.id, token);
              if (burned) { 
                  setCompliment(docData); 
                  setIsUnlocked(true); 
                  if (!auth.currentUser) await signInAnonymously(auth);
              } 
              else { setError("Security Check Failed."); }
          } else { setError("Invalid Magic Link."); }
      } catch (err) { console.error(err); setError("Connection failed."); }
      setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (searchCode.length < 8) { setError("Code must be 8 digits."); return; }
      setLoading(true); setError(''); setCompliment(null); setCandidates([]); setIsUnlocked(false);
      
      try {
          // 1. GET ALL MATCHES (Not just the first one)
          const q = query(collection(db, "compliments"), where("search_code", "==", searchCode));
          const snap = await getDocs(q);
          
          // 2. PARSE & FILTER (The Toggle Protocol)
          const allMatches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const activeMatches = allMatches.filter((c: any) => !c.claimed);

          // 3. DECISION LOGIC
          if (activeMatches.length === 0) {
              if (allMatches.length > 0) setError("This card has already been claimed.");
              else setError("Card not found. Check the code.");
          } 
          else if (activeMatches.length === 1) {
              // Perfect Match
              setCompliment(activeMatches[0]);
          } 
          else {
              // COLLISION DETECTED (One in a Million)
              setCandidates(activeMatches);
          }

      } catch (err) { console.error(err); setError("Search failed."); }
      setLoading(false);
  };

  // --- ACTIONS ---
  const handleReply = async () => {
      if (!compliment) return;
      setLoading(true);
      try {
          let visitorName = localStorage.getItem('ecomp_visitor_name');
          if (!visitorName) {
              visitorName = `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
              localStorage.setItem('ecomp_visitor_name', visitorName);
          }

          if (!auth.currentUser) {
              const cred = await signInAnonymously(auth);
              await updateProfile(cred.user, { displayName: visitorName });
          }

          const createClaimFn = httpsCallable(functions, 'createClaim');
          const result: any = await createClaimFn({ complimentId: compliment.id });
          
          if (result.data && result.data.chatId) {
              navigate(`/chat/${result.data.chatId}`);
          } else { throw new Error("Server did not return a Chat ID."); }

      } catch (err: any) { setError(`Error: ${err.message || 'Could not start chat'}`); }
      setLoading(false);
  };

  const handleClaim = async () => {
      if (!compliment) return;
      if (!auth.currentUser || auth.currentUser.isAnonymous) {
          localStorage.setItem('pending_claim_id', compliment.id);
          navigate('/login');
          return;
      }
      handleReply(); 
  };

  const checkPin = () => {
      setIsUnlocked(true);
      if (!auth.currentUser) signInAnonymously(auth);
  };

  // --- RENDER ---
  const containerStyle = bgImage ? { backgroundImage: `url(${bgImage})` } : {};
  const navStyle = bgImage ? { background: themeColor, color: themeText } : {};
  const btnStyle = { background: themeColor, color: themeText };

  return (
    <div className="app-container" style={containerStyle}>
      <NavBar user={auth.currentUser} style={navStyle} />
      <main className="content-area">
        
        {/* STATE MACHINE: Candidates -> Search -> Unlock -> Display */}
        {candidates.length > 0 ? (
            <SelectionScreen 
                candidates={candidates}
                onSelect={(selected) => { setCompliment(selected); setCandidates([]); }}
                onCancel={() => { setCandidates([]); setSearchCode(''); }}
            />
        ) : !compliment ? (
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
                onReply={handleReply}
                btnStyle={btnStyle}
                loading={loading}
            />
        )}
      </main>
      
      {error && <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#b91c1c', color:'white', padding:'15px', fontSize:'0.9rem', zIndex:9999, textAlign:'center', fontWeight:'bold'}}>
          {error}
      </div>}

      {!bgImage && !compliment && candidates.length === 0 && (
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
