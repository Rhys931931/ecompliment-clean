import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, increment, setDoc } from 'firebase/firestore'; 
import { db, auth } from '../../../config/firebase.prod';
import { UserPlus } from 'lucide-react';
import UserTable from '../components/UserTable';
import UserInspector from '../components/UserInspector';

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // INSPECTOR STATE
  const [inspectId, setInspectId] = useState<string | null>(null);

  useEffect(() => {
      setCurrentUser(auth.currentUser);
      loadUsers();
  }, []);

  const loadUsers = async () => {
      setLoading(true);
      try {
          const snap = await getDocs(collection(db, "users"));
          setUsers(snap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch(e) { console.error(e); }
      setLoading(false);
  };

  // ACTIONS
  const handleGrantCoins = async (userId: string) => { 
      if(!confirm("Grant 100 Coins?")) return; 
      await updateDoc(doc(db, "wallets", userId), { balance: increment(100) }); 
      try { await updateDoc(doc(db, "users", userId), { balance: increment(100) }); } catch(e) {}
      loadUsers(); 
      alert("Coins minted."); 
  };

  const toggleLock = async (userId: string, currentStatus: boolean) => { 
      await updateDoc(doc(db, "users", userId), { economy_unlocked: !currentStatus }); 
      loadUsers(); 
  };

  const handleUpdateType = async (userId: string, type: string) => {
      await updateDoc(doc(db, "users", userId), { account_type: type });
      loadUsers();
  };

  const handleDelete = async (userId: string) => { 
      if(!confirm("⚠️ Delete user? This cannot be undone.")) return; 
      await deleteDoc(doc(db, "users", userId)); 
      loadUsers(); 
  };

  const handleSelfRepair = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      const email = auth.currentUser.email;
      try {
          await setDoc(doc(db, "users", uid), {
              display_name: "Super Admin",
              email: email,
              account_type: 'admin',
              balance: 1000000,
              master_pin: 'ADMIN',
              is_super_admin: true
          }, { merge: true });
          await setDoc(doc(db, "wallets", uid), { balance: 1000000 }, { merge: true });
          alert("Admin Record Created!");
          loadUsers();
      } catch (e) { alert("Repair Failed."); }
  };

  return (
      <div className="result-card" style={{textAlign:'left', background:'#f8fafc'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h3>User Database ({users.length})</h3>
              {!loading && !users.some(u => u.id === currentUser?.uid) && (
                  <button onClick={handleSelfRepair} style={{background:'#b91c1c', color:'white', border:'none', padding:'10px 15px', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px'}}>
                      <UserPlus size={18}/> Fix My Admin Account
                  </button>
              )}
          </div>

          <UserTable 
              users={users}
              loading={loading}
              onGrantCoins={handleGrantCoins}
              onToggleLock={toggleLock}
              onDelete={handleDelete}
              onUpdateType={handleUpdateType}
              currentUserId={currentUser?.uid}
              onInspect={(id) => setInspectId(id)}
          />

          {/* THE INSPECTOR MODAL */}
          <UserInspector 
              userId={inspectId || ''} 
              isOpen={!!inspectId} 
              onClose={() => { setInspectId(null); loadUsers(); }}
              allUsers={users}
          />
      </div>
  );
}
