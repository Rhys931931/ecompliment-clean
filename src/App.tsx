import { Routes, Route } from 'react-router-dom';

// Auth
import Login from './features/auth/Login';
import Onboarding from './features/auth/Onboarding';
import UserProfile from './features/auth/UserProfile';

// Compliments
import DigitalBulletinBoard from './features/compliments/DigitalBulletinBoard'; 
import CreateCompliment from './features/compliments/CreateCompliment';
import SenderAdmin from './features/compliments/SenderAdmin';
import Wallet from './features/compliments/Wallet';
import Activity from './features/compliments/Activity';
import PrintStation from './features/compliments/PrintStation';

// Social & Chat
import Connections from './features/social/Connections';
import Reviews from './features/social/Reviews';
import Chats from './features/chat/Chats';
import ChatRoom from './features/chat/ChatRoom';
import BusinessProfile from './features/social/BusinessProfile';

// Commerce & Ads
import Marketplace from './features/commerce/Marketplace';
import Balance from './features/commerce/Balance';
import AdStore from './features/ads/AdStore'; 
import BusinessIntro from './features/ads/BusinessIntro';
import BusinessDashboard from './features/ads/BusinessDashboard';

// Admin
import MainDashboard from './features/dashboard/Dashboard';
import Notifications from './features/notifications/Notifications';
import Settings from './features/settings/Settings';
import SuperAdmin from './features/admin/SuperAdmin';
import ThemeBuilder from './features/admin/pages/ThemeBuilder'; // <--- NEW IMPORT
import UserAgreement from './features/legal/UserAgreement';

import './App.css';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<DigitalBulletinBoard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/terms" element={<UserAgreement />} />
      
      {/* Main */}
      <Route path="/dashboard" element={<MainDashboard />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/onboarding" element={<Onboarding />} />
      
      {/* Features */}
      <Route path="/create" element={<CreateCompliment />} />
      <Route path="/sender" element={<SenderAdmin />} /> 
      <Route path="/activity" element={<Activity />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/print-station" element={<PrintStation />} />
      <Route path="/connections" element={<Connections />} />
      <Route path="/chats" element={<Chats />} />
      <Route path="/chat/:complimentId" element={<ChatRoom />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/business/:businessId" element={<BusinessProfile />} />
      
      {/* Commerce */}
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/balance" element={<Balance />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/ad-store" element={<AdStore />} />
      <Route path="/business-intro" element={<BusinessIntro />} />
      <Route path="/business" element={<BusinessDashboard />} />
      
      {/* Settings & Admin */}
      <Route path="/settings" element={<Settings />} />
      <Route path="/superadmin" element={<SuperAdmin />} />
      <Route path="/admin/builder" element={<ThemeBuilder />} /> {/* <--- NEW ROUTE */}
    </Routes>
  );
}
