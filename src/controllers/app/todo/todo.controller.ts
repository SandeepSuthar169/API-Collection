import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../middlewares/asyncHandler.middleware";
import pool from "../../../db/pool";
import { AppError } from "../../../utiles/error.utiles";
import logger from "../../../utiles/logger";

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}

const getTodosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const getAllTodos = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = getTodosQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError("Invalid pagination parameters", 400);
    }

    const { page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    // Run both queries in parallel
    const [todosResult, countResult] = await Promise.all([
      pool.query<Todo>(
        `SELECT id, title, description, completed, created_at, updated_at
         FROM todos
         ORDER BY id DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query<{ count: string }>(`SELECT COUNT(*) FROM todos`),
    ]);

    const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

    logger.info("Todos fetched", { page, limit, returned: todosResult.rowCount });

    res.status(200).json({
      success: true,
      message: "Todos fetched successfully",
      data: todosResult.rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: offset + todosResult.rows.length < total,
        hasPrevPage: page > 1,
      },
    });
  }
);