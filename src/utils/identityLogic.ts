/**
 * THE BOT HUNTER ALGORITHM
 * Reduces an email address to its "Canonical" (Real) form to detect duplicates.
 * This does NOT merge accounts; it only identifies relationships.
 */
export function getCanonicalEmail(email: string | null | undefined): string {
    if (!email) return '';
    
    // 1. Lowercase everything
    let cleanEmail = email.toLowerCase().trim();
    
    let [local, domain] = cleanEmail.split('@');
    if (!domain) return cleanEmail; // Invalid email, return as is

    // 2. The Domain Swap (Legacy Google)
    if (domain === 'googlemail.com') domain = 'gmail.com';

    // 3. The Plus Trick (Universal Aggressive)
    // We assume any usage of "+" is a sub-account/alias for the same human.
    local = local.split('+')[0];

    // 4. The Dot Trick (Gmail Specific)
    // Only Gmail ignores dots. Outlook/Apple strictly respect them.
    if (domain === 'gmail.com') {
        local = local.replace(/\./g, '');
    }

    return `${local}@${domain}`;
}
