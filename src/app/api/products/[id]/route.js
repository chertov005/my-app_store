import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req, { params }) {
    try {
        // חילוץ ה-ID מהנתיב הדינמי (חשוב להשתמש ב-await ב-Next.js 15)
        const { id } = await params;

        // שליפת התפקיד מה-Headers (שהגיע מה-Middleware שלך) כדי לוודא שזה אדמין
        const userRole = req.headers.get('x-user-role');

        // אבטחה: רק אדמין יכול למחוק מוצרים מהחנות
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ message: "אין לך הרשאה לבצע פעולה זו" }, { status: 403 });
        }

        // ביצוע המחיקה ב-Prisma
        await prisma.product.delete({
            where: { id: id }
        });

        // החזרת הודעת הצלחה
        return NextResponse.json({ message: "המוצר נמחק בהצלחה מהמערכת" });

    } catch (error) {
        // טיפול במקרה שהמוצר לא נמצא או שיש תקלה אחרת
        console.error("Error deleting product:", error);
        return NextResponse.json({ message: "לא ניתן למחוק את המוצר (אולי הוא כבר נמחק?)" }, { status: 500 });
    }
}





export async function PATCH(req, { params }) {
    try {
        // חילוץ ה-ID של המוצר מהכתובת (URL)
        const { id } = await params;

        // בדיקת תפקיד המשתמש מה-Headers כדי לוודא שרק אדמין עורך מוצרים
        const userRole = req.headers.get('x-user-role');

        // אבטחה: אם המשתמש הוא לא אדמין, החזרת שגיאת חוסר הרשאה
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ message: "אין לך הרשאה לערוך מוצרים" }, { status: 403 });
        }

        // קבלת הנתונים החדשים מה-Body של הבקשה (שם, מחיר, תיאור וכו')
        const body = await req.json();

        // עדכון המוצר בבסיס הנתונים
        const updatedProduct = await prisma.product.update({
            where: { id: id }, // זיהוי המוצר הספציפי לפי ה-ID
            data: {
                // אנחנו מעבירים את ה-body. פריזמה תעדכן רק את השדות ששלחנו
                ...body, 
                // במידה והמחיר נשלח, כדאי לוודא שהוא נשמר כמספר
                price: body.price ? parseFloat(body.price) : undefined
            }
        });

        // החזרת המוצר המעודכן לצד הלקוח
        return NextResponse.json({
            message: "המוצר עודכן בהצלחה",
            data: updatedProduct
        });

    } catch (error) {
        // טיפול בשגיאה (למשל אם ה-ID לא קיים בדאטה-בייס)
        console.error("Error updating product:", error);
        return NextResponse.json(
            { message: "שגיאה בעדכון המוצר, וודא שכל השדות תקינים" }, 
            { status: 500 }
        );
    }
}