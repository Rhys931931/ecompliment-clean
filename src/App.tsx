import { Routes, Route } from 'react-router-dom';

// Auth
import Login from './features/auth/Login';
import OnboardingPage from './features/auth/OnboardingPage';
import UserProfile from './features/auth/UserProfile';

// Compliments
import DigitalBulletinBoard from './features/compliments/DigitalBulletinBoard'; 
import CreateCompliment from './features/compliments/CreateCompliment';
import SenderAdmin from './features/compliments/SenderAdmin';
import Wallet from './features/compliments/Wallet';
import ActivityPage from './features/compliments/ActivityPage';
import PrintStation from './features/compliments/PrintStation';

// Social & Chat
import Connections from './features/social/Connections';
import ReviewsPage from './features/social/ReviewsPage';
import ChatsPage from './features/chat/ChatsPage';
import ChatRoom from './features/chat/ChatRoom';
import BusinessProfile from './features/social/BusinessProfile';

// Commerce & Ads
import Marketplace from './features/commerce/Marketplace';
import BalancePage from './features/commerce/BalancePage';
import AdStore from './features/ads/AdStore'; 
import BusinessIntro from './features/ads/BusinessIntro';
import BusinessDashboard from './features/ads/BusinessDashboard';

// Admin
import MainDashboard from './features/dashboard/Dashboard';
import NotificationsPage from './features/notifications/NotificationsPage';
import SettingsPage from './features/settings/SettingsPage';
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
      <Route path="/onboarding" element={<OnboardingPage />} />
      
      {/* Features */}
      <Route path="/create" element={<CreateCompliment />} />
      <Route path="/sender" element={<SenderAdmin />} /> 
      <Route path="/activity" element={<ActivityPage />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/print-station" element={<PrintStation />} />
      <Route path="/connections" element={<Connections />} />
      <Route path="/chats" element={<ChatsPage />} />
      <Route path="/chat/:complimentId" element={<ChatRoom />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/business/:businessId" element={<BusinessProfile />} />
      
      {/* Commerce */}
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/balance" element={<BalancePage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/ad-store" element={<AdStore />} />
      <Route path="/business-intro" element={<BusinessIntro />} />
      <Route path="/business" element={<BusinessDashboard />} />
      
      {/* Settings & Admin */}
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/superadmin" element={<SuperAdmin />} />
      <Route path="/admin/builder" element={<ThemeBuilder />} /> {/* <--- NEW ROUTE */}
    </Routes>
  );
}
