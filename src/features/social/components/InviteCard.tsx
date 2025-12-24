import { Share2, Check, Copy } from 'lucide-react';

interface Props {
  referralCode: string;
  onCopy: () => void;
  copied: boolean;
}

export default function InviteCard({ referralCode, onCopy, copied }: Props) {
  return (
    <div className="result-card" style={{background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color:'white', textAlign:'left', marginBottom:'25px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
            <div>
                <h3 style={{margin:'0 0 5px 0', color:'white'}}>Invite & Earn</h3>
                <p style={{fontSize:'0.85rem', opacity:0.8, margin:0}}>Share your link. Earn coins when friends join.</p>
            </div>
            <Share2 color="#4da6a9" />
        </div>
        <div style={{marginTop:'15px', background:'rgba(255,255,255,0.1)', padding:'10px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <code style={{fontFamily:'monospace', letterSpacing:'1px'}}>{referralCode}</code>
            <button onClick={onCopy} style={{background:'none', border:'none', color:'white', cursor:'pointer', display:'flex', gap:'5px', alignItems:'center'}}>
                {copied ? <Check size={16} color="#4da6a9"/> : <Copy size={16}/>}
                <span style={{fontSize:'0.8rem'}}>{copied ? "Copied" : "Copy"}</span>
            </button>
        </div>
    </div>
  );
}
