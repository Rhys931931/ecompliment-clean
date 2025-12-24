import { useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  data: {
    search_code: string;
    magic_link: string;
    tip_amount: number;
    pin_backup: string;
  };
  onReset: () => void;
}

export default function TransferReceipt({ data, onReset }: Props) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.magic_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <QRCodeSVG value={data.magic_link} size={160} />
        </div>
        <div style={{background:'white', padding:'15px', borderRadius:'12px', border:'1px dashed #94a3b8', display:'flex', justifyContent:'space-around', alignItems:'center', margin:'10px 0'}}>
            <div style={{textAlign:'center'}}>
                <div style={{fontSize:'0.7rem', color:'#64748b', textTransform:'uppercase'}}>Search Code</div>
                <div style={{fontSize:'1.4rem', fontWeight:'900', fontFamily:'monospace', color:'#334155'}}>{data.search_code}</div>
            </div>
            <div style={{height:'30px', borderLeft:'1px solid #cbd5e1'}}></div>
            <div style={{textAlign:'center'}}>
                <div style={{fontSize:'0.7rem', color:'#64748b', textTransform:'uppercase'}}>Unlock PIN</div>
                <div style={{fontSize:'1.4rem', fontWeight:'900', fontFamily:'monospace', color:'#e11d48'}}>{data.pin_backup}</div>
            </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'20px'}}>
            <button onClick={copyToClipboard} className="claim-btn" style={{border:'1px solid #ddd', background:'#fff'}}>
                {copied ? <Check size={18} color="green"/> : <Copy size={18}/>} {copied ? "Copied!" : "Copy Magic Link"}
            </button>
            <button onClick={onReset} className="search-btn">Create Another</button>
        </div>
    </div>
  );
}
