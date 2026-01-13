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
    image: z.url( ).optional()
    .or(z.literal('')) ,

    categoryId: z.string().cuid("מזהה קטגוריה לא תקין").optional(),

})




export async function GET () {

    try {

        const products = await prisma.product.findMany({})

        return NextResponse.json(
            {
                message:'success ' ,
                data:products
            } ,

            {
                status:200
            }
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






export async function POST (_req) {

    try {
        
        const body = await _req.json() ;
        const validation = productsSchema.safeParse(body) 

        if(!validation.success) {

            return NextResponse.json(validation.error.flatten().fieldErrors , {status:400}) 

        }

        const {price,name,description,image,categoryId} = validation.data



    } catch (error) {
                console.log('there was error 500 ')
        return NextResponse.json(
            {
                message:'internal server error 500'
            }
        )
    }

}