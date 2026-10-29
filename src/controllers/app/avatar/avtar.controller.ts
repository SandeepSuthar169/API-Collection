import pool from "@/db/pool";
import logger from "@/logger/winston.logger";
import cloudinary from "@/config/cloudinary";
import type { Request, Response } from "express";
import { AppError } from "@/utiles/error.utiles";
import type { UploadApiResponse } from "cloudinary";
import { asyncHandler } from "@/middlewares/asyncHandler.middleware";
import { uploadedImage } from "@/middlewares/uploadImage.middleware";
import { createAvatarBodySchema, type Avatar } from "@/validation/app/avatars/avatara.validation";


export const createAvatars = asyncHandler (async (req: Request, res: Response) => {
    // try {
        // validation body
        console.log(req.body);
        
        const parsed = createAvatarBodySchema.safeParse(req.body);

        if(!parsed.success) throw new AppError("Invalid request body", 400)

        const { categories, image, image_name } = parsed.data

        let uploaded: UploadApiResponse;
        
        //Upload image to cloudinary 
        try {
            uploaded = await cloudinary.uploader.upload(image, 
                {
                    folder: `avatars/${categories.toLowerCase()}`,
                    resource_type: "image",            
                }
            )
        } catch (error) {
            logger.error(
                `Cloudinary upload failed: ${
                error instanceof Error ? error.message : String(error)}`
            );
            throw new AppError("Failed to upload avatar image", 502)
        }

        const result = await pool.query<Avatar>(`
            INSERT INTO avatars (
                image,
                image_name,
                categories
            )
            VALUES ($1, $2, $3)
            RETURNING 
                    id,
                    image,
                    image_name,
                    categories,
                    "createdAt"`, 
                    [
                        uploaded.secure_url, 
                        image_name, 
                        categories
                    ]
            )

        logger.info(`Avatar created: id=${result.rows[0]?.id}, category=${categories}`);

        res.status(200).json({
            success: true,
            message: "Avatar created successfully",
            data: result.rows[0],
        })

    // } catch (error) {
    //     console.error(error);
    //     throw new AppError("Internal server error", 500)
    // }
})