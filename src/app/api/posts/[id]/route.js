import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from 'zod';
import { headers } from "next/headers";


export async function DELETE(req, { params }) {
    try {
        // שליפת ה-ID של הפוסט מהנתיב (ממתינים ל-params כי ב-Next.js 15 הם מגיעים כ-Promise)
        const { id } = await params;
        
        // שליפת ה-ID והתפקיד של המשתמש מה-Headers (הוזרקו ע"י ה-Middleware)
        const userId = req.headers.get('x-user-id');
        const userRole = req.headers.get('x-user-role');

        /**
         * קביעת פילטר המחיקה:
         * אם המשתמש ADMIN - הוא יכול למחוק לפי ה-ID של הפוסט בלבד.
         * אם המשתמש רגיל - הוא יכול למחוק רק פוסט שמתאים ל-ID המבוקש וגם שייך לו (authorId).
         */
        const filter = userRole === 'ADMIN' ? { id: id } : { id: id, authorId: userId };

        // ביצוע המחיקה. משתמשים ב-deleteMany כי delete רגיל בפריזמה עובד רק עם מפתח ייחודי (ID) ללא תנאים נוספים.
        const deleted = await prisma.post.deleteMany({ where: filter });

        // אם לא נמחק כלום (count הוא 0), זה אומר שהפוסט לא קיים או שאין למשתמש הרשאה למחוק אותו.
        if (deleted.count === 0) {
            return NextResponse.json({ message: "לא נמצא פוסט או שאין הרשאה" }, { status: 403 });
        }

        // הצלחה - הפוסט נמחק
        return NextResponse.json({ message: "נמחק בהצלחה" });
        
    } catch (error) {
        // טיפול בשגיאת שרת כללית
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}












export async function PATCH(req, { params }) {
    try {
        // קבלת מזהה הפוסט מהכתובת
        const { id } = await params;
        
        // שליפת פרטי המשתמש הנוכחי מה-Headers
        const userId = req.headers.get('x-user-id');
        const userRole = req.headers.get('x-user-role');
        
        // קבלת הנתונים החדשים (כותרת ותוכן) מגוף הבקשה (JSON)
        const { title, content } = await req.json();

        /**
         * קביעת פילטר העדכון:
         * בדומה למחיקה, אנו מוודאים שאם המשתמש אינו ADMIN, הוא יוכל לעדכן רק את הפוסטים של עצמו.
         */
        const filter = userRole === 'ADMIN' ? { id: id } : { id: id, authorId: userId };

        // עדכון הנתונים. updateMany מחזיר אובייקט עם כמות השורות שהושפעו מהשינוי.
        const updated = await prisma.post.updateMany({
            where: filter,
            data: { title, content }
        });

        // אם כמות העדכונים היא 0, סימן שהמשתמש ניסה לעדכן פוסט שלא שלו (או שהפוסט לא קיים).
        if (updated.count === 0) {
            return NextResponse.json({ message: "לא נמצא פוסט לעדכון או שאין הרשאה" }, { status: 403 });
        }

        // הצלחה - הנתונים עודכנו
        return NextResponse.json({ message: "עודכן בהצלחה" });
        
    } catch (error) {
        // טיפול בשגיאת שרת
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}