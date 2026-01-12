import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from 'zod';
import { headers } from "next/headers";

const postSchema = z.object({
    title: z.string().min(5, "כותרת חייבת להיות לפחות 5 תווים").max(200).trim(),
    content: z.string().min(10, "תוכן חייב להכיל לפחות 10 תווים").max(400)
});








// הגדרת פונקציית ה-GET של ה-API ב-Next.js
export async function GET(req) {
    try {
        // שליפת ה-ID של המשתמש מה-Headers (הוזרק שם על ידי ה-Middleware)
        const userId = req.headers.get('x-user-id');
        
        // שליפת התפקיד (USER/ADMIN) מה-Headers כדי לדעת אילו הרשאות יש לו
        const userRole = req.headers.get('x-user-role');

        // בדיקה אבטחתית: אם אין מזהה משתמש (הטוקן לא קיים), מחזירים שגיאת "אין גישה"
        if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        /**
         * לוגיקת הסינון (The Filter Logic):
         * אם המשתמש הוא ADMIN - ה-filter יהיה אובייקט ריק {}, מה שיגרום ל-Prisma להביא את כל הפוסטים.
         * אם המשתמש הוא USER - ה-filter יכיל את ה-authorId שלו, וכך הוא יראה רק את הפוסטים שהוא כתב.
         */
        const filter = userRole === 'ADMIN' ? {} : { authorId: userId };

        // ביצוע השאילתה מול בסיס הנתונים (PostgreSQL)
        const posts = await prisma.post.findMany({
            where: filter, // החלת הסינון שקבענו בשורה הקודמת
            include: {
                // "חיבור" טבלת המשתמשים כדי להביא גם את שם הכותב של כל פוסט
                author: { select: { name: true } }
            },
            // מיון הפוסטים כך שהחדשים ביותר יופיעו למעלה
            orderBy: { createdAt: 'desc' }
        });

        // החזרת רשימת הפוסטים לצד הלקוח (Frontend) בפורמט JSON
        return NextResponse.json(posts);
        
    } catch (error) {
        // טיפול במקרה של תקלה בשרת או בחיבור לדאטה-בייס
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
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