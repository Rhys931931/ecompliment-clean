import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Save, Eye, Lock, Users, QrCode } from 'lucide-react';
import { doc, deleteDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase.prod';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  secret: any; // Can be a 'secret' (Sent) or a 'public doc' (Received)
  mode: 'sent' | 'received';
  onUpdate: () => void;
}

export default function ActivityDetailModal({ isOpen, onClose, secret, mode, onUpdate }: Props) {
  // Fix: Removed unused 'loading' variable, kept setter
  const [, setLoading] = useState(true);
  const [publicDoc, setPublicDoc] = useState<any>(null);
  const [claimRequests, setClaimRequests] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Edit States
  const [publicMessage, setPublicMessage] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [recipientName, setRecipientName] = useState('');

  useEffect(() => {
    if (isOpen && secret) {
        if (mode === 'sent') {
            fetchSentDetails();
        } else {
            // For Received, the 'secret' passed IS the public doc
            setPublicDoc(secret);
            setPublicMessage(secret.message);
            setRecipientName(secret.sender); // Sender name for display
            setLoading(false);
        }
    }
  }, [isOpen, secret, mode]);

  const fetchSentDetails = async () => {
      setLoading(true);
      try {
          // 1. Fetch Public Card
          const q = query(collection(db, 'compliments'), where('search_code', '==', secret.search_code));
          const snap = await getDocs(q);
          
          if (!snap.empty) {
              const data = snap.docs[0].data();
              const pDoc = { id: snap.docs[0].id, ...data };
              setPublicDoc(pDoc);
              setPublicMessage(data.message || '');
              setRecipientName(data.recipient_name || '');
              
              // 2. Fetch Claim Attempts (The "Who tried?" feature)
              const qClaims = query(collection(db, 'claim_requests'), where('compliment_id', '==', pDoc.id));
              const claimsSnap = await getDocs(qClaims);
              setClaimRequests(claimsSnap.docs.map(d => ({id: d.id, ...d.data()})));
          }
          
          setPrivateNote(secret.private_note || '');

      } catch (e) { console.error(e); }
      setLoading(false);
  };

  const handleSave = async () => {
      try {
          if (mode === 'sent') {
              if (publicDoc) {
                  await updateDoc(doc(db, 'compliments', publicDoc.id), { message: publicMessage, recipient_name: recipientName });
              }
              await updateDoc(doc(db, 'compliment_secrets', secret.id), { private_note: privateNote });
              alert("Saved!");
              setIsEditing(false);
              onUpdate();
          }
      } catch (e) { alert("Save failed."); }
  };

  const handleDelete = async () => {
      if (!confirm("Delete forever?")) return;
      try {
          if (publicDoc) await deleteDoc(doc(db, 'compliments', publicDoc.id));
          await deleteDoc(doc(db, 'compliment_secrets', secret.id));
          onClose();
          onUpdate();
      } catch (e) { alert("Delete failed."); }
  };

  if (!isOpen) return null;

  // Fix: Removed unused 'isClaimed' variable
  const qrUrl = publicDoc?.magic_token ? `https://ecompliment.app/?magic=${publicDoc.magic_token}` : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-700 m-0 flex items-center gap-2">
                {mode === 'sent' ? <Edit2 size={18}/> : <Eye size={18}/>}
                {mode === 'sent' ? 'Manage Compliment' : 'View Keepsake'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
        </div>

        <div className="p-6 overflow-y-auto">
            
            {/* PUBLIC CARD INFO */}
            <div className="mb-6">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">The Message</div>
                {isEditing ? (
                    <div className="flex flex-col gap-3">
                        <input className="text-input" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Recipient Name" />
                        <textarea className="text-input" rows={3} value={publicMessage} onChange={e => setPublicMessage(e.target.value)} />
                    </div>
                ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="font-bold text-lg text-gray-800 mb-1">{recipientName}</div>
                        <div className="text-gray-600 italic">"{publicMessage}"</div>
                    </div>
                )}
            </div>

            {/* SENT MODE FEATURES */}
            {mode === 'sent' && (
                <>
                    {/* PRIVATE NOTE */}
                    <div className="mb-6">
                        <div className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-2 flex items-center gap-2"><Lock size={12}/> Private Note</div>
                        {isEditing ? (
                            <textarea className="text-input bg-yellow-50 border-yellow-200" rows={2} value={privateNote} onChange={e => setPrivateNote(e.target.value)} />
                        ) : (
                            <div className="text-gray-500 text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-100">{privateNote || "No private notes."}</div>
                        )}
                    </div>

                    {/* QR CODE REVEAL */}
                    <div className="mb-6 text-center">
                        <button onClick={() => setShowQR(!showQR)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 w-full border border-blue-100 hover:bg-blue-100">
                            <QrCode size={16}/> {showQR ? "Hide QR Code" : "Show QR for In-Person"}
                        </button>
                        {showQR && qrUrl && (
                            <div className="mt-4 p-4 bg-white border-2 border-blue-100 rounded-xl inline-block shadow-lg">
                                <QRCodeSVG value={qrUrl} size={180} />
                                <div className="text-xs text-blue-400 mt-2 font-mono">{secret.search_code}</div>
                            </div>
                        )}
                    </div>

                    {/* CLAIM LOGS */}
                    <div className="mb-4">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Users size={12}/> Interaction Log</div>
                        {claimRequests.length === 0 ? (
                            <div className="text-gray-400 text-sm italic">No attempts yet.</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {claimRequests.map(req => (
                                    <div key={req.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="text-sm font-bold text-gray-700">{req.requester_name}</div>
                                        <div className={`text-xs font-bold px-2 py-1 rounded ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'}`}>
                                            {req.status.toUpperCase()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>

        {/* ACTIONS FOOTER */}
        {mode === 'sent' && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700"><Save size={18}/> Save</button>
                        <button onClick={() => setIsEditing(false)} className="px-4 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-200">Cancel</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsEditing(true)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50">
                            <Edit2 size={18}/> Edit
                        </button>
                        <button onClick={handleDelete} className="px-4 py-3 bg-red-50 text-red-600 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-100 border border-red-100">
                            <Trash2 size={18}/>
                        </button>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
