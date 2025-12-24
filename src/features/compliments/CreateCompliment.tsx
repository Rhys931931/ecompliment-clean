import { useState, useEffect } from 'react';
import { Send, Sparkles, Eye, Lock, RefreshCw, Check, Copy, Coins, ShieldCheck, Ticket } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { db, auth } from '../../config/firebase.prod'; 
import { QRCodeSVG } from 'qrcode.react'; 
import { GhostProtocol } from '../../services/GhostProtocol';

interface Props {
    user?: any;
    onSuccess?: () => void;
}

export default function CreateCompliment({ user, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const activeUser = user || auth.currentUser;

  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [displayPin, setDisplayPin] = useState('');
  
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [customTip, setCustomTip] = useState('');

  const [myInventory, setMyInventory] = useState<any[]>([]);
  const [selectedAd, setSelectedAd] = useState<string | null>(null);

  const [createdItem, setCreatedItem] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
      if(activeUser) {
          loadUserSecurity(activeUser.uid);
          loadAdInventory(activeUser.uid);
      }
  }, [activeUser]);

  const loadUserSecurity = async (uid: string) => {
      try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) setDisplayPin(userDoc.data().master_pin || '');
      } catch(e) { console.error(e); }
  };

  const loadAdInventory = async (uid: string) => {
      try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
              const adIds = userDoc.data().saved_ad_ids || [];
              if (adIds.length > 0) {
                  // Fetch ad details
                  const ads = [];
                  for (const id of adIds) {
                      const adSnap = await getDoc(doc(db, "ads", id));
                      if (adSnap.exists()) ads.push({ id: adSnap.id, ...adSnap.data() });
                  }
                  setMyInventory(ads);
              }
          }
      } catch(e) { console.error(e); }
  };

  const generateSafeMasterPin = () => {
      const safeChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; 
      let result = '';
      for (let i = 0; i < 5; i++) result += safeChars.charAt(Math.floor(Math.random() * safeChars.length));
      return result;
  };

  const generateBlindKey = () => {
      return 'bx_' + Math.random().toString(36).substring(2, 14);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeUser) return;
    setLoading(true);

    try {
        const userRef = doc(db, "users", activeUser.uid);
        const userSnap = await getDoc(userRef);
        
        let dbPin = userSnap.exists() ? userSnap.data().master_pin : '';
        let blindKey = userSnap.exists() ? userSnap.data().blind_key : '';

        if (!dbPin) {
            dbPin = generateSafeMasterPin();
            await updateDoc(userRef, { master_pin: dbPin });
        }
        setDisplayPin(dbPin);

        if (!blindKey) {
            blindKey = generateBlindKey();
            await updateDoc(userRef, { blind_key: blindKey });
        }

        const finalTip = customTip ? parseInt(customTip) : tipAmount;

        const result = await GhostProtocol.send({
            recipient_name: recipient || 'Friend',
            message: message,
            sender_display_name: activeUser.displayName || 'Anonymous',
            sender_uid: activeUser.uid,
            blind_key: blindKey,
            sender_photo: activeUser.photoURL || '',
            tip_amount: finalTip || 0,
            private_note: privateNote,
            card_pin: dbPin,
            ad_ids: selectedAd ? [selectedAd] : [] // ATTACH CARGO
        });

        setCreatedItem({ 
            search_code: result.searchCode, 
            magic_link: result.magicLink,
            tip_amount: result.tip_amount,
            pin_backup: dbPin 
        });
        
        setRecipient('');
        setMessage('');
        setPrivateNote('');
        setTipAmount(0);
        setCustomTip('');
        setSelectedAd(null);
        
        if(onSuccess) onSuccess();

    } catch (err) {
        console.error("Error creating:", err);
        alert("Could not create.");
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdItem) {
      return (
        <div className="result-card slide-up" style={{
            textAlign:'center', borderTop:'4px solid #10b981', marginTop:'20px',
            background: 'linear-gradient(to bottom, #ffffff, #f0fdf4)'
        }}>
            <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', marginBottom:'10px', color:'#10b981'}}>
                <ShieldCheck size={28}/>
                <h2 style={{margin:0}}>Secure Transfer</h2>
            </div>
            <p style={{color:'#666', fontSize:'0.9rem'}}>This QR Code works <strong>once</strong>.</p>
            <div style={{background:'white', padding:'20px', borderRadius:'20px', border:'2px solid #10b981', display:'inline-block', margin:'15px 0'}}>
                <QRCodeSVG value={createdItem.magic_link} size={160} />
            </div>
            <div style={{background:'white', padding:'15px', borderRadius:'12px', border:'1px dashed #94a3b8', display:'flex', justifyContent:'space-around', alignItems:'center', margin:'10px 0'}}>
                <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'0.7rem', color:'#64748b', textTransform:'uppercase'}}>Search Code</div>
                    <div style={{fontSize:'1.4rem', fontWeight:'900', fontFamily:'monospace', color:'#334155'}}>{createdItem.search_code}</div>
                </div>
                <div style={{height:'30px', borderLeft:'1px solid #cbd5e1'}}></div>
                <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'0.7rem', color:'#64748b', textTransform:'uppercase'}}>Unlock PIN</div>
                    <div style={{fontSize:'1.4rem', fontWeight:'900', fontFamily:'monospace', color:'#e11d48'}}>{createdItem.pin_backup}</div>
                </div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'20px'}}>
                <button onClick={() => copyToClipboard(createdItem.magic_link)} className="claim-btn" style={{border:'1px solid #ddd', background:'#fff'}}>
                    {copied ? <Check size={18} color="green"/> : <Copy size={18}/>} {copied ? "Copied!" : "Copy Magic Link"}
                </button>
                <button onClick={() => setCreatedItem(null)} className="search-btn">Create Another</button>
            </div>
        </div>
      );
  }

  return (
    <div className="result-card" style={{borderTop:'4px solid #4da6a9'}}>
        <h2 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px'}}>
            <Sparkles size={24} color="#f59e0b" fill="#f59e0b" />
            Send Good Vibes
        </h2>
        <form onSubmit={handleCreate}>
            <label className="input-label">Who is this for?</label>
            <input className="text-input" placeholder="e.g. The Barista" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            <label className="input-label">Your Message</label>
            <textarea className="text-input" rows={4} placeholder="e.g. Your smile made my day!" value={message} onChange={(e) => setMessage(e.target.value)} style={{resize:'none'}} required />
            
            {/* AD ATTACHMENT */}
            {myInventory.length > 0 && (
                <div style={{marginBottom:'15px'}}>
                    <label className="input-label" style={{display:'flex', alignItems:'center', gap:'5px', color:'#ec4899'}}>
                        <Ticket size={16}/> Attach a Coupon (Optional)
                    </label>
                    <div style={{display:'flex', overflowX:'auto', gap:'10px', paddingBottom:'5px'}}>
                        <div 
                            onClick={() => setSelectedAd(null)}
                            style={{
                                border: !selectedAd ? '2px solid #666' : '1px solid #eee', 
                                padding:'10px', borderRadius:'8px', cursor:'pointer', flexShrink:0,
                                background: !selectedAd ? '#f3f4f6' : 'white', opacity: !selectedAd ? 1 : 0.7
                            }}
                        >
                            None
                        </div>
                        {myInventory.map(ad => (
                            <div 
                                key={ad.id}
                                onClick={() => setSelectedAd(ad.id)}
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
            )}

            <div style={{background:'#fffbeb', padding:'15px', borderRadius:'12px', marginBottom:'15px', border:'1px solid #fcd34d'}}>
                <label className="input-label" style={{display:'flex', alignItems:'center', gap:'5px', color:'#92400e', marginBottom:'10px'}}><Coins size={16} fill="#f59e0b" color="#b45309"/> Attach Coins (Reward)</label>
                <div style={{display:'flex', gap:'8px', marginBottom:'10px'}}>
                    {[10, 20, 50, 100].map(amt => (
                        <button key={amt} type="button" onClick={() => { setTipAmount(amt); setCustomTip(''); }} style={{flex:1, padding:'8px', borderRadius:'8px', border:'1px solid', borderColor: tipAmount === amt ? '#b45309' : '#fcd34d', background: tipAmount === amt ? '#fef3c7' : 'white', color: tipAmount === amt ? '#92400e' : '#b45309', fontWeight:'bold', cursor:'pointer'}}>{amt}</button>
                    ))}
                </div>
                <div style={{position:'relative'}}>
                    <Coins size={16} style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#b45309'}}/>
                    <input type="number" className="text-input" style={{margin:0, paddingLeft:'35px', borderColor:'#fcd34d'}} placeholder="Custom amount..." value={customTip} onChange={(e) => { setCustomTip(e.target.value); setTipAmount(0); }}/>
                </div>
            </div>
            <label className="input-label" style={{display:'flex', alignItems:'center', gap:'5px', color:'#64748b'}}><Eye size={16}/> Private Note</label>
            <input className="text-input" placeholder="Only you see this..." value={privateNote} onChange={(e) => setPrivateNote(e.target.value)} />
            <div style={{fontSize:'0.8rem', color:'#666', marginBottom:'15px', display:'flex', alignItems:'center', gap:'5px'}}><Lock size={12}/> Secured by your PIN: <strong>{displayPin || "Loading..."}</strong></div>
            <button type="submit" className="search-btn" disabled={loading} style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>{loading ? <RefreshCw className="spin" /> : <Send size={20} />} {loading ? "Creating..." : (tipAmount || customTip) ? `Send with ${customTip || tipAmount} Coins` : "Create Compliment"}</button>
        </form>
    </div>
  );
}
