import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'


const schemaLogin = z.object({
    email: z.string().email('אימייל שגוי').trim(),
    password: z.string().min(8)
});




export async function POST(_req) {

    try {

     
     
        const body = await _req.json()
        const validation = schemaLogin.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 })
        }

        const { email, password } = validation.data

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            console.log(
                {
                    message: 'wrong email or password 222',
                    status: 401
                }
            )

            return NextResponse.json(
                {
                    message: 'אימייל או סיסמה שגוים 222',
                    status: 401
                }
            )


        }

        const comparePass = await bcrypt.compare(password, user.password)

        if (!comparePass) {

            console.log(
                {
                    message: 'wrong email or password 22',
                    status: 401
                }
            )

            return NextResponse.json(
                {
                    message: 'אימייל או סיסמה שגוים 22',
                    status: 401
                }
            )

        }


        const response = NextResponse.json(
            {
                message: 'success Login ready get token  ',
                status: 200
            }
        )

        const payload = {
            userId: user.id,
            userRole: user.role,

        }

        const token = await jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn: '29d' })

         response.cookies.set({
            name: 'myToken',
            value: token,
            httpOnly: true, // הגנה מפני XSS: לא מאפשר לקוד JavaScript בדפדפן לגשת לטוקן
            secure: process.env.NODE_ENV === 'production', // הטוקן יישלח רק בחיבור HTTPS מאובטח (בפרודקשן)
            sameSite: 'strict', // הגנה מפני CSRF: העוגייה תישלח רק בבקשות שמגיעות מהאתר שלך
            path: '/', // העוגייה תהיה זמינה בכל נתיבי האתר
            maxAge: 60 * 60 * 24 * 7 // תוקף העוגייה (למשל: שבוע אחד בשניות) // הגדרת העוגייה בצורה המאובטחת ביותר
        })

              return response;



    } catch (error) {
        console.log(
            {
                message: 'there was error with server',
                status: 500
            }
        )

        return NextResponse.json(
            {
                message: 'internal server error',
                status: 500
            }
        )
    }

}








