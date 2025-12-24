import { Trash2, Search, Loader } from 'lucide-react';

interface AdData {
  id: string;
  name: string;
  offer: string;
  coupon_code: string;
  color: string;
}

interface WalletItem {
  id: string;
  sender: string;
  message: string;
  date?: any;
  ads: AdData[];
}

interface Props {
  items: WalletItem[];
  loading: boolean;
  onRemove: (id: string) => void;
  onView: (id: string) => void;
}

export default function WalletList({ items, loading, onRemove, onView }: Props) {
  
  if (loading) return <div style={{textAlign:'center'}}><Loader className="spin"/> Checking for cards...</div>;

  if (items.length === 0) {
      return (
          <div style={{padding:'30px', textAlign:'center', border:'1px dashed #ccc', borderRadius:'12px'}}>
              <p style={{color:'#666'}}>Your wallet is empty.</p>
              <small>Scan a QR code to start your collection.</small>
          </div>
      );
  }

  return (
    <div className="dashboard-list">
        {items.map(item => (
            <div key={item.id} className="result-card" style={{padding:'20px', marginBottom:'20px', textAlign:'left'}}>
                
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                    <div>
                        <div style={{fontWeight:'bold', fontSize:'1.2rem', color:'#333'}}>{item.sender}</div>
                        <div style={{fontSize:'0.8rem', color:'#666'}}>
                            "{item.message ? item.message.substring(0, 50) + (item.message.length > 50 ? '...' : '') : 'You are awesome!'}"
                        </div>
                    </div>
                    <button onClick={() => onRemove(item.id)} style={{background:'none', border:'none', cursor:'pointer', color:'#999'}}>
                        <Trash2 size={18}/>
                    </button>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    {item.ads.length === 0 && <p style={{fontSize:'0.8rem', color:'#ccc', fontStyle:'italic'}}>No coupons attached.</p>}
                    
                    {item.ads.map(ad => (
                        <div key={ad.id} style={{background:'#f9fafb', borderLeft:`4px solid ${ad.color}`, padding:'10px', borderRadius:'6px'}}>
                            <div style={{fontWeight:'bold', fontSize:'1rem'}}>{ad.name}</div>
                            <div style={{fontSize:'0.8rem', color:'#555'}}>{ad.offer}</div>
                            <div style={{marginTop:'5px', fontSize:'0.75rem', fontWeight:'bold', color: ad.color, border:'1px dashed #ddd', display:'inline-block', padding:'2px 6px', borderRadius:'4px', background:'white'}}>
                                CODE: {ad.coupon_code}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
                    <button onClick={() => onView(item.id)} className="claim-btn" style={{fontSize:'0.9rem', padding:'10px', background:'white', color:'#4da6a9', border:'1px solid #4da6a9'}}>
                        <Search size={16}/> View Chat
                    </button>
                </div>

            </div>
        ))}
    </div>
  );
}
