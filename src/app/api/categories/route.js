import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {z} from 'zod'

const categorySchema = z.object({

    name:z.string() .min(2) .max(200) .trim( ) 

})





export async function POST (_req) {

    try {

        const body = await _req.json()

        const validation = categorySchema.safeParse(body)
        
        if(!validation.success) {
            return NextResponse.json(validation.error.flatten() .fieldErrors , {status:400})
        }
        
    } catch (error) {

    console.log('internal server error 500')

    return NextResponse.json(
        {
            message:"שגיאת שרת פנימית "
        } ,
        {status:500}
    )

    }

}