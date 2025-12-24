import { Lock } from 'lucide-react';

interface Props {
  senderName: string;
  pinInput: string;
  setPinInput: (val: string) => void;
  onUnlock: () => void;
  onCancel: () => void;
  themeColor: string;
  btnStyle: React.CSSProperties;
}

export default function UnlockScreen({ senderName, pinInput, setPinInput, onUnlock, onCancel, themeColor, btnStyle }: Props) {
  return (
    <div className="glass-card slide-up">
        <div style={{width:'80px', height:'80px', background:'#f1f5f9', borderRadius:'50%', margin:'0 auto 20px auto', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <Lock size={30} color={themeColor}/>
        </div>
        <h2 style={{margin:0}}>Private Message</h2>
        <p style={{color:'#64748b', margin:'5px 0 20px 0'}}>From: {senderName}</p>
        
        <div style={{background:'white', padding:'20px', borderRadius:'16px', border:'1px solid #e2e8f0', marginBottom:'20px'}}>
            <label className="input-label" style={{textAlign:'center'}}>Enter 5-Character PIN</label>
            <input 
                className="text-input" 
                maxLength={5} 
                placeholder="ABC12" 
                value={pinInput} 
                onChange={e => setPinInput(e.target.value.toUpperCase())} 
            />
            <button onClick={onUnlock} className="claim-btn" style={{width:'100%', justifyContent:'center', ...btnStyle}}>
                Unlock
            </button>
        </div>
        <button onClick={onCancel} style={{background:'none', border:'none', color:'#64748b', cursor:'pointer'}}>Cancel</button>
    </div>
  );
}
