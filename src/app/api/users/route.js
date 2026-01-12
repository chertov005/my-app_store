import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";





export async function GET () {

    try {

           const headersList = await headers() ;
        
                const userRole = await headersList.get('x-user-role') ;
        
                if(userRole !== 'ADMIN') {
                    return NextResponse.json(
                        {
                            message:'access deny' 
                        },
                        {status:403}
                    )
                }

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