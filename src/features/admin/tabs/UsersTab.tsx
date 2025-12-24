import { useState, useEffect } from 'react';
import { Trash2, Lock, Unlock, Coins, Edit2 } from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, updateDoc, increment } from 'firebase/firestore'; 
import { db } from '../../../config/firebase.prod';

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
      try {
          const snap = await getDocs(collection(db, "users"));
          setUsers(snap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch(e) { console.error(e); }
      setLoading(false);
  };

  const toggleEconomyLock = async (userId: string, currentStatus: boolean) => { await updateDoc(doc(db, "users", userId), { economy_unlocked: !currentStatus }); loadUsers(); };
  const handleGrantCoins = async (userId: string) => { if(!confirm("Grant 100 Coins?")) return; await updateDoc(doc(db, "wallets", userId), { balance: increment(100) }); alert("Coins minted."); };
  const handleDeleteUser = async (userId: string) => { if(!confirm("⚠️ Delete user?")) return; await deleteDoc(doc(db, "users", userId)); loadUsers(); };
  const handleResetPin = async (userId: string) => { const newPin = prompt("Enter 5-digit PIN:"); if(!newPin) return; await updateDoc(doc(db, "users", userId), { master_pin: newPin }); loadUsers(); };

  if(loading) return <div>Loading Users...</div>;

  return (
      <div className="result-card" style={{textAlign:'left'}}>
          <h3>User Database ({users.length})</h3>
          <div style={{display:'grid', gap:'10px'}}>
              {users.map(u => (
                  <div key={u.id} style={{padding:'15px', background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0'}}>
                      <div style={{display:'flex', justifyContent:'space-between'}}>
                          <div style={{fontWeight:'bold'}}>{u.display_name}</div>
                          <div style={{fontSize:'0.8rem', fontFamily:'monospace'}}>PIN: {u.master_pin || '❌'}</div>
                      </div>
                      <div style={{fontSize:'0.8rem', color:'#666', marginBottom:'10px'}}>{u.email}</div>
                      <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                          <button onClick={() => handleResetPin(u.id)} style={{background:'#e0f2fe', color:'#0369a1', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.8rem'}}><Edit2 size={14}/> Reset PIN</button>
                          <button onClick={() => handleDeleteUser(u.id)} style={{background:'#fee2e2', color:'#b91c1c', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.8rem'}}><Trash2 size={14}/> Delete</button>
                          <button onClick={() => handleGrantCoins(u.id)} style={{background:'#dcfce7', color:'#166534', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.8rem'}}><Coins size={14}/> Grant 100</button>
                          <button onClick={() => toggleEconomyLock(u.id, u.economy_unlocked || false)} style={{display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold', background: u.economy_unlocked ? '#dcfce7' : '#fee2e2', color: u.economy_unlocked ? '#166534' : '#b91c1c'}}>{u.economy_unlocked ? <><Unlock size={14}/> Open</> : <><Lock size={14}/> Lock</>}</button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
}
