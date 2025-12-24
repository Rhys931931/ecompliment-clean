import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { auth } from '../../config/firebase.prod';
// Import new modular parts
import ComposerForm from './components/create/ComposerForm';
import TransferReceipt from './components/create/TransferReceipt';

interface Props {
    user?: any;
    onSuccess?: () => void;
}

export default function CreateCompliment({ user, onSuccess }: Props) {
  const activeUser = user || auth.currentUser;
  const [createdItem, setCreatedItem] = useState<any>(null);

  if (createdItem) {
      return (
          <TransferReceipt 
              data={createdItem} 
              onReset={() => setCreatedItem(null)} 
          />
      );
  }

  return (
    <div className="result-card" style={{borderTop:'4px solid #4da6a9'}}>
        <h2 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px'}}>
            <Sparkles size={24} color="#f59e0b" fill="#f59e0b" />
            Send Good Vibes
        </h2>
        {activeUser && (
            <ComposerForm 
                user={activeUser} 
                onSuccess={(data) => setCreatedItem(data)}
                onRefreshHistory={onSuccess}
            />
        )}
    </div>
  );
}
