import type { FirebaseOptions } from "firebase/app";

/**
 * LAW #5B: SPLIT BRAIN SAFETY PROTOCOL
 * Prevents Localhost from ever connecting to the Production Database Project.
 */
export function validateEnvironment(config: FirebaseOptions): void {
  const isLocalhost = 
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1";

  // Check if the config points to the Production Project ID
  const isProdProject = config.projectId === "compliment-app-production";

  if (isLocalhost && isProdProject) {
    const errorMsg = `
      🚨 FATAL ERROR: SPLIT BRAIN DETECTED 🚨
      ----------------------------------------
      You are attempting to connect Localhost to the PRODUCTION Database.
      This is a violation of Law #5B.
      
      Execution has been halted to protect integrity.
    `;
    
    document.body.innerHTML = `<pre style="color:red; font-size: 1.5rem; padding: 2rem; white-space: pre-wrap;">${errorMsg}</pre>`;
    throw new Error("KILL SWITCH ACTIVATED: Localhost -> Prod connection attempt.");
  }
}
