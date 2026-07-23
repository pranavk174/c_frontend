import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "@/lib/utils";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = async (req: NextRequest) => {

    try {

        const formData = await req.formData();

        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({
                success: false,
                message: "No file provided",
            });
        }

        // file -> buffer
        const bytes = await file.arrayBuffer();

        const buffer = Buffer.from(bytes);

        // cloudinary upload
        const result: any = await new Promise((resolve, reject) => {

            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "uploads",
                    resource_type: "auto",
                },
                (error, result) => {

                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            stream.end(buffer);
        });

        return NextResponse.json({
            success: true,
            fileUrl: result.secure_url,
            public_id: result.public_id,

            // file object se lo
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
        });

    } catch (error) {

        logger.log(error);

        return NextResponse.json(
            {
                success: false,
                message: "File upload failed",
            },
            {
                status: 500,
            }
        );
    }
};