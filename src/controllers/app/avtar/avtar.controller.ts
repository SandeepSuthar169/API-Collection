import pool from "@/db/pool";
import logger from "@/logger/winston.logger";
import type { Request, Response } from "express";
import { AppError } from "@/utiles/error.utiles";
import { asyncHandler } from "@/middlewares/asyncHandler.middleware";
import { createAvatarBodySchema } from "@/validation/app/avataras/avatara.validation";


export const createAvatars = asyncHandler (async (req: Request, res: Response) => {
    try {
        const parsed = createAvatarBodySchema.safeParse(req.body);

        
    } catch (error) {
        console.error(error);
        throw new AppError("Internal server error", 500)
    }
})