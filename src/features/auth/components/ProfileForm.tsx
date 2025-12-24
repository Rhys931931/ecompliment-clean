import { User, Save, LogOut, Key, RefreshCw, Link as LinkIcon, FileText, Camera, Loader } from 'lucide-react';

interface Props {
  // Data
  displayName: string;
  setDisplayName: (val: string) => void;
  photoURL: string;
  bio: string;
  setBio: (val: string) => void;
  links: string[];
  onLinkChange: (index: number, val: string) => void;
  masterPin: string;
  
  // States
  loading: boolean;
  imgLoading: boolean;
  success: string;
  
  // Actions
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onLogout: () => void;
}

export default function ProfileForm({
  displayName, setDisplayName, photoURL, bio, setBio, links, onLinkChange,
  masterPin, loading, imgLoading, success, onImageUpload, onSubmit, onLogout
}: Props) {
  
  return (
    <div style={{maxWidth:'600px', margin:'0 auto'}}>
        
        {/* HEADER */}
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
            <h1 style={{margin:0, fontSize:'1.8rem', color:'#333'}}>My Profile</h1>
            <button onClick={onLogout} style={{background:'#fee2e2', color:'#b91c1c', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'5px', alignItems:'center'}}>
                <LogOut size={16}/> Sign Out
            </button>
        </div>

        {/* PHOTO UPLOAD SECTION */}
        <div style={{textAlign:'center', marginBottom:'30px'}}>
            <div style={{position:'relative', width:'110px', height:'110px', margin:'0 auto'}}>
                <img 
                    src={photoURL || `https://ui-avatars.com/api/?name=${displayName || 'User'}&background=random`} 
                    style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', border:'4px solid white', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}
                />
                <label 
                    htmlFor="photo-upload" 
                    style={{
                        position:'absolute', bottom:'0', right:'0', 
                        background:'#4da6a9', color:'white', 
                        width:'36px', height:'36px', borderRadius:'50%', 
                        display:'flex', alignItems:'center', justifyContent:'center', 
                        cursor:'pointer', border:'3px solid white', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'
                    }}
                >
                    {imgLoading ? <Loader size={16} className="spin"/> : <Camera size={18}/>}
                </label>
                <input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={onImageUpload} 
                    style={{display:'none'}}
                />
            </div>
        </div>

        {/* MASTER KEY CARD */}
        <div className="result-card" style={{borderLeft:'4px solid #4da6a9', background:'white', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
                <h3 style={{margin:'0 0 5px 0', display:'flex', gap:'8px', alignItems:'center', color:'#333'}}>
                    <Key size={18}/> Master PIN
                </h3>
                <p style={{margin:0, fontSize:'0.85rem', color:'#666'}}>Your secret unlock code.</p>
            </div>
            <div style={{background:'#f0fdfa', padding:'8px 12px', borderRadius:'8px', fontWeight:'900', color:'#0f766e', fontFamily:'monospace', fontSize:'1.1rem'}}>
                {masterPin}
            </div>
        </div>

        {/* EDIT FORM */}
        <form onSubmit={onSubmit} className="result-card">
            <h3 style={{marginTop:0, color:'#333'}}>Public Details</h3>
            
            <label className="input-label"><User size={16}/> Display Name</label>
            <input className="text-input" value={displayName} onChange={e => setDisplayName(e.target.value)} />

            <label className="input-label"><FileText size={16}/> Bio (Short Intro)</label>
            <textarea className="text-input" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="e.g. Coffee lover, Artist, Dreamer."/>

            <label className="input-label"><LinkIcon size={16}/> My Interests (3 Links)</label>
            {links.map((link, i) => (
                <input 
                    key={i} 
                    className="text-input" 
                    style={{marginBottom:'10px'}} 
                    placeholder={`https://site-${i+1}.com`}
                    value={link}
                    onChange={e => onLinkChange(i, e.target.value)}
                />
            ))}

            <button type="submit" className="claim-btn" disabled={loading} style={{marginTop:'10px', width:'100%', justifyContent:'center'}}>
                {loading ? <RefreshCw className="spin"/> : <Save size={18}/>} Save Profile
            </button>
            {success && <p style={{textAlign:'center', color:'#166534', marginTop:'10px', fontWeight:'bold'}}>{success}</p>}
        </form>
    </div>
  );
}
