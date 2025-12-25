const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({origin: true});

admin.initializeApp();
const db = admin.firestore();

// --- PHASE 2: THE BRIDGE (Connection & Claims) ---

exports.createClaim = functions.https.onCall(async (data, context) => {
  // 1. Auth Gate
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to claim.');
  }

  const { complimentId } = data;
  const claimerUid = context.auth.uid;
  const claimerName = context.auth.token.name || 'Kind Stranger';

  // 2. Fetch the Card
  const compRef = db.collection('compliments').doc(complimentId);
  const compSnap = await compRef.get();

  if (!compSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Compliment not found.');
  }
  
  const compData = compSnap.data();
  const senderUid = compData.sender_uid;

  // 3. The "Many-to-One" Chat Protocol
  // We create a UNIQUE chat ID for this specific pair: chat_{compliment}_{claimer}
  const chatId = `chat_${complimentId}_${claimerUid}`;
  const chatRef = db.collection('chats').doc(chatId);

  // 4. Atomic Update: Create Chat & Mark Pending
  await db.runTransaction(async (t) => {
    // A. Fix the "Ghost Chat" - Force BOTH participants immediately
    t.set(chatRef, {
      id: chatId,
      compliment_id: complimentId,
      participants: [claimerUid, senderUid], // <--- FIXED: Sender is added NOW.
      participant_names: [claimerName, compData.sender || 'Sender'],
      last_message: "Claim attempt initiated...",
      last_updated: admin.firestore.FieldValue.serverTimestamp(),
      type: 'claim_negotiation'
    }, { merge: true });

    // B. Create the First System Message (The Knock)
    const msgRef = chatRef.collection('messages').doc();
    t.set(msgRef, {
      text: `${claimerName} scanned your card and is saying hello!`,
      senderUid: 'SYSTEM',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // C. Update the Compliment Status
    // Note: We do NOT overwrite claimer_uid if it's already claimed by someone else,
    // but for the "Waitress Scenario", we allow multiple chats.
    // We only lock the claimer_uid in the Public Doc for the UI state.
    t.update(compRef, {
      status: 'pending_approval',
      // We track the *latest* claimer for the UI, but the Chat is the real record.
      latest_claimer_uid: claimerUid 
    });
  });

  return { success: true, chatId: chatId };
});


// --- PHASE 3: THE SETTLEMENT (Approval & Money) ---

exports.approveClaim = functions.https.onCall(async (data, context) => {
  // 1. Auth Gate
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to approve.');
  }

  const { complimentId, claimerUid } = data;
  const senderUid = context.auth.uid;

  const compRef = db.collection('compliments').doc(complimentId);
  const secretRef = db.collection('compliment_secrets').where('compliment_id', '==', complimentId).limit(1);
  
  await db.runTransaction(async (t) => {
    const compDoc = await t.get(compRef);
    if (!compDoc.exists) throw new functions.https.HttpsError('not-found', 'Card not found');
    
    // Security Check: Only the Sender can approve
    if (compDoc.data().sender_uid !== senderUid) {
      throw new functions.https.HttpsError('permission-denied', 'Only the sender can approve.');
    }

    // 2. Fetch the Secure Ledger (The Value)
    const secretQuery = await t.get(secretRef);
    if (secretQuery.empty) throw new functions.https.HttpsError('not-found', 'Ledger record missing.');
    const secretDoc = secretQuery.docs[0];
    const tipAmount = secretDoc.data().tip_amount || 0;

    // 3. Move the Money (Escrow Logic)
    if (tipAmount > 0) {
      const senderWalletRef = db.collection('wallets').doc(senderUid);
      const receiverWalletRef = db.collection('wallets').doc(claimerUid);

      const senderWallet = await t.get(senderWalletRef);
      const receiverWallet = await t.get(receiverWalletRef);

      if (!senderWallet.exists || senderWallet.data().balance < tipAmount) {
         throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds in sender wallet.');
      }

      const newSenderBal = (senderWallet.data().balance || 0) - tipAmount;
      const newReceiverBal = (receiverWallet.data().balance || 0) + tipAmount;

      t.update(senderWalletRef, { balance: newSenderBal });
      t.update(receiverWalletRef, { balance: newReceiverBal });
      
      // Log the Transaction
      const txRef = db.collection('transactions').doc();
      t.set(txRef, {
        type: 'compliment_tip',
        amount: tipAmount,
        sender_uid: senderUid,
        recipient_uid: claimerUid,
        compliment_id: complimentId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 4. Burn the Card (The Cement Rule)
    t.update(compRef, {
      status: 'claimed',
      claimer_uid: claimerUid, // Final Winner
      claimed_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // 5. Update the Private Ledger
    t.update(secretDoc.ref, {
      claimed_by: claimerUid,
      finalized_at: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  return { success: true };
});
