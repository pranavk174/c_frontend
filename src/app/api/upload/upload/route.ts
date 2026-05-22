import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";

export const POST = async (req: NextRequest) => {
    try {
        const form = await req.formData();

        const uploadId = form.get("uploadId") as string;
        const index = form.get("index") as string;
        const chunk = form.get("chunk") as File;
        const buffer = Buffer.from(await chunk.arrayBuffer());

        await fs.writeFile(`upload/${uploadId + "/" + index}`, buffer);

        return NextResponse.json({
            message: "upload successfull",
            status: 201,
            success: true,
        });
    } catch (error) {
        return NextResponse.json({
            message: "upload failed",
            status: 500,
            success: false,
        });
    }
};