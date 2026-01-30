import { adminAuth, adminDb } from "@/app/Database/firebaseAdmin";
import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Secure sign up route for admin

export async function POST(request: Request) {
    const body = await request.json()
    const { formData } = body

    try {
        const userCredential = await adminAuth.createUser({
            email: formData.email,
            password: formData.password
        })

        if (!userCredential.uid) {
            return NextResponse.json({
                message: "Failed to create user",
                error: "User ID not found"
            })
        }

        await adminDb.collection("users").doc(userCredential.uid).set({
            name: formData.name,
            email: formData.email,
            university: formData.university,
            profileCompleted: true,
        })

        return NextResponse.json({
            message: "User created successfully",
            user: userCredential.uid
        })
    } catch (error) {
        return NextResponse.json({
            message: "Failed to create user",
            error: error
        })
    }
}

