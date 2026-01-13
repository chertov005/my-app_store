import { NextResponse } from "next/server"; // ייבוא כלי התגובה של Next.js לניהול בקשות
import { jwtVerify } from "jose"; // ייבוא פונקציה לאימות JWT מספריית jose (מתאימה ל-Edge Runtime)

export async function middleware(req) {
    // שליפת הטוקן מה-Cookies של הדפדפן תחת השם 'myToken'
    const token = req.cookies.get('myToken')?.value;

    // בדיקה: אם אין טוקן, אין טעם להמשיך בתהליך האימות
    if (!token) {
        console.warn('[Middleware] Access Denied: No token found'); // לוג אזהרה מקצועי
        return NextResponse.json(
            { message: 'Authentication required: No token provided' }, // הודעת שגיאה ברורה למשתמש
            { status: 401 } // סטטוס 401 (Unauthorized) הוא הנכון יותר כאן מאשר 400
        );
    }

    try {
        // וידוא שקיים מפתח סודי במשתני הסביבה (חשוב למניעת קריסות)
        const secret = process.env.TOKEN_KEY;
        if (!secret) throw new Error("TOKEN_KEY is not defined in environment variables");

        // קידוד המפתח הסודי למערך בייטים (נדרש על ידי ספריית jose)
        const encodedKey = new TextEncoder().encode(secret);
        
        // אימות הטוקן ושליפת הנתונים (Payload) מתוכו
        const { payload } = await jwtVerify(token, encodedKey);

        // פירוק הנתונים מתוך ה-Payload (מזהה משתמש ותפקיד)
        const { userId, userRole } = payload;

        // לוג הצלחה מובנה הכולל את ה-Path של הבקשה להקשר נוסף
         console.log('user authorized:' ,{userId,userRole})

        // יצירת אובייקט Headers חדש כדי שנוכל להוסיף לו מידע
        const requestHeaders = new Headers(req.headers);
        
        // הזרקת נתוני המשתמש ל-Headers כדי שה-API/Pages יוכלו להשתמש בהם בקלות
        requestHeaders.set('x-user-id', userId); // מזהה משתמש בפורמט Header תקני
        requestHeaders.set('x-user-role', userRole); // תפקיד המשתמש

        // העברת הבקשה ליעד הבא עם ה-Headers המעודכנים
        return NextResponse.next({
            request: {
                headers: requestHeaders, // הזרקת ה-Headers החדשים לבקשה הממשיכה
            },
        });



        
    } catch (error) {
        // טיפול בשגיאות (טוקן פג תוקף, טוקן מזויף או תקלת שרת)
        console.error('[Middleware Error] JWT Verification failed:', error.message);

        return NextResponse.json(
            { message: 'Invalid or expired token' }, // הודעה מאובטחת (לא חושפים פרטים טכניים)
            { status: 403 } // סטטוס 403 (Forbidden) - הטוקן לא תקין
        );
    }
}

/** * הגדרת 'matcher' כדי שה-Middleware לא ירוץ על קבצים סטטיים (תמונות/CSS)
 * זה משפר את ביצועי האפליקציה משמעותית.
 */
export const config = {
    matcher: [
        
        '/api/users/:path*', '/dashboard/:path*' ,
        '/api/users' ,
        '/api/posts/:path*' ,
        '/api/posts' ,
        '/api/categories',
        '/api/categories/:path*'

    ], // ירוץ רק על נתיבי ה-API והדשבורד
};