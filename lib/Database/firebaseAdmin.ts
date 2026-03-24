import "server-only";
import admin from "firebase-admin";

function formatPrivateKey(key: string | undefined): string {
    if (!key) return "";
    // Removes wrapping quotes and handles escaped newlines properly
    return key.replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');
}

/**
 * Ensures the Firebase Admin SDK is initialized exactly once.
 */
const initializeAdmin = () => {
    // If an app already exists, return the existing auth/db services
    if (admin.apps.length > 0) {
        return {
            adminAuth: admin.auth(),
            adminDb: admin.firestore(),
        };
    }

    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error("Missing Firebase Admin environment variables. Check your .env file.");
    }

    const app = admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });

    return {
        adminAuth: admin.auth(app),
        adminDb: admin.firestore(app),
    };
};

// Export services for use in Server Actions or API Routes
export const { adminAuth, adminDb } = initializeAdmin();