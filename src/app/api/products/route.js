import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from 'zod';

// הגדרת סכמת הולידציה למוצר
const productsSchema = z.object({
    name: z.string().min(2, "שם קצר מדי").max(100),
    description: z.string().min(5, "תיאור קצר מדי").max(200),
    price: z.preprocess(
        (val) => Number(val), // הופך את הקלט למספר במידה והגיע כטקסט
        z.number({ required_error: "חובה להזין מחיר" })
         .positive("המחיר חייב להיות גדול מ-0")
    ),
    image: z.string().url("קישור תמונה לא תקין").optional().or(z.literal('')),
    // שימוש ב-cuid כי זה מה שהגדרת ב-Schema של Prisma
    categoryId: z.string().cuid("מזהה קטגוריה לא תקין").optional(),
});




export async function GET(req) {
    try {
        // שליפת כתובת ה-URL כדי להוציא ממנה פרמטרים (Query Params)
        const { searchParams } = new URL(req.url);
        
        // בדיקה האם המשתמש שלח מזהה קטגוריה בכתובת (למשל: ?categoryId=123)
        const categoryId = searchParams.get("categoryId");

        // בניית תנאי החיפוש: אם יש categoryId, נסנן לפיו. אם לא, נביא הכל {}.
        const filter = categoryId ? { categoryId: categoryId } : {};

        // ביצוע השאילתה מול Prisma
        const products = await prisma.product.findMany({
            where: filter, // החלת הסינון
            include: {
                category: { // שליפת שם הקטגוריה כדי שנוכל להציג "אלקטרוניקה" במקום רק ID
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' } // הצגת המוצרים החדשים ביותר ראשונים
        });

        // החזרת רשימת המוצרים
        return NextResponse.json(products);
        
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ message: "שגיאה בשליפת מוצרים" }, { status: 500 });
    }
}













export async function POST(req) {
    try {
        // חילוץ גוף הבקשה
        const body = await req.json(); 
        
        // הרצת בדיקת הולידציה של Zod
        const validation = productsSchema.safeParse(body);

        // אם הולידציה נכשלה, החזרת שגיאות מפורטות למשתמש
        if (!validation.success) {
            return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 });
        }

        // חילוץ הנתונים המאומתים
        const { price, name, description, image, categoryId } = validation.data;

        // יצירת המוצר בבסיס הנתונים באמצעות Prisma
        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                price,
                image,
                categoryId // קישור לקטגוריה (יכול להיות null אם הגדרת אופציונלי ב-Sche7ma)
            }
        });

        // החזרת המוצר שנוצר עם סטטוס 201 (Created)
        return NextResponse.json(newProduct, { status: 201 });

    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ message: 'internal server error 500' }, { status: 500 });
    }
}