const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * SECURE APPROVAL FUNCTION
 * Transferred from Client-Side to Server-Side for Security.
 */
exports.approveClaim = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
    }
    
    const senderUid = context.auth.uid;
    const complimentId = data.complimentId;

    if (!complimentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing Compliment ID');
    }

    try {
        // 2. Fetch Compliment
        const compRef = db.collection('compliments').doc(complimentId);
        const compSnap = await compRef.get();

        if (!compSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Compliment not found');
        }

        const compData = compSnap.data();

        // 3. Verify Ownership (Only Sender can approve)
        if (compData.sender_uid !== senderUid) {
            throw new functions.https.HttpsError('permission-denied', 'Not your compliment');
        }

        // 4. Verify Status
        if (compData.status !== 'pending_approval') {
            throw new functions.https.HttpsError('failed-precondition', 'Card is not pending approval');
        }

        const claimerUid = compData.claimer_uid;
        const tipAmount = compData.tip_amount || 0;

        if (!claimerUid) {
            throw new functions.https.HttpsError('aborted', 'No claimer attached');
        }

        // 5. EXECUTE TRANSACTION (The Iron Vault)
        const batch = db.batch();

        // A. Update Compliment Status
        batch.update(compRef, { 
            status: 'claimed', 
            claimed: true, 
            approved_at: admin.firestore.FieldValue.serverTimestamp() 
        });

        // B. Create Connection
        const connectionRef = db.collection('connections').doc(); // Auto-ID
        batch.set(connectionRef, {
            participants: [senderUid, claimerUid],
            last_interaction: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            origin_compliment_id: complimentId
        });

        // C. Transfer Money (Server Privilege)
        if (tipAmount > 0) {
            const claimerWalletRef = db.collection('wallets').doc(claimerUid);
            const transRef = db.collection('transactions').doc();

            // MINT coins to receiver (Sender already paid at creation)
            batch.update(claimerWalletRef, { 
                balance: admin.firestore.FieldValue.increment(tipAmount) 
            });

            // Receipt
            batch.set(transRef, {
                uid: claimerUid,
                type: 'tip_received',
                amount: tipAmount,
                description: 'Tip from Friend',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                related_compliment: complimentId
            });
        }

        await batch.commit();
        return { success: true };

    } catch (error) {
        console.error("Approval Error:", error);
        throw new functions.https.HttpsError('internal', 'Transaction failed');
    }
});
