import { NextResponse } from "next/server"; 
import prisma from "@/lib/prisma";
import {z} from 'zod' ;
import bcrypt from 'bcrypt' ;

const schemaLogin = z.object({
    email:z.string().email('אימייל שגוי').trim() ,
    password:z.string().min(8)  
})




