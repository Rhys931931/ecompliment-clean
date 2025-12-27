import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, getDoc, query, where } from 'firebase/firestore'; 
import { db } from '../../../config/firebase.prod';

export default function ComplimentsTab() {
  const [compliments, setCompliments] = useState<any[]>([]);

  useEffect(() => {
      loadData();
  }, []);

  const loadData = () => {
      getDocs(collection(db, "compliments")).then(snap => {
          setCompliments(snap.docs.map(d => ({id: d.id, ...d.data()})));
      });
  };

  const handleDelete = async (id: string) => { 
      if(!confirm("⚠️ Are you sure? This deletes the Card AND the Secret Receipt.")) return; 
      
      console.log(`[ADMIN] Starting cleanup for Public ID: ${id}`);

      try {
          const cardRef = doc(db, "compliments", id);
          const cardSnap = await getDoc(cardRef);
          
          if (!cardSnap.exists()) {
              console.warn("[ADMIN] Public card not found. Removing from list.");
              setCompliments(prev => prev.filter(c => c.id !== id));
              return;
          }

          const data = cardSnap.data();
          
          if (data.search_code) {
              console.log(`[ADMIN] Searching for secrets with code: ${data.search_code}`);
              const q = query(collection(db, "compliment_secrets"), where("search_code", "==", data.search_code));
              const secretSnap = await getDocs(q);
              
              if (!secretSnap.empty) {
                  const deletePromises = secretSnap.docs.map(d => deleteDoc(d.ref));
                  await Promise.all(deletePromises);
              }
          }

          await deleteDoc(cardRef); 
          console.log("[ADMIN] Cleanup Success!");
          setCompliments(prev => prev.filter(c => c.id !== id)); 
          
      } catch (e: any) {
          console.error("🔥 [ADMIN FATAL ERROR] Cleanup Failed:", e);
          if (e.code === 'permission-denied') {
              alert(`PERMISSION DENIED.\n\nDatabase rules rejected you.\nCheck 'firestore.rules'.`);
          } else {
              alert(`Error: ${e.message}`);
          }
      }
  };

  return (
      <div className="result-card" style={{textAlign:'left'}}>
          <h3>Database Cleanup</h3>
          <p style={{fontSize:'0.9rem', color:'#666', marginBottom:'20px'}}>
              Deleting a card here removes it from the public feed AND wipes the sender's private receipt.
          </p>
          <div style={{display:'grid', gap:'10px'}}>
              {compliments.map(c => (
                  <div key={c.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #eee'}}>
                      <div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1}}>
                          <div style={{fontWeight:'bold'}}>{c.recipient_name || 'Unknown'}</div>
                          <div style={{fontSize:'0.8rem', color:'#666'}}>{c.message ? c.message.substring(0,40) : 'No message'}...</div>
                          <div style={{fontSize:'0.7rem', color: c.search_code ? '#166534' : '#b91c1c', fontWeight:'bold'}}>{c.search_code ? `Code: ${c.search_code}` : '⚠️ OLD DATA'}</div>
                      </div>
                      <button onClick={() => handleDelete(c.id)} style={{color:'#ef4444', background:'white', border:'1px solid #fee2e2', borderRadius:'6px', padding:'8px', cursor:'pointer', marginLeft:'10px'}}>
                          <Trash2 size={18}/>
                      </button>
                  </div>
              ))}
          </div>
      </div>
  );
}
