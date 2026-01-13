import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {z} from 'zod'

const categorySchema = z.object({

    name:z.string() .min(2) .max(200) .trim( ) 

})





export async function GET () {

try {

    
    
} catch (error) {
      console.error('Category POST Error:', error)
        return NextResponse.json(
            { message: "שגיאת שרת פנימית" },
            { status: 500 }
        )
}


}



export async function POST (_req) {
    try {
        // 1. בדיקת אבטחה - חובה לעצור אם אין משתמש
        const userId = _req.headers.get('x-user-id')
        if(!userId) {
            return NextResponse.json(
                { message: "גישה נדחתה - חסר מזהה משתמש" },
                { status: 401 }
            )
        }

        const body = await _req.json()

        // 2. אימות נתונים מול הסכמה של הקטגוריה
        const validation = categorySchema.safeParse(body)
        if(!validation.success) {
            return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 })
        }

        const { name } = validation.data

        // 3. יצירת הקטגוריה בבסיס הנתונים
        const newCategory = await prisma.category.create({
            data: {
                name,
     
            }
            
        })

        // 4. חובה להחזיר תשובה ללקוח בסיום!
        return NextResponse.json(
            {
                message: "קטגוריה נוצרה בהצלחה",
                data: newCategory
            },
            { status: 201 }
        )
        
    } catch (error) {
        console.error('Category POST Error:', error)
        return NextResponse.json(
            { message: "שגיאת שרת פנימית" },
            { status: 500 }
        )
    }
}