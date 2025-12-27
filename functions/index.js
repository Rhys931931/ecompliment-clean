const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

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

exports.createClaim = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) throw new Error('User must be guest or logged in.');
        const uid = context.auth.uid;
        const { complimentId } = data;

        const compRef = db.collection('compliments').doc(complimentId);
        const compSnap = await compRef.get();
        if (!compSnap.exists) throw new Error('Compliment not found.');
        
        const compData = compSnap.data();
        let senderUid = compData.sender_uid;

        if (!senderUid) {
             let secretQuery = await db.collection('compliment_secrets').where('search_code', '==', String(compData.search_code)).limit(1).get();
             if (secretQuery.empty) secretQuery = await db.collection('compliment_secrets').where('search_code', '==', Number(compData.search_code)).limit(1).get();

             if (!secretQuery.empty) {
                 senderUid = secretQuery.docs[0].data().sender_uid;
                 await compRef.update({ sender_uid: senderUid }); 
             } else {
                 throw new Error('Card has no owner. Cannot start chat.');
             }
        }

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
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.approveClaim = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    
    const { requestId, complimentId } = data;
    const senderUid = context.auth.uid;

    try {
        let targetUid, compId, tipAmount;
        
        if (requestId) {
            const reqRef = db.collection('claim_requests').doc(requestId);
            const reqSnap = await reqRef.get();
            if (!reqSnap.exists) throw new Error("Request not found");
            
            const reqData = reqSnap.data();
            if (reqData.sender_uid !== senderUid) throw new Error("Not your compliment");
            
            targetUid = reqData.requester_uid;
            compId = reqData.compliment_id;
            
            await reqRef.update({ status: 'approved', approved_at: admin.firestore.FieldValue.serverTimestamp() });
        } else {
            throw new Error("Must provide requestId");
        }

        const compRef = db.collection('compliments').doc(compId);
        const compSnap = await compRef.get();
        const compData = compSnap.data();
        tipAmount = compData.tip_amount || 0;

        const batch = db.batch();

        // 1. UPDATE PUBLIC CARD (Toggle Protocol: NO DELETION)
        batch.update(compRef, { 
            status: 'claimed', 
            claimed: true, 
            claimer_uid: targetUid,
            approved_at: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. TRANSFER MONEY
        if (tipAmount > 0) {
            const walletRef = db.collection('wallets').doc(targetUid);
            batch.set(walletRef, { balance: admin.firestore.FieldValue.increment(tipAmount) }, { merge: true });
            
            const txnRef = db.collection('transactions').doc();
            batch.set(txnRef, { 
                uid: targetUid, 
                type: 'tip_received', 
                amount: tipAmount, 
                description: `Gift from ${compData.sender || 'Friend'}`, 
                timestamp: admin.firestore.FieldValue.serverTimestamp(), 
                related_compliment: compId 
            });
        }

        // 3. DENY LOSERS
        const otherReqs = await db.collection('claim_requests')
            .where('compliment_id', '==', compId)
            .where('status', '==', 'pending')
            .get();

        otherReqs.forEach(doc => {
            if (doc.id !== requestId) {
                batch.update(doc.ref, { status: 'denied' });
                
                const chatId = `chat_${compId}_${doc.data().requester_uid}`;
                const msgRef = db.collection('chats').doc(chatId).collection('messages').doc();
                batch.set(msgRef, {
                    text: "🔒 This compliment was claimed by someone else.",
                    senderUid: "SYSTEM",
                    senderName: "eCompliment",
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    type: "system"
                });
            }
        });

        await batch.commit();
        return { success: true };

    } catch (error) {
        console.error("Approval Error:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.syncAuthToFirestore = functions.https.onCall(async (data, context) => {
    return { success: true };
});
