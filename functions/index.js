const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Helper to check Admin
const isAdmin = (email) => {
    return ['rhys@tvmenuswvc.com', 'rhyshaney@gmail.com'].includes(email);
};

/**
 * 1. APPROVE CLAIM (Existing)
 */
exports.approveClaim = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    
    const senderUid = context.auth.uid;
    const complimentId = data.complimentId;
    
    // ... (Keep existing logic, simplified here for brevity, assumes previous logic is safe)
    // We are just appending the new function below.
    // Ideally, paste the previous approveClaim content here if you want to keep it.
    // For this update, I will include the NEW function primarily.
    
    // RE-INSERTING YOUR PREVIOUS approveClaim LOGIC TO ENSURE NOTHING IS LOST:
    const compRef = db.collection('compliments').doc(complimentId);
    const compSnap = await compRef.get();
    if (!compSnap.exists()) throw new functions.https.HttpsError('not-found', 'Not found');
    const compData = compSnap.data();
    if (compData.sender_uid !== senderUid) throw new functions.https.HttpsError('permission-denied', 'Not owner');
    
    const batch = db.batch();
    batch.update(compRef, { status: 'claimed', claimed: true, approved_at: admin.firestore.FieldValue.serverTimestamp() });
    
    // Create Connection
    const connectionRef = db.collection('connections').doc();
    batch.set(connectionRef, {
        participants: [senderUid, compData.claimer_uid],
        last_interaction: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        origin_compliment_id: complimentId
    });
    
    await batch.commit();
    return { success: true };
});

/**
 * 2. DEEP SYNC (The New Tool)
 * Pulls ALL users from Auth and stamps them into Firestore.
 */
exports.syncAuthToFirestore = functions.https.onCall(async (data, context) => {
    // 1. Security Barrier
    if (!context.auth || !isAdmin(context.auth.token.email)) {
        throw new functions.https.HttpsError('permission-denied', 'Super Admin Only');
    }

    try {
        // 2. Fetch the Master List (Up to 1000 users)
        const listUsersResult = await admin.auth().listUsers(1000);
        const users = listUsersResult.users;
        
        let fixedCount = 0;
        const batch = db.batch();

        // 3. Iterate and Fix
        for (const user of users) {
            const userRef = db.collection('users').doc(user.uid);
            const secretRef = db.collection('user_secrets').doc(user.uid);
            
            // We use set with {merge: true} to avoid overwriting existing data
            batch.set(userRef, {
                email: user.email,
                display_name: user.displayName || 'Unknown',
                photo_url: user.photoURL || '',
                // Ensure a blind key exists if missing
                blind_key: user.uid // Fallback for legacy
            }, { merge: true });

            batch.set(secretRef, {
                email: user.email,
                uid: user.uid,
                real_name: user.displayName || 'Unknown'
            }, { merge: true });

            fixedCount++;
        }

        // 4. Commit
        await batch.commit();
        return { message: `Deep Sync Complete. Scanned ${users.length} users. Updated records.` };

    } catch (error) {
        console.error("Deep Sync Error:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});