import { NextResponse } from "next/server"; // ייבוא כלי התגובות של Next.js לשליחת תשובה ללקוח
import prisma from "@/lib/prisma"; // ייבוא החיבור למסד הנתונים Prisma
import { z } from 'zod'; // ייבוא ספריית Zod לאימות נתונים (Validation)
import bcrypt from 'bcrypt'; // ייבוא ספריית bcrypt להשוואת סיסמאות מוצפנות

// הגדרת "סכימה" - חוקים שבודקים שהאימייל תקין והסיסמה באורך המתאים
const schemaLogin = z.object({
    email: z.string().email('אימייל שגוי').trim(), // חייב להיות מחרוזת, בפורמט אימייל, ולהסיר רווחים מיותרים
    password: z.string().min(8) // הסיסמה חייבת להיות מחרוזת באורך של 8 תווים לפחות
});

// פונקציה אסינכרונית לטיפול בבקשות מסוג POST
export async function POST(_req) {
    try {
        const body = await _req.json(); // המרת גוף הבקשה (body) מפורמט JSON לאובייקט JS שניתן לעבוד איתו
        const validation = schemaLogin.safeParse(body); // בדיקה האם הנתונים שנשלחו (אימייל וסיסמה) עומדים בחוקים של Zod

        // אם הוולידציה נכשלה (למשל אימייל לא תקין)
        if (!validation.success) {
            // החזרת שגיאה 400 עם פירוט השדות הלא תקינים
            return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 });
        }

        const { email, password } = validation.data; // חילוץ האימייל והסיסמה שעברו אימות מהאובייקט של Zod

        // חיפוש המשתמש במסד הנתונים לפי האימייל שלו
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // אם המשתמש לא נמצא במסד הנתונים
        if (!user) {
            console.log({ message: 'wrong email or password 222', status: 401 }); // הדפסת לוג לשרת
            
            // החזרת תשובה ללקוח שהפרטים שגויים עם סטטוס 401 (לא מורשה)
            return NextResponse.json(
                { message: 'אימייל או סיסמה שגוים 222', status: 401 }
            );
        }

        // השוואה בין הסיסמה שהמשתמש הזין לסיסמה המוצפנת (Hash) ששמורה במסד הנתונים
        const comparePass = await bcrypt.compare(password, user.password);

        // אם הסיסמאות לא תואמות
        if (!comparePass) {
            console.log({ message: 'wrong email or password 22', status: 401 }); // הדפסת לוג לשרת
            
            // החזרת תשובה ללקוח שהפרטים שגויים עם סטטוס 401
            return NextResponse.json(
                { message: 'אימייל או סיסמה שגוים 22', status: 401 }
            );
        }

        // יצירת אובייקט תגובה במקרה של הצלחה
        const response = NextResponse.json(
            {
                message: 'success Login ready get token', // הודעה שההתחברות הצליחה
                status: 200
            }
        );

        return response; // שליחת התגובה הסופית ללקוח

    } catch (error) {
        // במקרה של תקלה לא צפויה בקוד או בחיבור למסד הנתונים
        console.log({ message: 'there was error with server', status: 500 }); // לוג לשרת

        // החזרת שגיאה כללית ללקוח עם סטטוס 500 (שגיאת שרת)
        return NextResponse.json(
            { message: 'internal server error', status: 500 }
        );
    }
}