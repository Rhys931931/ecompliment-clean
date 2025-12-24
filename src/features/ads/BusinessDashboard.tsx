import { useState, useEffect } from 'react';
import { Briefcase, Plus, History, ArrowLeft, ExternalLink } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../config/firebase.prod';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import '../../App.css';

// Import Tabs
import BusinessOverview from './tabs/BusinessOverview';
import CampaignManager from './tabs/CampaignManager';
import BusinessWallet from './tabs/BusinessWallet';

export default function BusinessDashboard() {
  const [user, setUser] = useState<any>(null);
  const [blindKey, setBlindKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'history'>('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Get Blind Key for the "External Link" button
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) setBlindKey(userDoc.data().blind_key || '');
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="app-container" style={{background:'#f8fafc'}}>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop:'60px', padding:'20px', maxWidth:'800px'}}>
          <div style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                  <button onClick={() => navigate('/dashboard')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#666', marginBottom:'5px'}}><ArrowLeft size={18} /> Back</button>
                  <h1 style={{fontSize:'1.8rem', display:'flex', alignItems:'center', gap:'10px', margin:0, color:'#333'}}><Briefcase color="#4da6a9" size={28}/> Business Portal</h1>
              </div>
              {blindKey && (
                  <button onClick={() => navigate(`/business/${blindKey}`)} className="claim-btn" style={{fontSize:'0.9rem', padding:'8px 12px', background:'white', border:'1px solid #4da6a9', color:'#4da6a9'}}>
                      <ExternalLink size={16}/> View Page
                  </button>
              )}
          </div>

          <div style={{display:'flex', gap:'10px', marginBottom:'20px', overflowX:'auto'}}>
              <button onClick={() => setActiveTab('overview')} className="claim-btn" style={{background: activeTab==='overview'?'#1e293b':'white', color: activeTab==='overview'?'white':'#64748b', border:'1px solid #cbd5e1'}}>Overview</button>
              <button onClick={() => setActiveTab('create')} className="claim-btn" style={{background: activeTab==='create'?'#1e293b':'white', color: activeTab==='create'?'white':'#64748b', border:'1px solid #cbd5e1'}}><Plus size={18}/> Campaigns</button>
              <button onClick={() => setActiveTab('history')} className="claim-btn" style={{background: activeTab==='history'?'#1e293b':'white', color: activeTab==='history'?'white':'#64748b', border:'1px solid #cbd5e1'}}><History size={18} style={{marginRight:'5px'}}/> Ledger</button>
          </div>

          <div className="fade-in">
              {activeTab === 'overview' && <BusinessOverview />}
              {activeTab === 'create' && <CampaignManager />}
              {activeTab === 'history' && <BusinessWallet />}
          </div>
      </main>
    </div>
  );
}
