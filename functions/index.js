const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// 1. SEND COMPLIMENT (Standard)
exports.sendCompliment = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    
    const uid = context.auth.uid;
    const { recipient_name, message, tip_amount, card_pin, private_note, blind_key, ad_ids } = data;
    const tip = parseInt(tip_amount || 0);

    const walletRef = db.collection('wallets').doc(uid);
    const secretRef = db.collection('compliment_secrets').doc();
    const publicRef = db.collection('compliments').doc();
    const txnRef = db.collection('transactions').doc();

    return db.runTransaction(async (t) => {
        const walletDoc = await t.get(walletRef);
        const currentBalance = walletDoc.exists ? (walletDoc.data().balance || 0) : 0;

        if (tip > 0 && currentBalance < tip) throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds');

        const searchCode = Math.floor(10000000 + Math.random() * 90000000).toString();
        const magicToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const magicLink = `https://ecompliment.app/?magic=${magicToken}`;

        if (tip > 0) {
            t.update(walletRef, { balance: currentBalance - tip });
            t.set(txnRef, { uid: uid, type: 'tip_sent', amount: -tip, description: `Tip for ${recipient_name}`, timestamp: admin.firestore.FieldValue.serverTimestamp(), related_compliment: publicRef.id });
        }

        t.set(secretRef, { sender_uid: uid, card_pin: card_pin, private_note: private_note || message, tip_amount: tip, created_at: admin.firestore.FieldValue.serverTimestamp(), search_code: searchCode, ad_ids: ad_ids || [] });
        t.set(publicRef, { owner_index: blind_key, sender: 'Anonymous', recipient_name: recipient_name, message: message, timestamp: admin.firestore.FieldValue.serverTimestamp(), status: 'published', claimed: false, currency: 'coins', tip_amount: tip, search_code: searchCode, magic_token: magicToken, magic_link: magicLink, magic_token_status: 'active', ad_ids: ad_ids || [], sender_uid: uid });

        return { searchCode, magicLink, tip_amount: tip, publicId: publicRef.id };
    });
});

// 2. CREATE CLAIM (The Safety Net Version)
exports.createClaim = functions.https.onCall(async (data, context) => {
    console.log("🚀 [START] createClaim");
    
    try {
        // A. Auth Check
        if (!context.auth) throw new Error('User must be guest or logged in.');
        const uid = context.auth.uid;
        const { complimentId } = data;

        // B. Fetch Data
        const compRef = db.collection('compliments').doc(complimentId);
        const compSnap = await compRef.get();
        if (!compSnap.exists) throw new Error('Compliment not found.');
        
        const compData = compSnap.data();
        let senderUid = compData.sender_uid;

        // C. Self-Healing (Aggressive)
        if (!senderUid) {
             console.log("⚠️ Sender missing. Searching vault for code:", compData.search_code);
             
             // Try String Code
             let secretQuery = await db.collection('compliment_secrets').where('search_code', '==', String(compData.search_code)).limit(1).get();
             
             // Try Number Code (Fallback)
             if (secretQuery.empty) {
                 secretQuery = await db.collection('compliment_secrets').where('search_code', '==', Number(compData.search_code)).limit(1).get();
             }

             if (!secretQuery.empty) {
                 senderUid = secretQuery.docs[0].data().sender_uid;
                 await compRef.update({ sender_uid: senderUid }); // Save the fix
                 console.log("✅ Fixed! Sender found:", senderUid);
             } else {
                 console.error("❌ CRITICAL: Sender not found in vault.");
                 throw new Error('Card has no owner. Cannot start chat.');
             }
        }

        // D. Create Chat
        const chatId = `chat_${complimentId}_${uid}`;
        const chatRef = db.collection('chats').doc(chatId);

        await chatRef.set({
            compliment_id: complimentId,
            compliment_title: compData.recipient_name || 'Compliment',
            participants: [senderUid, uid],
            last_updated: admin.firestore.FieldValue.serverTimestamp(),
            last_message: "Chat started",
            is_guest_chat: true, 
            status: 'active'
        }, { merge: true });

        return { chatId };

    } catch (error) {
        // CATCH THE CRASH
        console.error("🔥 FATAL SERVER ERROR:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.approveClaim = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const senderUid = context.auth.uid;
    const { complimentId } = data;
    const compRef = db.collection('compliments').doc(complimentId);
    const compSnap = await compRef.get();
    if (!compSnap.exists) throw new functions.https.HttpsError('not-found', 'Not found');
    const compData = compSnap.data();
    if (compData.sender_uid !== senderUid) throw new functions.https.HttpsError('permission-denied', 'Not owner');
    const batch = db.batch();
    batch.update(compRef, { status: 'claimed', claimed: true, approved_at: admin.firestore.FieldValue.serverTimestamp() });
    if (compData.tip_amount > 0 && compData.claimer_uid) {
        batch.set(db.collection('wallets').doc(compData.claimer_uid), { balance: admin.firestore.FieldValue.increment(compData.tip_amount) }, { merge: true });
        batch.set(db.collection('transactions').doc(), { uid: compData.claimer_uid, type: 'tip_received', amount: compData.tip_amount, description: `Gift from ${compData.sender || 'Friend'}`, timestamp: admin.firestore.FieldValue.serverTimestamp(), related_compliment: complimentId });
    }
    await batch.commit();
    return { success: true };
});

exports.syncAuthToFirestore = functions.https.onCall(async (data, context) => {
    /* (Sync code omitted for brevity, keeping it unchanged is fine) */
    return { success: true };
});
