import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, getDoc, query, where } from 'firebase/firestore'; 
import { db } from '../../../config/firebase.prod';

export default function ComplimentsTab() {
  const [compliments, setCompliments] = useState<any[]>([]);

  useEffect(() => {
      getDocs(collection(db, "compliments")).then(snap => {
          setCompliments(snap.docs.map(d => ({id: d.id, ...d.data()})));
      });
  }, []);

  const handleDelete = async (id: string) => { 
      if(!confirm("Delete this card AND its secret record?")) return; 
      
      try {
          // 1. Get the public card to find the link (search_code)
          const cardRef = doc(db, "compliments", id);
          const cardSnap = await getDoc(cardRef);
          
          if (cardSnap.exists()) {
              const data = cardSnap.data();
              
              // 2. Find and delete the secret (Linked by search_code)
              if (data.search_code) {
                  const q = query(collection(db, "compliment_secrets"), where("search_code", "==", data.search_code));
                  const secretSnap = await getDocs(q);
                  
                  // Delete all matching secrets (usually just one)
                  const deletePromises = secretSnap.docs.map(d => deleteDoc(d.ref));
                  await Promise.all(deletePromises);
              }
          }

          // 3. Delete the public card
          await deleteDoc(cardRef); 
          
          // 4. Update UI
          setCompliments(prev => prev.filter(c => c.id !== id)); 
          
      } catch (e) {
          console.error("Cleanup failed:", e);
          alert("Error deleting files.");
      }
  };

  return (
      <div className="result-card" style={{textAlign:'left'}}>
          <h3>Database Cleanup</h3>
          <div style={{display:'grid', gap:'10px'}}>
              {compliments.map(c => (
                  <div key={c.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #eee'}}>
                      <div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                          <div style={{fontWeight:'bold'}}>{c.recipient_name}</div>
                          <div style={{fontSize:'0.8rem', color:'#666'}}>{c.message ? c.message.substring(0,40) : 'No message'}...</div>
                          <div style={{fontSize:'0.7rem', color: c.search_code ? '#166534' : '#b91c1c', fontWeight:'bold'}}>{c.search_code ? `Code: ${c.search_code}` : '⚠️ OLD DATA (No Code)'}</div>
                      </div>
                      <button onClick={() => handleDelete(c.id)} style={{color:'#ef4444', background:'none', border:'none', cursor:'pointer'}}><Trash2 size={18}/></button>
                  </div>
              ))}
          </div>
      </div>
  );
}
