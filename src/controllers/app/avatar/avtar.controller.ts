import pool from "@/db/pool";
import logger from "@/logger/winston.logger";
import cloudinary from "@/config/cloudinary";
import type { Request, Response } from "express";
import { AppError } from "@/utiles/error.utiles";
import type { UploadApiResponse } from "cloudinary";
import { asyncHandler } from "@/middlewares/asyncHandler.middleware";
import { avatarParamsSchema, createAvatarBodySchema, type Avatar } from "@/validation/app/avatars/avatara.validation";


export const createAvatars = asyncHandler (async (req: Request, res: Response) => {
    try {
        // validation body        
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


        const client = await pool.connect()

        try {
            await client.query("BEGIN")

            await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [categories]);

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
            
            await client.query("COMMIT")

            logger.info(
                `Avatar created: id=${result.rows[0]?.id}, category=${categories}, number=${result.rows[0]?.id}`
            )

            res.status(200).json({
                success: true,
                message: "Avatar created successfully",
                data: result.rows[0],
            })

        } catch (error) {
            await client.query("ROLLBACK");
            logger.error(
                `Avatar insert failed: ${error instanceof Error ? error.message : String(error)}`
            );
        
            throw new AppError("Failed to save avatar", 500);
        }
    } catch (error) {
        console.error(error);
        throw new AppError("Internal server error", 500)
    }
})

export const avatarGetById = asyncHandler (async (req: Request, res: Response) => {
    try {

        const parsed = avatarParamsSchema.safeParse(req.params);

        if (!parsed.success) throw new AppError("Invalid category or number", 400);       
        
        const { category, number } = parsed.data

        const result = await pool.query<Avatar>(`
            SELECT 
                id, 
                image, 
                image_name, 
                categories, 
                "createdAt"
            `, [
                category, number
            ])

    } catch (error) {
        console.error(error);
        
    }
})
