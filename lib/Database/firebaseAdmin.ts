import "server-only";
import admin from "firebase-admin";

function formatPrivateKey(key: string | undefined): string {
    if (!key) return "";

    // 1. If the key was wrapped in extra quotes, remove them
    let formattedKey = key.replace(/^['"]|['"]$/g, '');

    // 2. Replace escaped \n with actual newline characters
    // This handles the "Invalid PEM" error by ensuring the SDK sees a real block of text
    return formattedKey.replace(/\\n/g, '\n');
}

export function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    // DEBUG LOG: This will show you in the terminal if the key starts correctly
    // It should look like: Key starts with: -----BEGIN PRIVATE KEY-----
    console.log("Key starts with:", privateKey.substring(0, 25));

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error("Missing Firebase Admin environment variables.");
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
}

// Export initialized services for use in API routes
const adminApp = getFirebaseAdmin();
export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);