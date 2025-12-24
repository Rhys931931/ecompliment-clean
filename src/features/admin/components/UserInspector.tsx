import { useState, useEffect } from 'react';
import { X, Shield, Coins, Database, AlertTriangle, Fingerprint, ArrowRight } from 'lucide-react';
import { doc, getDoc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '../../../config/firebase.prod';
import { getCanonicalEmail } from '../../../utils/identityLogic';

interface Props {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  allUsers: any[]; 
}

export default function UserInspector({ userId, isOpen, onClose, allUsers }: Props) {
  const [userData, setUserData] = useState<any>(null); // Public Data
  const [secretData, setSecretData] = useState<any>(null); // Private Data
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [siblings, setSiblings] = useState<any[]>([]);
  const [canonicalEmail, setCanonicalEmail] = useState('');
  const [empireBalance, setEmpireBalance] = useState(0);

  useEffect(() => {
    if (isOpen && userId) {
      loadDeepData();
    }
  }, [isOpen, userId]);

  const loadDeepData = async () => {
    setLoading(true);
    try {
        // --- LEFT HAND: Fetch Public Data ---
        const userSnap = await getDoc(doc(db, "users", userId));
        const uData: any = userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : {};
        setUserData(uData);

        // --- RIGHT HAND: Fetch Secret Data ---
        const secretSnap = await getDoc(doc(db, "user_secrets", userId));
        const sData: any = secretSnap.exists() ? secretSnap.data() : {};
        setSecretData(sData);

        // --- Fetch Wallet ---
        const walletSnap = await getDoc(doc(db, "wallets", userId));
        const balance = walletSnap.exists() ? (walletSnap.data().balance || 0) : 0;
        setWalletData({ balance });

        // --- MERGE LOGIC FOR BOT HUNTING ---
        // We prefer the Secret Email (Secure), but fallback to Public if missing (Legacy)
        const targetEmail = sData.email || uData.email; 
        
        if (targetEmail) {
            const realEmail = getCanonicalEmail(targetEmail);
            setCanonicalEmail(realEmail);
            
            const family = allUsers.filter(u => {
                if (!u.email) return false;
                if (u.id === userId) return false; 
                return getCanonicalEmail(u.email) === realEmail;
            });
            setSiblings(family);

            const siblingWealth = family.reduce((sum, sib) => sum + (sib.balance || 0), 0);
            setEmpireBalance(balance + siblingWealth);
        }

    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateAccountType = async (type: string) => {
      await updateDoc(doc(db, "users", userId), { account_type: type });
      setUserData({ ...userData, account_type: type });
  };

  const handleSweepFunds = async () => {
      if (siblings.length === 0) return;
      if (!confirm(`⚠️ MANUAL MERGE:\n\nTransfer coins from ${siblings.length} siblings to this account?\n\nThis is irreversible.`)) return;

      try {
          const batch = writeBatch(db);
          let totalSweep = 0;

          siblings.forEach(sib => {
              if (sib.balance > 0) {
                  const sibWalletRef = doc(db, "wallets", sib.id);
                  const sibUserRef = doc(db, "users", sib.id); 
                  batch.update(sibWalletRef, { balance: 0 });
                  batch.update(sibUserRef, { balance: 0 });
                  totalSweep += sib.balance;
              }
          });

          const mainWalletRef = doc(db, "wallets", userId);
          const mainUserRef = doc(db, "users", userId); 
          batch.update(mainWalletRef, { balance: increment(totalSweep) });
          batch.update(mainUserRef, { balance: increment(totalSweep) });

          await batch.commit();
          alert(`Success! ${totalSweep} coins swept into ${userData.display_name}'s vault.`);
          onClose(); 
      } catch (e) {
          console.error(e);
          alert("Sweep failed.");
      }
  };

  if (!isOpen) return null;

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999}}>
      <div className="fade-in" style={{background:'white', width:'90%', maxWidth:'600px', borderRadius:'16px', maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
        
        {/* HEADER WITH PHOTO */}
        <div style={{padding:'20px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc'}}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <div style={{width:'60px', height:'60px', borderRadius:'50%', background:'#e2e8f0', overflow:'hidden', border:'3px solid white', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
                    {userData?.photo_url ? (
                        <img src={userData.photo_url} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    ) : (
                        <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', color:'#94a3b8', fontSize:'1.5rem'}}>
                            {userData?.display_name?.[0]}
                        </div>
                    )}
                </div>
                <div>
                    <h2 style={{margin:0, fontSize:'1.2rem', display:'flex', alignItems:'center', gap:'10px'}}>
                        {userData?.display_name || 'Unknown User'}
                        {userData?.is_super_admin && <span style={{background:'#b91c1c', color:'white', fontSize:'0.7rem', padding:'2px 6px', borderRadius:'4px'}}>SUPER ADMIN</span>}
                    </h2>
                    <div style={{fontSize:'0.8rem', color:'#64748b', fontFamily:'monospace'}}>{userId}</div>
                </div>
            </div>
            <button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24} color="#64748b"/></button>
        </div>

        <div style={{flex:1, overflowY:'auto', padding:'20px'}}>
            {loading ? <div style={{textAlign:'center', padding:'40px'}}>Scanning Database...</div> : (
                <>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'20px'}}>
                        <div style={{background:'#f0fdfa', padding:'15px', borderRadius:'12px', border:'1px solid #ccfbf1'}}>
                            <div style={{fontSize:'0.8rem', color:'#0f766e', marginBottom:'5px', display:'flex', alignItems:'center', gap:'5px'}}><Coins size={14}/> WALLET BALANCE</div>
                            <div style={{fontSize:'1.8rem', fontWeight:'bold', color:'#0f766e'}}>{walletData?.balance || 0}</div>
                        </div>
                        <div style={{background:'#fefce8', padding:'15px', borderRadius:'12px', border:'1px solid #fef08a'}}>
                            <div style={{fontSize:'0.8rem', color:'#854d0e', marginBottom:'5px', display:'flex', alignItems:'center', gap:'5px'}}><Shield size={14}/> MASTER PIN</div>
                            <div style={{fontSize:'1.8rem', fontWeight:'bold', fontFamily:'monospace', color:'#854d0e'}}>{secretData?.master_pin || userData?.master_pin || '---'}</div>
                        </div>
                    </div>

                    <div className="result-card" style={{padding:'20px', marginBottom:'20px', textAlign:'left'}}>
                        <h4 style={{marginTop:0, display:'flex', alignItems:'center', gap:'8px'}}><Fingerprint size={18}/> Identity Matrix</h4>
                        
                        <div style={{display:'grid', gap:'5px', marginBottom:'15px', background:'#f8fafc', padding:'10px', borderRadius:'8px'}}>
                            <div style={{display:'flex', justifyContent:'space-between'}}>
                                <span style={{color:'#666', fontSize:'0.8rem'}}>Secure Email (Vault):</span>
                                <span style={{fontWeight:'bold', fontSize:'0.9rem'}}>{secretData?.email || 'N/A'}</span>
                            </div>
                            <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px dashed #ddd', paddingTop:'5px'}}>
                                <span style={{color:'#666', fontSize:'0.8rem'}}>Canonical ID:</span>
                                <span style={{fontWeight:'bold', fontSize:'0.9rem', color:'#ec4899'}}>{canonicalEmail}</span>
                            </div>
                        </div>

                        {siblings.length > 0 ? (
                            <div style={{background:'#fff7ed', padding:'15px', borderRadius:'8px', border:'1px solid #fdba74'}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                                    <div style={{fontSize:'0.9rem', color:'#c2410c', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <AlertTriangle size={16}/> {siblings.length} Linked Accounts Found
                                    </div>
                                    <div style={{fontSize:'0.8rem', color:'#ea580c', fontWeight:'bold'}}>
                                        Total Empire: {empireBalance} Coins
                                    </div>
                                </div>
                                <div style={{display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'15px'}}>
                                    {siblings.map(s => (
                                        <span key={s.id} style={{fontSize:'0.75rem', background:'white', padding:'4px 8px', borderRadius:'4px', border:'1px solid #fed7aa', display:'flex', alignItems:'center', gap:'5px'}}>
                                            <span style={{width:'6px', height:'6px', borderRadius:'50%', background: s.account_type === 'bot' ? '#999' : '#22c55e'}}></span>
                                            {s.display_name}
                                        </span>
                                    ))}
                                </div>
                                <button onClick={handleSweepFunds} style={{width:'100%', fontSize:'0.85rem', background:'white', border:'1px solid #c2410c', color:'#c2410c', padding:'8px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}>
                                    <ArrowRight size={16}/> Sweep Funds to This Account
                                </button>
                            </div>
                        ) : (
                            <div style={{color:'#16a34a', fontSize:'0.9rem', fontStyle:'italic'}}>No duplicate accounts detected.</div>
                        )}
                    </div>

                    <div className="result-card" style={{padding:'20px', textAlign:'left', background:'#1e293b', color:'#94a3b8'}}>
                        <h4 style={{marginTop:0, color:'white', display:'flex', alignItems:'center', gap:'8px'}}><Database size={18}/> Vault Record</h4>
                        <pre style={{fontSize:'0.75rem', overflowX:'auto', color:'#a5f3fc', fontFamily:'monospace'}}>
                            {JSON.stringify(secretData, null, 2)}
                        </pre>
                    </div>
                </>
            )}
        </div>

        <div style={{padding:'15px', borderTop:'1px solid #eee', background:'#f8fafc', display:'flex', gap:'10px'}}>
            <button onClick={() => updateAccountType('human')} style={{flex:1, padding:'10px', background:'white', border:'1px solid #ccc', borderRadius:'8px', cursor:'pointer'}}>Mark Human</button>
            <button onClick={() => updateAccountType('bot')} style={{flex:1, padding:'10px', background:'white', border:'1px solid #ccc', borderRadius:'8px', cursor:'pointer'}}>Mark Bot</button>
        </div>

      </div>
    </div>
  );
}