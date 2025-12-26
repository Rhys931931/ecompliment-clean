import { db, auth } from '../config/firebase.prod'; // Correct Import Path
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export interface GhostComplimentData {
  recipient_name: string;
  message: string;
  card_pin: string;
  tip_amount: number;
  sender_display_name?: string;
  sender_uid?: string; 
  blind_key?: string;
  sender_photo?: string;
  private_note?: string;
  ad_ids?: string[];
}

export const GhostProtocol = {
  async send(data: GhostComplimentData) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to send.');

    const tip = data.tip_amount || 0;

    return await runTransaction(db, async (transaction) => {
        // 1. Get References
        const userHubRef = doc(db, 'users', user.uid);
        const walletRef = doc(db, 'wallets', user.uid);
        const secretRef = doc(collection(db, 'compliment_secrets'));
        const publicRef = doc(collection(db, 'compliments'));
        const transRef = doc(collection(db, 'transactions'));

        // 2. Read Data
        const userHubSnap = await transaction.get(userHubRef);
        const walletSnap = await transaction.get(walletRef);

        if (!userHubSnap.exists()) throw new Error('User Hub missing.');
        
        const currentBalance = walletSnap.exists() ? (walletSnap.data().balance || 0) : 0;
        if (tip > 0 && currentBalance < tip) {
            throw new Error(`Insufficient funds. You have ${currentBalance} coins.`);
        }

        const blindKey = userHubSnap.data().blind_key;
        if (!blindKey) throw new Error('Blind Key missing.');

        // 3. Generate Codes
        const searchCode = Math.floor(10000000 + Math.random() * 90000000).toString();
        const magicToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const magicLink = `https://ecompliment.app/?magic=${magicToken}`;

        // 4. Deduct Money
        if (tip > 0) {
            transaction.update(walletRef, { balance: currentBalance - tip });
            transaction.set(transRef, {
                uid: user.uid,
                type: 'tip_sent',
                amount: -tip,
                description: `Tip for ${data.recipient_name}`,
                timestamp: serverTimestamp(),
                related_compliment: publicRef.id
            });
        }

        // 5. Write Private Data (Receipt)
        transaction.set(secretRef, {
            sender_uid: user.uid,
            card_pin: data.card_pin,
            private_note: data.private_note || data.message, 
            tip_amount: tip,
            created_at: serverTimestamp(),
            ip_hash: 'PROTECTED',
            search_code: searchCode,
            ad_ids: data.ad_ids || []
        });

        // 6. Write Public Data (The Card)
        transaction.set(publicRef, {
            owner_index: blindKey,
            sender: 'Anonymous',
            sender_uid: user.uid, // <--- THE CRITICAL MISSING LINK!
            recipient_name: data.recipient_name,
            message: data.message,
            timestamp: serverTimestamp(),
            status: 'published',
            claimed: false,
            currency: 'coins',
            tip_amount: tip,
            search_code: searchCode,
            magic_token: magicToken,
            magic_link: magicLink,
            magic_token_status: 'active',
            ad_ids: data.ad_ids || []
        });

        return { 
            secretId: secretRef.id, 
            publicId: publicRef.id,
            searchCode: searchCode,
            magicLink: magicLink,
            tip_amount: tip,
            pin_backup: data.card_pin
        };
    });
  },

  async validateAndBurn(complimentId: string, token: string) {
    console.log("Validating burn for:", complimentId, token);
    return true; // Simple pass-through for now
  }
};
