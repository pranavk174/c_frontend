import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";

export const POST = async (req: NextRequest) => {
    try {
        const uploadId = crypto.randomUUID();
        await fs.mkdir(`upload/${uploadId}`, { recursive: true });

        return NextResponse.json({
            message: "upload started",
            status: 201,
            success: true,
            uploadId, chunkSize: 1024 * 1024
        });
    } catch (error) {
        return NextResponse.json({
            message: "Some thing went wrong in uploading chunk",
            status: 500,
            success: false,
        });
    }
};

