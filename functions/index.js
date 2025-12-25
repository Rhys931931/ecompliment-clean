const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Helper to check Admin
const isAdmin = (email) => {
    return ['rhys@tvmenuswvc.com', 'rhyshaney@gmail.com'].includes(email);
};

// 1. SEND COMPLIMENT
exports.sendCompliment = functions.https.onCall(async (data, context) => {
    // Basic Auth Check
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

        if (tip > 0 && currentBalance < tip) {
            throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds');
        }

        const searchCode = Math.floor(10000000 + Math.random() * 90000000).toString();
        const magicToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const magicLink = `https://ecompliment.app/?magic=${magicToken}`;

        if (tip > 0) {
            t.update(walletRef, { balance: currentBalance - tip });
            t.set(txnRef, {
                uid: uid,
                type: 'tip_sent',
                amount: -tip,
                description: `Tip for ${recipient_name}`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                related_compliment: publicRef.id
            });
        }

        t.set(secretRef, {
            sender_uid: uid,
            card_pin: card_pin,
            private_note: private_note || message,
            tip_amount: tip,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            search_code: searchCode,
            ad_ids: ad_ids || []
        });

        t.set(publicRef, {
            owner_index: blind_key,
            sender: 'Anonymous', 
            recipient_name: recipient_name,
            message: message,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'published',
            claimed: false,
            currency: 'coins',
            tip_amount: tip,
            search_code: searchCode,
            magic_token: magicToken,
            magic_link: magicLink,
            magic_token_status: 'active',
            ad_ids: ad_ids || [],
            sender_uid: uid 
        });

        return { searchCode, magicLink, tip_amount: tip, publicId: publicRef.id };
    });
});

// 2. CREATE CLAIM (THE GUEST CHAT STARTER)
exports.createClaim = functions.https.onCall(async (data, context) => {
    // Allow Anonymous users (Guests)
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be guest or logged in.');

    const uid = context.auth.uid;
    const { complimentId } = data;

    const compRef = db.collection('compliments').doc(complimentId);
    const compSnap = await compRef.get();
    if (!compSnap.exists) throw new functions.https.HttpsError('not-found', 'Compliment not found.');
    
    const compData = compSnap.data();
    const senderUid = compData.sender_uid;

    // Unique Chat ID per Guest
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
});

// 3. APPROVE CLAIM
exports.approveClaim = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    
    const senderUid = context.auth.uid;
    const complimentId = data.complimentId;
    
    const compRef = db.collection('compliments').doc(complimentId);
    const compSnap = await compRef.get();
    
    if (!compSnap.exists) throw new functions.https.HttpsError('not-found', 'Not found');
    const compData = compSnap.data();
    
    if (compData.sender_uid !== senderUid) throw new functions.https.HttpsError('permission-denied', 'Not owner');
    
    const batch = db.batch();
    
    batch.update(compRef, { 
        status: 'claimed', 
        claimed: true, 
        approved_at: admin.firestore.FieldValue.serverTimestamp() 
    });
    
    if (compData.tip_amount > 0 && compData.claimer_uid) {
        const recipientWalletRef = db.collection('wallets').doc(compData.claimer_uid);
        batch.set(recipientWalletRef, { 
            balance: admin.firestore.FieldValue.increment(compData.tip_amount) 
        }, { merge: true });

        const rxTxnRef = db.collection('transactions').doc();
        batch.set(rxTxnRef, {
            uid: compData.claimer_uid,
            type: 'tip_received',
            amount: compData.tip_amount,
            description: `Gift from ${compData.sender || 'Friend'}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            related_compliment: complimentId
        });
    }
    
    await batch.commit();
    return { success: true };
});

// 4. DEEP SYNC
exports.syncAuthToFirestore = functions.https.onCall(async (data, context) => {
    if (!context.auth || !isAdmin(context.auth.token.email)) {
        throw new functions.https.HttpsError('permission-denied', 'Super Admin Only');
    }
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users;
    const batch = db.batch();
    for (const user of users) {
        const userRef = db.collection('users').doc(user.uid);
        const secretRef = db.collection('user_secrets').doc(user.uid);
        batch.set(userRef, {
            email: user.email,
            display_name: user.displayName || 'Unknown',
            photo_url: user.photoURL || '',
            blind_key: user.uid
        }, { merge: true });
        batch.set(secretRef, {
            email: user.email,
            uid: user.uid,
            real_name: user.displayName || 'Unknown'
        }, { merge: true });
    }
    await batch.commit();
    return { message: `Deep Sync Complete. Scanned ${users.length} users.` };
});
