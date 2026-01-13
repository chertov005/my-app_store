import { NextResponse } from "next/server";
import {z} from 'zod' ;
import prisma from "@/lib/prisma";

const productsSchema = z.object({
    name: z.string().min(2) .max(100) ,
    description: z.string().min(5).max(200) ,
    price: z.preprocess(
    (val) => Number(val), // הופך את הקלט למספר (גם אם הגיע כ-"29.90")
    z.number({
      required_error: "חובה להזין מחיר",
      invalid_type_error: "המחיר חייב להיות מספר",
    })
    .positive("המחיר חייב להיות גדול מ-0") // מוודא שלא יזינו מחיר שלילי
  ),
image: z.string().url().optional().or(z.literal('')),

    categoryId: z.string().cuid("מזהה קטגוריה לא תקין").optional(),

})




// הגדרת פונקציית GET אסינכרונית שמקבלת את אובייקט הבקשה (_req)
export async function GET (_req) {

    try {
        // שליפת הערך של הכותרת 'x-user-id' מהבקשה כדי לזהות את המשתמש
        const userId =  _req.headers.get('x-user-id') 
        
        // בדיקה לוגית: אם לא נשלח מזהה משתמש ב-headers, אנחנו עוצרים את הפעולה
        if(!userId) {
            // הדפסת הודעה ללוג של השרת לצורך ניפוי שגיאות (Debug)
            console.log('access deny , no token')
            // החזרת תשובת שגיאה ללקוח עם סטטוס 401 (לא מורשה)
            return NextResponse.json(
                {
                    message:'אין גישה לעמוד המבוקש , אין טוקן'
                },
                {status:401}
            )
        }

        // שימוש ב-Prisma לשליפת נתונים ממסד הנתונים
        const products = await prisma.product.findMany({
            // פקודת include אומרת ל-Prisma להביא גם את נתוני טבלת הקטגוריה המקושרת
            include:{
                category:true // מחזיר אובייקט שלם של הקטגוריה במקום רק את ה-ID שלה
            },
            // מיון התוצאות כך שהמוצרים החדשים ביותר (לפי תאריך יצירה) יופיעו למעלה
            orderBy:{createdAt:'desc'}
        })

        // החזרת תשובה חיובית (סטטוס 200) עם רשימת המוצרים שמצאנו
        return NextResponse.json(
            {
                message:'success ' , // הודעת טקסט לאישור שהכל עבר בהצלחה
                data:products        // הנתונים עצמם (מערך של מוצרים)
            },
            {status:200}
        )

    } catch (error) {
        // בלוק זה ירוץ רק אם הייתה תקלה בדרך (למשל בעיה בחיבור למסד הנתונים)
        console.log('there was error 500 ')
        // החזרת תשובה כללית ללקוח המציינת שיש שגיאת שרת פנימית
        return NextResponse.json(
            {
                message:'internal server error 500'
            }
        )
    }
}





export async function POST (_req) {

    try {
        
        const body = await _req.json() ;

        // שליפת הערך של הכותרת 'x-user-id' מהבקשה כדי לזהות את המשתמש
        const userId =  _req.headers.get('x-user-id') 
        
        // בדיקה לוגית: אם לא נשלח מזהה משתמש ב-headers, אנחנו עוצרים את הפעולה
        if(!userId) {
            // הדפסת הודעה ללוג של השרת לצורך ניפוי שגיאות (Debug)
            console.log('access deny , no token')
            // החזרת תשובת שגיאה ללקוח עם סטטוס 401 (לא מורשה)
            return NextResponse.json(
                {
                    message:'אין גישה לעמוד המבוקש , אין טוקן'
                },
                {status:401}
            )
        }
        const validation = productsSchema.safeParse(body) 

        

        if(!validation.success) {

            return NextResponse.json(validation.error.flatten().fieldErrors , {status:400}) 

        }

        const {price,name,description,image,categoryId} = validation.data

        const newProduct = await  prisma.product.create({
            data:{
                name ,
                price,
                image,
                description,
                categoryId
            }
        })

        return NextResponse.json(
            {
                message:'success add product' ,
                data:newProduct
            } ,

            {status:201}
        )


    } catch (error) {
                console.log('there was error 500 ')
        return NextResponse.json(
            {
                message:'internal server error 500'
            }
        )
    }

}