import { useState, useEffect } from 'react';
import { 
  Shield, ShoppingCart, Users, Layout, Image as ImageIcon, Printer, Eye, MessageSquare 
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase.prod';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import '../../App.css';

// Import the decoupled tabs
import OrdersTab from './tabs/OrdersTab';
import UsersTab from './tabs/UsersTab';
import AdsTab from './tabs/AdsTab';
import ThemesTab from './tabs/ThemesTab';
import PrintTab from './tabs/PrintTab';
import VisualsTab from './tabs/VisualsTab';
import ComplimentsTab from './tabs/ComplimentsTab';

export default function SuperAdmin() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'ads' | 'themes' | 'print' | 'visuals' | 'compliments'>('orders');
  
  // Printer Context (Shared State for Order -> Print flow)
  const [printContext, setPrintContext] = useState<any>({});

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const allowedAdmins = ['rhys@tvmenuswvc.com', 'rhyshaney@gmail.com']; 
      if (currentUser && allowedAdmins.includes(currentUser.email || '')) {
          setUser(currentUser);
      } else {
          alert("Access Denied.");
          navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Handler passed to OrdersTab - Added underscore to _order to silence linter
  const handleLoadToPrinter = (_order: any, customer: any, theme: any) => {
      setPrintContext({
          initialTheme: theme,
          initialCustomer: customer,
          initialCode: '12345678' // or generate one
      });
      setActiveTab('print');
  };

  return (
    <div className="app-container" style={{padding:0}}>
      <style>{`.admin-tabs-container { display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px; white-space: nowrap; scrollbar-width: none; } .admin-tabs-container::-webkit-scrollbar { display: none; } @media (min-width: 768px) { .admin-tabs-container { flex-wrap: wrap; overflow-x: visible; white-space: normal; } }`}</style>
      <NavBar user={user} />
      <main className="content-area" style={{marginTop:'60px', padding:'20px', maxWidth:'1000px', width:'100%', boxSizing:'border-box'}}>
          <div style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h1 style={{fontSize:'1.8rem', display:'flex', alignItems:'center', gap:'10px', margin:0}}><Shield color="#ef4444" size={28}/> Super Admin</h1>
          </div>

          {/* TAB NAVIGATION */}
          <div className="admin-tabs-container">
              {[
                  { id: 'orders', icon: <ShoppingCart size={18}/>, label: `Orders` },
                  { id: 'compliments', icon: <MessageSquare size={18}/>, label: `DB Cleanup` },
                  { id: 'users', icon: <Users size={18}/>, label: 'Users' },
                  { id: 'ads', icon: <Layout size={18}/>, label: 'Ad Manager' },
                  { id: 'themes', icon: <ImageIcon size={18}/>, label: 'Themes' },
                  { id: 'print', icon: <Printer size={18}/>, label: 'Print Lab' },
                  { id: 'visuals', icon: <Eye size={18}/>, label: 'Visuals' }
              ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className="claim-btn" style={{background: activeTab===tab.id ? '#1e293b' : 'white', color: activeTab===tab.id ? 'white' : '#64748b', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      {tab.icon} {tab.label}
                  </button>
              ))}
          </div>

          {/* RENDER ACTIVE TAB */}
          <div className="fade-in">
              {activeTab === 'orders' && <OrdersTab onLoadToPrinter={handleLoadToPrinter} />}
              {activeTab === 'users' && <UsersTab />}
              {activeTab === 'ads' && <AdsTab />}
              {activeTab === 'themes' && <ThemesTab />}
              {activeTab === 'compliments' && <ComplimentsTab />}
              {activeTab === 'visuals' && <VisualsTab />}
              {activeTab === 'print' && (
                  <PrintTab 
                      initialTheme={printContext.initialTheme} 
                      initialCustomer={printContext.initialCustomer} 
                      initialCode={printContext.initialCode} 
                  />
              )}
          </div>

      </main>
    </div>
  );
}
