import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name:
        process.env.CLOUDINARY_NAME,
    api_key:
        process.env.CLOUDINARY_API_KEY,
    api_secret:
        process.env.CLOUDINARY_API_SECRET,
});

export const POST = async (
    req: NextRequest
) => {
    let finalPath = "";

    try {
        const {
            uploadId,
            extension,
        } = await req.json();

        const folderPath = path.join(
            process.cwd(),
            "upload",
            uploadId
        );

        // =========================
        // GET ALL CHUNKS
        // =========================

        const parts =
            await fs.readdir(folderPath);

        const sortedParts = parts.sort(
            (a, b) =>
                Number(a) - Number(b)
        );

        // =========================
        // FINAL FILE PATH
        // =========================

        finalPath = path.join(
            process.cwd(),
            "upload",
            `${uploadId}-${Date.now()}.${extension}`
        );

        // =========================
        // CREATE WRITE STREAM
        // =========================

        const writeStream =
            fsSync.createWriteStream(
                finalPath
            );

        // Prevent MaxListenersExceededWarning when merging many chunks
        writeStream.setMaxListeners(
            sortedParts.length + 5
        );

        // =========================
        // MERGE CHUNKS
        // =========================
        // eslint-disable-next-line no-await-in-loop
        for (const part of sortedParts) {
            const chunkPath = path.join(
                folderPath,
                part
            );

            await new Promise<void>(
                (
                    resolve,
                    reject
                ) => {
                    const readStream =
                        fsSync.createReadStream(
                            chunkPath
                        );

                    const handleError = (
                        error: Error
                    ) => {
                        readStream.destroy();
                        reject(error);
                    };

                    readStream.once(
                        "error",
                        handleError
                    );

                    writeStream.once(
                        "error",
                        handleError
                    );

                    readStream.once(
                        "end",
                        () => {
                            resolve();
                        }
                    );

                    readStream.pipe(
                        writeStream,
                        {
                            end: false,
                        }
                    );
                }
            );
        }

        // =========================
        // CLOSE WRITE STREAM
        // =========================

        writeStream.end();

        await new Promise<void>(
            (
                resolve,
                reject
            ) => {
                writeStream.once(
                    "finish",
                    () => {
                        resolve();
                    }
                );

                writeStream.once(
                    "error",
                    reject
                );
            }
        );

        // =========================
        // UPLOAD TO CLOUDINARY
        // =========================

        const cloudinaryResult =
            await cloudinary.uploader.upload(
                finalPath,
                {
                    folder: "uploads",
                    resource_type: "auto",
                    chunk_size: 6000000000000,
                }
            );

        // =========================
        // CLEANUP
        // =========================

        await fs.rm(folderPath, {
            recursive: true,
            force: true,
        });

        await fs.unlink(finalPath);

        return NextResponse.json({
            message:
                "Successfully uploaded",
            success: true,
            status: 201,
            data: cloudinaryResult,
        });
    } catch (error) {
        console.log(
            error,
            "UPLOAD_ERROR"
        );

        // cleanup final file if exists
        if (
            finalPath &&
            fsSync.existsSync(
                finalPath
            )
        ) {
            await fs.unlink(
                finalPath
            );
        }

        return NextResponse.json({
            message:
                "Upload failed",
            success: false,
            status: 500,
            error: error.message
        });
    }
};