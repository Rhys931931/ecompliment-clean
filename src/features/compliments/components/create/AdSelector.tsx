import { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../config/firebase.prod';

interface Props {
  selectedAd: string | null;
  onSelect: (id: string | null) => void;
}

export default function AdSelector({ selectedAd, onSelect }: Props) {
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
      const loadInventory = async () => {
          if (!auth.currentUser) return;
          try {
              const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
              if (userDoc.exists()) {
                  const adIds = userDoc.data().saved_ad_ids || [];
                  if (adIds.length > 0) {
                      const ads = [];
                      for (const id of adIds) {
                          const adSnap = await getDoc(doc(db, "ads", id));
                          if (adSnap.exists()) ads.push({ id: adSnap.id, ...adSnap.data() });
                      }
                      setInventory(ads);
                  }
              }
          } catch(e) { console.error(e); }
      };
      loadInventory();
  }, []);

  if (inventory.length === 0) return null;

  return (
    <div style={{marginBottom:'15px'}}>
        <label className="input-label" style={{display:'flex', alignItems:'center', gap:'5px', color:'#ec4899'}}>
            <Ticket size={16}/> Attach a Coupon (Optional)
        </label>
        <div style={{display:'flex', overflowX:'auto', gap:'10px', paddingBottom:'5px'}}>
            <div 
                onClick={() => onSelect(null)}
                style={{
                    border: !selectedAd ? '2px solid #666' : '1px solid #eee', 
                    padding:'10px', borderRadius:'8px', cursor:'pointer', flexShrink:0,
                    background: !selectedAd ? '#f3f4f6' : 'white', opacity: !selectedAd ? 1 : 0.7
                }}
            >
                None
            </div>
            {inventory.map(ad => (
                <div 
                    key={ad.id}
                    onClick={() => onSelect(ad.id)}
                    style={{
                        border: selectedAd === ad.id ? `2px solid ${ad.color}` : '1px solid #eee',
                        borderLeft: `4px solid ${ad.color}`,
                        padding:'10px', borderRadius:'8px', cursor:'pointer', minWidth:'140px', flexShrink:0,
                        background: selectedAd === ad.id ? '#fff' : '#fafafa'
                    }}
                >
                    <div style={{fontWeight:'bold', fontSize:'0.85rem'}}>{ad.name}</div>
                    <div style={{fontSize:'0.75rem', color:'#666'}}>{ad.offer}</div>
                </div>
            ))}
        </div>
    </div>
  );
}
