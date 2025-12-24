import { useState, useEffect } from 'react';
import { Trash2, Lock, Unlock, Shield, Bot, User, Eye, Sparkles, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, updateDoc, increment, writeBatch } from 'firebase/firestore'; 
import { db, auth } from '../../../config/firebase.prod';

interface UserData {
  id: string;
  display_name: string;
  email: string;
  photo_url?: string;
  master_pin: string;
  balance: number;
  economy_unlocked?: boolean;
  account_type?: 'human' | 'bot' | 'admin';
}

interface Props {
  onInspect: (id: string) => void;
  currentUserId?: string;
}

export default function UsersTab({ onInspect, currentUserId }: Props) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [debugLog, setDebugLog] = useState<string>("");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
      setLoading(true);
      try {
          const snap = await getDocs(collection(db, "users"));
          setUsers(snap.docs.map(d => ({id: d.id, ...d.data()} as UserData)));
      } catch(e) { console.error(e); }
      setLoading(false);
  };

  // --- THE DEBUG CRAWLER ---
  const handleSyncDatabase = async () => {
      if (!confirm("Start Diagnostic Sync? Check Console (F12) for details.")) return;
      
      setSyncing(true);
      setDebugLog("Initializing Admin Protocol...\n");
      
      try {
          const currentUser = auth.currentUser;
          
          // 1. IDENTITY CHECK
          console.log("--- 🕵️ ARCHIE DIAGNOSTICS ---");
          console.log("Logged in as:", currentUser?.email);
          console.log("UID:", currentUser?.uid);
          setDebugLog(prev => prev + `User: ${currentUser?.email} (${currentUser?.uid})\n`);

          if (!currentUser) throw new Error("No User Logged In");

          // 2. VAULT ACCESS CHECK
          setDebugLog(prev => prev + "Attempting to open Iron Vault (user_secrets)...\n");
          console.log("Requesting Read Access to 'user_secrets'...");
          
          const vaultSnap = await getDocs(collection(db, "user_secrets"));
          
          console.log("✅ ACCESS GRANTED. Secrets Found:", vaultSnap.size);
          setDebugLog(prev => prev + `✅ Vault Unlocked! Found ${vaultSnap.size} records.\n`);

          if (vaultSnap.empty) {
              alert("Sync Stopped: The Vault (user_secrets) is empty. Nothing to copy.");
              setSyncing(false);
              return;
          }

          // 3. EXECUTE SYNC
          const batch = writeBatch(db);
          let updateCount = 0;

          vaultSnap.docs.forEach((secretDoc) => {
              const data = secretDoc.data();
              const uid = secretDoc.id; 

              // If secret has an email, stamp it onto the public user card
              if (data.email) {
                  const userRef = doc(db, "users", uid);
                  batch.update(userRef, { 
                      email: data.email,
                      real_name: data.real_name || ''
                  });
                  updateCount++;
                  console.log(`Queueing update for: ${uid} -> ${data.email}`);
              }
          });

          setDebugLog(prev => prev + `Queueing ${updateCount} updates...\n`);

          // 4. COMMIT
          await batch.commit();
          console.log("Batch Commit Successful.");
          setDebugLog(prev => prev + "✅ SUCCESS: Database Synchronized.\n");
          
          alert(`✅ Success!\n\nSynced ${updateCount} records.\nEmails should now appear in the list.`);
          loadUsers(); 

      } catch (e: any) {
          console.error("❌ SYNC FATAL ERROR:", e);
          
          let tip = "Unknown Error";
          if (e.code === 'permission-denied') {
              tip = "🚨 PERMISSION DENIED 🚨\n\nYour Firestore Rules blocked this request.\n\n1. Did you run 'npm run deploy:compliment'?\n2. Is 'firestore.rules' definitely checking for YOUR email?\n3. Firebase rules can take up to 2 minutes to propagate.";
          }

          setDebugLog(prev => prev + `❌ ERROR: ${e.code} - ${e.message}\n`);
          alert(`❌ SYNC FAILED\n\nCode: ${e.code}\n\n${tip}`);
      } finally {
          setSyncing(false);
          console.log("--- DIAGNOSTICS END ---");
      }
  };

  // Standard Helpers
  const toggleLock = async (id: string, status: boolean) => { await updateDoc(doc(db, "users", id), { economy_unlocked: !status }); loadUsers(); };
  const grantCoins = async (id: string) => { if(!confirm("Grant 100?")) return; await updateDoc(doc(db, "wallets", id), { balance: increment(100) }); loadUsers(); };
  const deleteUser = async (id: string) => { if(!confirm("Delete?")) return; await deleteDoc(doc(db, "users", id)); loadUsers(); };
  const updateType = async (id: string, type: any) => { await updateDoc(doc(db, "users", id), { account_type: type }); loadUsers(); };

  const getIcon = (type?: string) => {
      switch(type) {
          case 'admin': return <Shield size={14} color="white" fill="#ef4444"/>;
          case 'bot': return <Bot size={14} color="white" fill="#64748b"/>;
          default: return <User size={14} color="white" fill="#10b981"/>;
      }
  };

  const getTypeColor = (type?: string) => {
      switch(type) {
          case 'admin': return '#ef4444';
          case 'bot': return '#64748b';
          default: return '#10b981';
      }
  };

  if(loading) return <div style={{padding:'20px', textAlign:'center', color:'#64748b'}}>Loading Directory...</div>;

  return (
    <div style={{textAlign:'left'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <h3>User Database ({users.length})</h3>
            <button 
                onClick={handleSyncDatabase} 
                disabled={syncing}
                style={{
                    background: syncing ? '#ccc' : '#1e293b', color:'white', border:'none', 
                    padding:'10px 15px', borderRadius:'8px', cursor: syncing ? 'wait' : 'pointer',
                    display:'flex', alignItems:'center', gap:'8px', fontWeight:'bold'
                }}
            >
                <RefreshCw size={18} className={syncing ? 'spin' : ''}/> {syncing ? 'Running Diagnostics...' : 'Sync Database'}
            </button>
        </div>

        {/* DEBUG LOG OUTPUT */}
        {debugLog && (
            <div style={{background:'#1e1e1e', color:'#00ff00', padding:'15px', borderRadius:'8px', marginBottom:'20px', fontFamily:'monospace', fontSize:'0.8rem', whiteSpace:'pre-wrap', border:'1px solid #333'}}>
                <div style={{color:'#888', borderBottom:'1px solid #333', paddingBottom:'5px', marginBottom:'10px', fontWeight:'bold', display:'flex', gap:'10px', alignItems:'center'}}><FileText size={14}/> SYSTEM LOG</div>
                {debugLog}
            </div>
        )}

        <div style={{display:'grid', gap:'12px'}}>
            {users.map(u => (
                <div key={u.id} className="fade-in" style={{
                    padding:'15px', background:'white', borderRadius:'16px', 
                    border: u.id === currentUserId ? '2px solid #4da6a9' : '1px solid #e2e8f0', 
                    display:'flex', flexDirection:'column', gap:'12px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                            {/* Avatar */}
                            <div onClick={() => onInspect(u.id)} style={{
                                width:'50px', height:'50px', borderRadius:'50%', cursor:'pointer',
                                border:`2px solid ${getTypeColor(u.account_type)}`, 
                                overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
                                background:'#f1f5f9', position:'relative'
                            }}>
                                {u.photo_url ? (
                                    <img src={u.photo_url} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                ) : (
                                    <span style={{fontWeight:'bold', color: getTypeColor(u.account_type), fontSize:'1.2rem'}}>
                                        {u.display_name?.[0]?.toUpperCase() || '?'}
                                    </span>
                                )}
                                <div style={{
                                    position:'absolute', bottom:0, right:0, 
                                    background: getTypeColor(u.account_type), 
                                    borderRadius:'50%', width:'18px', height:'18px', 
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    border:'2px solid white'
                                }}>
                                    {getIcon(u.account_type)}
                                </div>
                            </div>

                            {/* Info */}
                            <div>
                                <div style={{fontWeight:'bold', fontSize:'1rem', color:'#333', display:'flex', alignItems:'center', gap:'6px'}}>
                                    {u.display_name}
                                    {u.id === currentUserId && <span style={{fontSize:'0.6rem', background:'#4da6a9', color:'white', padding:'1px 5px', borderRadius:'4px'}}>ME</span>}
                                </div>
                                <div style={{fontSize:'0.8rem', color: u.email ? '#64748b' : '#ef4444', fontWeight: u.email ? 'normal' : 'bold', display:'flex', alignItems:'center', gap:'5px'}}>
                                    {!u.email && <AlertTriangle size={12}/>}
                                    {u.email || 'Email Missing'}
                                </div>
                            </div>
                        </div>

                        <div style={{textAlign:'right'}}>
                            <div style={{fontWeight:'bold', color:'#059669', fontSize:'1.1rem'}}>{u.balance || 0} <span style={{fontSize:'0.7rem', color:'#999'}}>COINS</span></div>
                            <div style={{fontSize:'0.8rem', fontFamily:'monospace', color:'#94a3b8', background:'#f8fafc', padding:'2px 6px', borderRadius:'4px', display:'inline-block', marginTop:'4px'}}>
                                PIN: {u.master_pin || '---'}
                            </div>
                        </div>
                    </div>

                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap', borderTop:'1px solid #f1f5f9', paddingTop:'12px'}}>
                        <button onClick={() => onInspect(u.id)} style={{background:'#f0f9ff', color:'#0284c7', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.85rem', fontWeight:'bold', flex:1, justifyContent:'center'}}>
                            <Eye size={16}/> Inspect
                        </button>
                        <select 
                            value={u.account_type || 'human'} 
                            onChange={(e) => updateType(u.id, e.target.value)}
                            style={{padding:'8px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:'0.85rem', background:'#fff', cursor:'pointer'}}
                        >
                            <option value="human">👤 Human</option>
                            <option value="bot">🤖 Bot</option>
                            <option value="admin">🛡️ Admin</option>
                        </select>
                        <button onClick={() => grantCoins(u.id)} style={{background:'#dcfce7', color:'#166534', border:'none', padding:'8px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <Sparkles size={18}/>
                        </button>
                        <button onClick={() => toggleLock(u.id, u.economy_unlocked || false)} style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', background: u.economy_unlocked ? '#fff7ed' : '#fee2e2', color: u.economy_unlocked ? '#c2410c' : '#b91c1c'}}>
                            {u.economy_unlocked ? <Unlock size={18}/> : <Lock size={18}/>}
                        </button>
                        <button onClick={() => deleteUser(u.id)} style={{background:'#fef2f2', color:'#ef4444', border:'none', borderRadius:'8px', cursor:'pointer', padding:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <Trash2 size={18}/>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}