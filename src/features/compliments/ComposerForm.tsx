import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ComposerForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateEightDigitCode = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  const generateFiveDigitPin = () => {
    // Generate secure 5-digit PIN for the specific card
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const complimentRef = doc(collection(db, 'compliments'));
      const secretRef = doc(collection(db, 'compliment_secrets'));
      const cardPin = generateFiveDigitPin();
      const searchCode = generateEightDigitCode();

      // UNIVERSAL LEDGER PROTOCOL: Public card has NO VALUE, only a reference.
      const publicCard = {
        id: complimentRef.id,
        owner_index: user.blind_key || user.uid, // Use Blind Key if available
        ledger_id: secretRef.id,     // Points to the value
        search_code: searchCode,
        recipient_name: recipientName,
        message: message,
        sender: isAnonymous ? 'Anonymous' : (user.display_name || 'A Friend'),
        sender_uid: user.uid,
        status: 'created',
        timestamp: serverTimestamp(),
        // NO tip_amount here!
        // NO card_pin here!
      };

      // PRIVATE LEDGER: Holds the PIN and the Money
      const privateReceipt = {
        compliment_id: complimentRef.id,
        ledger_id: secretRef.id,
        sender_uid: user.uid,
        card_pin: cardPin,       // Secure Location
        tip_amount: Number(tipAmount), // Secure Location
        created_at: serverTimestamp(),
        private_note: "Original creation"
      };

      await runTransaction(db, async (transaction) => {
        // If there is a tip, we could deduct wallet balance here (Escrow).
        // For now, we just create the artifact securely.
        transaction.set(complimentRef, publicCard);
        transaction.set(secretRef, privateReceipt);
      });

      // Navigate to the Success/Share page (You'll need to implement this view)
      navigate('/dashboard'); 
      alert(`Compliment Created! Code: ${searchCode}`);

    } catch (err: any) {
      console.error("Error creating compliment:", err);
      setError('Failed to create compliment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create a Compliment</h2>
      
      {error && <div className="mb-4 text-red-500 bg-red-50 p-3 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Who is this for?</label>
          <input
            type="text"
            required
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            placeholder="e.g. The Barista, My Mom"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Your Message</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            placeholder="Write something kind..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Add a Tip (Coins)</label>
          <input
            type="number"
            min="0"
            value={tipAmount}
            onChange={(e) => setTipAmount(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
          <p className="text-xs text-gray-500 mt-1">This amount will be hidden until claimed.</p>
        </div>

        <div className="flex items-center">
          <input
            id="anonymous"
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-900">
            Send Anonymously
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Compliment'}
        </button>
      </form>
    </div>
  );
};

export default ComposerForm;
