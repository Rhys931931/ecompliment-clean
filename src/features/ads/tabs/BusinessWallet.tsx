import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase.prod';

export default function BusinessWallet() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadHistory = async () => {
          if (!auth.currentUser) return;
          try {
              const qTrans = query(collection(db, "transactions"), where("uid", "==", auth.currentUser.uid), orderBy("timestamp", "desc"), limit(20));
              const transSnap = await getDocs(qTrans);
              setTransactions(transSnap.docs.map(d => ({id: d.id, ...d.data()})));
          } catch(e) { console.error(e); }
          setLoading(false);
      };
      loadHistory();
  }, []);

  if(loading) return <div>Loading Ledger...</div>;

  return (
      <div className="dashboard-list">
          {transactions.length === 0 && <p style={{color:'#999'}}>No transactions yet.</p>}
          {transactions.map(t => (
              <div key={t.id} className="result-card" style={{padding:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', textAlign:'left'}}>
                  <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                      <div style={{width:'40px', height:'40px', borderRadius:'50%', background: t.amount > 0 ? '#dcfce7' : '#fee2e2', display:'flex', alignItems:'center', justifyContent:'center'}}>{t.amount > 0 ? <ArrowDownLeft size={20} color="#166534"/> : <ArrowUpRight size={20} color="#b91c1c"/>}</div>
                      <div><div style={{fontWeight:'bold', color:'#333'}}>{t.description}</div><div style={{fontSize:'0.8rem', color:'#999'}}>{t.type.replace('_', ' ').toUpperCase()}</div></div>
                  </div>
                  <div style={{fontWeight:'bold', fontSize:'1.1rem', color: t.amount > 0 ? '#166534' : '#b91c1c'}}>{t.amount > 0 ? '+' : ''}{t.amount}</div>
              </div>
          ))}
      </div>
  );
}
