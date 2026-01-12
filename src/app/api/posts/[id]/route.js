import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from 'zod';
import { headers } from "next/headers";




export async function DELETE(req, { params }) {
    try {
        const { postId } = await params;
        const userId = req.headers.get('x-user-id');
        const userRole = req.headers.get('x-user-role');

        // אם אדמין - מחק לפי ID. אם משתמש - מחק רק אם ה-authorId הוא שלו.
        const filter = userRole === 'ADMIN' ? { id: postId } : { id: postId, authorId: userId };

        const deleted = await prisma.post.deleteMany({ where: filter });

        if (deleted.count === 0) {
            return NextResponse.json({ message: "לא נמצא פוסט או שאין הרשאה" }, { status: 403 });
        }

        return NextResponse.json({ message: "נמחק בהצלחה" });
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}




export async function PATCH(req, { params }) {
    try {
        const { postId } = await params;
        const userId = req.headers.get('x-user-id');
        const userRole = req.headers.get('x-user-role');
        const { title, content } = await req.json();

        const filter = userRole === 'ADMIN' ? { id: postId } : { id: postId, authorId: userId };

        const updated = await prisma.post.updateMany({
            where: filter,
            data: { title, content }
        });

        if (updated.count === 0) {
            return NextResponse.json({ message: "לא נמצא פוסט לעדכון או שאין הרשאה" }, { status: 403 });
        }

        return NextResponse.json({ message: "עודכן בהצלחה" });
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}