import { useNavigate } from 'react-router-dom';
import { Search, Plus, FolderHeart, Users, TrendingUp } from 'lucide-react';

interface GuestDashboardProps {
  user: any;
  searchCode: string;
  setSearchCode: (code: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
}

export default function GuestDashboard({ user, searchCode, setSearchCode, handleSearch, loading, error }: GuestDashboardProps) {
  const navigate = useNavigate();

  // If user is NOT logged in, show the big centered search box
  if (!user) {
    return (
      <div className="search-container fade-in" style={{marginTop:'3rem', background: 'rgba(255,255,255,0.95)', borderRadius:'16px', padding:'30px', boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
        <h2 style={{fontSize:'1.5rem', marginBottom:'1.5rem', color:'#333'}}>Receive a compliment?</h2>
        <form onSubmit={handleSearch} className="search-bar-wrapper" style={{border:'1px solid #ddd', flexDirection: 'column', gap:'10px', padding:'15px'}}>
            <div style={{display:'flex', width:'100%', gap:'10px', alignItems:'center'}}>
                <Search className="search-icon" size={24} color="#666"/>
                <input 
                    type="text" 
                    placeholder="Enter code from your card" 
                    value={searchCode} 
                    onChange={(e) => setSearchCode(e.target.value)} 
                    style={{color:'#333', fontSize:'1.1rem', flex:1, padding:'8px 0'}}
                />
            </div>
            <button type="submit" className="search-btn" disabled={loading} style={{background:'#4da6a9', width:'100%', marginTop:'5px', padding:'12px', fontSize:'1rem'}}>{loading ? "..." : "Search"}</button>
        </form>
        {error && <p className="error-msg">{error}</p>}
      </div>
    );
  }

  // If user IS logged in, show the Dashboard Grid + Small Search
  return (
    <div className="fade-in">
        <h2 style={{marginTop:0, marginBottom:'20px', color: '#333', textShadow: '0 1px 2px rgba(255,255,255,0.8)'}}>
            Hello, {user?.displayName?.split(' ')[0] || 'Friend'}
        </h2>
        
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'30px'}}>
            <div onClick={() => navigate('/create')} className="result-card" style={{background: 'rgba(255,255,255,0.9)', color: '#333', textAlign:'center', cursor:'pointer', border:'none', padding:'25px 15px'}}>
                <Plus size={32} style={{marginBottom:'10px', color: '#4da6a9'}}/>
                <div style={{fontWeight:'bold'}}>Send New</div>
            </div>
            <div onClick={() => navigate('/wallet')} className="result-card" style={{textAlign:'center', cursor:'pointer', padding:'25px 15px', background:'rgba(255,255,255,0.95)'}}>
                <FolderHeart size={32} color="#4da6a9" style={{marginBottom:'10px'}}/>
                <div style={{fontWeight:'bold', color:'#333'}}>My Wallet</div>
            </div>
            <div onClick={() => navigate('/connections')} className="result-card" style={{textAlign:'center', cursor:'pointer', padding:'25px 15px', background:'rgba(255,255,255,0.95)'}}>
                <Users size={32} color="#0284c7" style={{marginBottom:'10px'}}/>
                <div style={{fontWeight:'bold', color:'#333'}}>Network</div>
            </div>
            <div onClick={() => navigate('/business')} className="result-card" style={{textAlign:'center', cursor:'pointer', padding:'25px 15px', background:'rgba(255,255,255,0.95)'}}>
                <TrendingUp size={32} color="#f59e0b" style={{marginBottom:'10px'}}/>
                <div style={{fontWeight:'bold', color:'#333'}}>Stats</div>
            </div>
        </div>

        <div style={{borderTop:'1px solid rgba(0,0,0,0.1)', paddingTop:'20px'}}>
            <p style={{fontSize:'0.9rem', color: '#666', marginBottom:'10px', fontWeight: 'bold'}}>Received a physical card?</p>
            <form onSubmit={handleSearch} className="search-bar-wrapper" style={{boxShadow:'0 4px 15px rgba(0,0,0,0.1)', border:'1px solid #ddd', flexDirection: 'column', gap:'10px', padding:'15px'}}>
              <div style={{display:'flex', width:'100%', gap:'10px', alignItems:'center'}}>
                  <Search className="search-icon" size={24} color="#666"/>
                  <input 
                      type="text" 
                      placeholder="Enter code from your card" 
                      value={searchCode} 
                      onChange={(e) => setSearchCode(e.target.value)} 
                      style={{color:'#333', fontSize:'1.1rem', flex:1, padding:'8px 0'}}
                  />
              </div>
              <button type="submit" className="search-btn" disabled={loading} style={{background:'#4da6a9', width:'100%', marginTop:'5px', padding:'12px', fontSize:'1rem'}}>{loading ? "..." : "Go"}</button>
            </form>
        </div>
    </div>
  );
}