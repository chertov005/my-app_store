import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from 'zod';
import { headers } from "next/headers";

const postSchema = z.object({
    title: z.string().min(5, "כותרת חייבת להיות לפחות 5 תווים").max(200).trim(),
    content: z.string().min(10, "תוכן חייב להכיל לפחות 10 תווים").max(400)
});






export async function GET () {

try {

    const headerList = await headers()
    const userId = headerList.get('x-user-id')
    const userRole = headerList.get('x-user-role')

    if(!userId ) {

    return NextResponse.json({ message: 'משתמש לא מזוהה' }, { status: 401 });

    }

    const filter  = userRole =='ADMIN' ? {} : {authorId:userId}

    
} catch (error) {
          console.error('Post creation error:', error);

        return NextResponse.json(
            { message: 'שגיאת שרת פנימית' },
            { status: 500 }
        );
}


}




export async function POST(_req) {
    try {
        const body = await _req.json();
        const headerList = await headers();
        const userId = headerList.get('x-user-id');

        // בדיקת בטיחות: אם ה-userId חסר מסיבה כלשהי
        if (!userId) {
            return NextResponse.json({ message: 'משתמש לא מזוהה' }, { status: 401 });
        }

        const validation = postSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 });
        }

        const { content, title } = validation.data;

        const NewPost = await prisma.post.create({
            data: {
                title,
                content,
                authorId: userId // מקשר לטבלת User דרך ה-ID
            }
        });

        return NextResponse.json(
            {
                message: 'הפוסט פורסם בהצלחה',
                data: NewPost // כדאי להחזיר את הפוסט שנוצר
            },
            { status: 201 } // סטטוס יצירה מוצלח
        );

    } catch (error) {
        console.error('Post creation error:', error);

        return NextResponse.json(
            { message: 'שגיאת שרת פנימית' },
            { status: 500 }
        );
    }
}