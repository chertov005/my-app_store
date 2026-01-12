import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from 'zod';

// 1. הסכימה (Schema) מוגדרת פעם אחת למעלה
const productsSchema = z.object({
    name: z.string().min(2, "שם קצר מדי").max(100),
    description: z.string().min(5, "תיאור קצר מדי").max(200),
    price: z.preprocess(
        (val) => Number(val),
        z.number({ required_error: "חובה להזין מחיר" }).positive("המחיר חייב להיות גדול מ-0")
    ),
    image: z.string().url("קישור לא תקין").optional().or(z.literal('')),
    categoryId: z.string().cuid("מזהה קטגוריה לא תקין").optional(),
});

// 2. פונקציית ה-GET (בלי אימפורטים לפניה!)
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("categoryId");
        const filter = categoryId ? { categoryId } : {};

        const products = await prisma.product.findMany({
            where: filter,
            include: { category: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching products" }, { status: 500 });
    }
}

// 3. פונקציית ה-POST
export async function POST(req) {
    try {
        const body = await req.json(); 
        const validation = productsSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(validation.error.flatten().fieldErrors, { status: 400 });
        }

        const { price, name, description, image, categoryId } = validation.data;

        const newProduct = await prisma.product.create({
            data: { name, description, price, image, categoryId }
        });

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error 500' }, { status: 500 });
    }
}