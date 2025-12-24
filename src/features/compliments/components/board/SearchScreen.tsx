import { Search, Loader, AlertTriangle } from 'lucide-react';

interface Props {
  searchCode: string;
  setSearchCode: (val: string) => void;
  onSearch: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
  btnStyle: React.CSSProperties;
}

export default function SearchScreen({ searchCode, setSearchCode, onSearch, loading, error, btnStyle }: Props) {
  return (
    <div className="glass-card fade-in">
        <h1 style={{margin:'0 0 10px 0', fontSize:'2rem', color:'#333'}}>Redeem Your Card</h1>
        <p style={{margin:'0 0 30px 0', color:'#64748b'}}>Enter the 8-digit code found on your card.</p>
        
        <form onSubmit={onSearch}>
            <div style={{position:'relative', marginBottom:'15px'}}>
                <Search style={{position:'absolute', top:'14px', left:'15px', color:'#64748b'}} size={20}/>
                <input 
                    className="text-input" 
                    placeholder="12345678" 
                    maxLength={8} 
                    value={searchCode} 
                    onChange={e => setSearchCode(e.target.value.replace(/\D/g,''))} 
                />
            </div>
            <button type="submit" className="claim-btn" disabled={loading} style={{width:'100%', justifyContent:'center', ...btnStyle}}>
                {loading ? <Loader className="spin"/> : "Find Gift"}
            </button>
        </form>
        {error && (
            <div style={{marginTop:'20px', color:'#b91c1c', background:'#fee2e2', padding:'10px', borderRadius:'8px', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'5px'}}>
                <AlertTriangle size={16}/> {error}
            </div>
        )}
    </div>
  );
}
