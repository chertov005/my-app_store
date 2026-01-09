import { NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import prisma from "@/lib/prisma";
import { z} from 'zod' ;

const userSchema = z.object({
 // שדה שם: חייב להיות מחרוזת, לפחות 2 תווים, ומנקה רווחים מיותרים מהצדדים
  name: z.string()
    .min(2, 'מינימום 2 תוים') // ולידציה של אורך מינימלי עם הודעת שגיאה מותאמת
    .trim(), // הסרת רווחים לבנים (Whitespace) מתחילת וסוף המחרוזת

  // שדה אימייל: ולידציה מובנית לפורמט של כתובת דואר אלקטרוני
  email: z.string()
    .email('אימייל שגוי') // בודק קיום של @, נקודה וסיומת תקינה
    .trim(), // ניקוי רווחים (נפוץ מאוד בהעתקה והדבקה של אימיילים)

  // שדה סיסמה: אורך מינימלי של 8 תווים לטובת אבטחה
  password: z.string()
    .min(8, 'סיסמה חייבת להכיל לפחות 8 תוים'),

  // שדה תמונה: מורכב ממספר תנאים כדי לאפשר גמישות
  image: z.string()
    .url('כתובת התמונה אינה תקינה') // מוודא שהמחרוזת היא URL תקין (http/https)
    .optional() // מאפשר לשדה להיות undefined (לא קיים כלל באובייקט)
    .or(z.literal('')), // מאפשר לשדה להיות מחרוזת ריקה ("") מבלי להיכשל בבדיקת ה-URL
})





export async function POST(_req) {
  try {
    // 1. קבלת הנתונים מגוף הבקשה
    const body = await _req.json();

    // 2. אימות הנתונים מול הסכימה
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      // מחזירים את השגיאות בצורה שטוחה ונוחה לצד הלקוח
      return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 });
    }

    const { email, name, password, image } = validation.data;

    // 3. בדיקה אם האימייל כבר קיים במערכת (Prisma)
    const checkEmail = await prisma.user.findUnique({
      where: { email: email }
    });

    if (checkEmail) {
      return NextResponse.json(
        { message: 'אימייל כבר קיים במערכת' },
        { status: 400 }
      );
    }

    // 4. הצפנת הסיסמה לפני השמירה
    const hashPass = await bcrypt.hash(password, 10);

    // 5. יצירת המשתמש ב-Database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        image,
        password: hashPass
      },
      // הגדרת השדות שיוחזרו ב-Response (בלי הסיסמה!)
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true
      }
    });

    // 6. החזרת תשובת הצלחה
    return NextResponse.json(
      {
        message: 'המשתמש נוצר בהצלחה',
        data: newUser
      },
      { status: 201 }
    );

  } catch (error) {
    // רישום שגיאה בשרת והחזרת הודעה כללית למשתמש
    console.error("Registration Error:", error);
    
    return NextResponse.json(
      { message: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}



