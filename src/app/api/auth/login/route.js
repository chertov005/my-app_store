import { NextResponse } from "next/server"; 
import prisma from "@/lib/prisma";
import {z} from 'zod' ;
import bcrypt from 'bcrypt' ;

const schemaLogin = z.object({
    email:z.string().email('אימייל שגוי').trim() ,
    password:z.string().min(8)  
}) ;




export async function POST (_req) {

    try {
        const body = await _req.json()
        const validation = schemaLogin.safeParse(body)

        if(!validation.success) {
            return NextResponse.json(validation.error.flatten().fieldErrors ,{status:400})
        }

        const {email,password} =validation.data

        const user = await prisma.user.findUnique({
            where:{email}
        })

        if(!user) {
            console.log(
                {
                    message:'wrong email or password 222' ,
                    status:401
                } 
            )

                  return NextResponse.json(
            {
                message:'אימייל או סיסמה שגוים 222' ,
                status:401
            }
        )

            
        }

        const comparePass =await bcrypt.compare(password ,user.password) 

        if(!comparePass) {

                  console.log(
                {
                    message:'wrong email or password 22'  ,
                    status:401
                } 
            )

                  return NextResponse.json(
            {
                message:'אימייל או סיסמה שגוים 22' ,
                status:401
            }
        )

        }


        const response = NextResponse.json(
            {
                message:'success Login ready get token  ' ,
                status:200
            }
        )

        return response

        
        
    } catch (error) {
         console.log(
            {
                message:'there was error with server' ,
                status:500
            }
        )

        return NextResponse.json(
            {
                message:'internal server error' ,
                status:500
            }
        )
    }

}




