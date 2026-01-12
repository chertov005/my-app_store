import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from 'zod';

// סכמה לקטגוריה
const categorySchema = z.object({
    name: z.string().min(2, "שם קטגוריה חייב להיות לפחות 2 תווים").max(50)
});

export async function POST(req) {
    try {
        const body = await req.json();
        const validation = categorySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 });
        }

        const {name} =validation.data

        // יצירת הקטגוריה
        const newCategory = await prisma.category.create({
            data: { name }
        });

        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        // טיפול במקרה של שם קטגוריה כפול (כי הגדרת unique ב-Schema)
        if (error.code === 'P2002') {
            return NextResponse.json({ name: ["קטגוריה זו כבר קיימת"] }, { status: 400 });
        }
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}










