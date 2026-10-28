import pool from "@/db/pool";
import logger from "@/utiles/logger";
import type { Request, Response } from "express";
import { AppError } from "@/utiles/error.utiles";
import { asyncHandler } from "@/middlewares/asyncHandler.middleware";
import { getTodosQuerySchema, todoParamsSchema, type Todo } from "@/types";

export const getAllTodos = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = getTodosQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError("Invalid pagination parameters", 400);
    }

    const { page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const [todosResult, countResult] = await Promise.all([
      pool.query<Todo>(
        `SELECT 
              id 
              title, 
              description, 
              "is_complete" AS isComplete, 
              "created_at" AS createdAt
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

export const getTodoById = asyncHandler (async (req: Request, res: Response)=> {
  try {
    const parsed = todoParamsSchema.safeParse(req.params)

    if(!parsed.success) throw new AppError("Invalid todo Id", 400)

    const  id  = parsed.data
  

    const result = await pool.query<Todo>(
        `SELECT id 
                title, 
                description, 
                "is_complete" AS isComplete, 
                "created_at" AS createdAt
        FROM todos
        WHERE id = $1
        `, [id]
    )
    const todo = result.rows[0]

    if(!todo) throw new AppError("Todo not found!", 400)

    logger.info("Todo fetched", {todoId: id})

    res.status(200).json({
      success: true,
      message: "Todo fetched successfully",
      data: result.rows,  
    })
  } catch (error) {
    console.error("Internal Server Error", error);
    throw new AppError("Internal server Error", 500)
  }
})