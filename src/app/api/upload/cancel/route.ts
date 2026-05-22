import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";

export const POST = async (req: NextRequest) => {
    try {

        const { uploadId } = await req.json()

        await fs.rm(`upload/${uploadId}`, {
            recursive: true,
            force: true,
        });
        return NextResponse.json({
            message: "Cancel Upload Succeeeded", status: 200,
            success: true,
        });
    } catch (error) {
        return NextResponse.json({
            message: "Cancel Upload Failed",
            status: 500,
            success: false,
        });
    }
};

