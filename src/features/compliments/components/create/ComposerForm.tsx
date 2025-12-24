import { useState, useEffect } from 'react';
import { Send, Eye, Lock, RefreshCw, Coins } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../../../config/firebase.prod'; 
import { GhostProtocol } from '../../../../services/GhostProtocol';
import AdSelector from './AdSelector';

interface Props {
  user: any;
  onSuccess: (data: any) => void;
  onRefreshHistory?: () => void;
}

export default function ComposerForm({ user, onSuccess, onRefreshHistory }: Props) {
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [displayPin, setDisplayPin] = useState('');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [customTip, setCustomTip] = useState('');
  const [selectedAd, setSelectedAd] = useState<string | null>(null);

  useEffect(() => {
      const loadSecurity = async () => {
          if (!user) return;
          try {
              const userDoc = await getDoc(doc(db, "users", user.uid));
              if (userDoc.exists()) setDisplayPin(userDoc.data().master_pin || '');
          } catch(e) { console.error(e); }
      };
      loadSecurity();
  }, [user]);

  const generateSafeMasterPin = () => {
      const safeChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; 
      let result = '';
      for (let i = 0; i < 5; i++) result += safeChars.charAt(Math.floor(Math.random() * safeChars.length));
      return result;
  };

  const generateBlindKey = () => 'bx_' + Math.random().toString(36).substring(2, 14);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    setLoading(true);

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        let dbPin = userSnap.exists() ? userSnap.data().master_pin : '';
        let blindKey = userSnap.exists() ? userSnap.data().blind_key : '';

        if (!dbPin) {
            dbPin = generateSafeMasterPin();
            await updateDoc(userRef, { master_pin: dbPin });
        }
        if (!blindKey) {
            blindKey = generateBlindKey();
            await updateDoc(userRef, { blind_key: blindKey });
        }

        const finalTip = customTip ? parseInt(customTip) : tipAmount;

        const result = await GhostProtocol.send({
            recipient_name: recipient || 'Friend',
            message: message,
            sender_display_name: user.displayName || 'Anonymous',
            sender_uid: user.uid,
            blind_key: blindKey,
            sender_photo: user.photoURL || '',
            tip_amount: finalTip || 0,
            private_note: privateNote,
            card_pin: dbPin,
            ad_ids: selectedAd ? [selectedAd] : []
        });

        // Pass result up to parent
        onSuccess({
            search_code: result.searchCode, 
            magic_link: result.magicLink,
            tip_amount: result.tip_amount,
            pin_backup: dbPin 
        });
        
        if (onRefreshHistory) onRefreshHistory();

    } catch (err) {
        console.error("Error creating:", err);
        alert("Could not create. (Check coins?)");
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
        <label className="input-label">Who is this for?</label>
        <input className="text-input" placeholder="e.g. The Barista" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        <label className="input-label">Your Message</label>
        <textarea className="text-input" rows={4} placeholder="e.g. Your smile made my day!" value={message} onChange={(e) => setMessage(e.target.value)} style={{resize:'none'}} required />
        
        <AdSelector selectedAd={selectedAd} onSelect={setSelectedAd} />

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
  );
}
