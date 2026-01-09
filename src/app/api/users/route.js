import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";





export async function GET () {

    try {

        const users = await prisma.user.findMany({
            select:{
                name:true ,
                email:true ,
                role:true
            }
        })

        return NextResponse.json(
            {
                message:'success ' ,
                data:users 
            }
            ,
            {
                status:200
            }
        )
        
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