import pool from "@/db/pool";
import logger from "@/logger/winston.logger";
import type { Request, Response } from "express";
import { AppError } from "@/utiles/error.utiles";
import { asyncHandler } from "@/middlewares/asyncHandler.middleware";
import { createTodoBodySchema, getTodosQuerySchema, todoParamsSchema, toggleTodoBodySchema, updateTodoBodySchema, type Todo } from "@/validation/app/todos";

export const getAllTodos = asyncHandler(async (req: Request, res: Response) => {
  try {
      const parsed = getTodosQuerySchema.safeParse(req.query);

      if (!parsed.success) throw new AppError("Invalid pagination parameters", 400);

      const { page, limit } = parsed.data;
      const offset = (page - 1) * limit;

      const [todosResult, countResult] = await Promise.all([
        pool.query<Todo>(
          `SELECT 
                id,
                title,
                description, 
                "isComplete", 
                "createdAt"
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

    } catch (error) {
      
      console.error(error);
      throw new AppError("Internal Server Error", 500)
    }
    }
);

export const getTodoById = asyncHandler (async (req: Request, res: Response)=> {
  try {
    const parsed = todoParamsSchema.safeParse(req.params)

    if(!parsed.success) throw new AppError("Invalid todo Id", 400)

    const { id }  = parsed.data
  
    const result = await pool.query<Todo>(
        `SELECT 
              id,
              title,
              description, 
              "isComplete", 
              "createdAt"
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
      data: result.rows[0],  
    })
  } catch (error) {
    console.error(error);
    throw new AppError("Internal server Error", 500)
  }
})

export const createTodo = asyncHandler (async (req: Request, res: Response) => {
  try {
        const parsed = createTodoBodySchema.safeParse(req.body);

        if (!parsed.success) {
          throw new AppError(
            parsed.error.issues[0]?.message ?? "Invalid request body",
              400
            );
          }

        const { title, description, isComplete } = parsed.data;

        const result = await pool.query<Todo>(
          `INSERT INTO todos (
              title,
              description,
              "isComplete"
          )
          VALUES ($1, $2, $3)
          RETURNING
              id,
              title,
              description,
              "isComplete",
              "createdAt"`,
          [
            title,
            description ?? null,
            isComplete
          ]);

        logger.info("Todo created", { todoId: result.rows[0]?.id });

        res.status(201).json({
          success: true,
          message: "Todo created successfully",
          data: result.rows[0]
        });

    } catch (error) {
      console.error(error);
      throw new AppError("Internal server Error", 500)
    }
})

export const updateTodo = asyncHandler (async (req: Request, res: Response) => {
  // try {
  
    const parsedId = todoParamsSchema.safeParse(req.params);
    const parsedBody = updateTodoBodySchema.safeParse(req.body);

    if (!parsedId.success) throw new AppError(parsedId.error.issues[0]?.message ?? "Invalid Todo Id", 400);
    if (!parsedBody.success) throw new AppError(parsedBody.error.issues[0]?.message ?? "Invalid request body", 400);

    const { id } = parsedId.data;
 
    const { title, description, isComplete } = parsedBody.data ?? {};

    const existingTodo = await pool.query<Todo>(`
      SELECT 
          id,
          title,
          description,
          "isComplete"
      FROM todos
      WHERE id = $1`, [id]
    )
      const currentTodo = existingTodo.rows[0]

      if(!currentTodo) throw new AppError("Todo not Found", 400)


      const updateTitle = title !== undefined ? title.trim() : currentTodo?.title;
      if(!updateTitle || updateTitle.trim().length === 0) throw new AppError("Title cannot be empty", 400)

      const upateDescription = description !== undefined ? description?.trim() || null : currentTodo?.description;

      const updateIsCompletd = isComplete ?? currentTodo?.isComplete;


      const updateResult = await pool.query<Todo>(
        `UPDATE todos
        SET
          title = $1,
          description = $2,
          "isComplete" = $3
        WHERE id = $4
        RETURNING id, title, description, "isComplete"`,
        [
          updateTitle,
          upateDescription,
          updateIsCompletd,
          id
        ]
      );


      logger.info("Todo Updated", { todoId: updateResult.rows[0]?.id })

      res.status(200).json({
        success: true,
        message: "Todo update successfully",
        data: updateResult.rows[0]
      })


    // } catch (error) {
    //   console.error(error);
    //   throw new AppError("Internal Server Error", 500)
    // }
})

export const deleteTodo = asyncHandler (async (req: Request, res: Response) => {
  try {
    const paraed = todoParamsSchema.safeParse(req.params)

    if(!paraed.success) throw new AppError("Invalid todo Id", 400)

    const { id } = paraed.data;

    const result = await pool.query<Todo>(`
      DELETE FROM todos
      WHERE id = $1
      `, [id])

    if(!result) throw new AppError("Todo not found!", 400);

    res.status(200).json({
      message: "Todo deleted successfully",
      success: true,
    })
  } catch (error) {
    console.error(error);
    throw new AppError("Internal Server Error", 500)
  }
})

export const toggleTodo = asyncHandler (async (req: Request, res: Response) => {
  try {
    const paraedId = todoParamsSchema.safeParse(req.params)
    const parsedBody = toggleTodoBodySchema.safeParse(req.body)

    if(!paraedId.success) throw new AppError("Invalid Todo Id", 400);
    if(!parsedBody.success) throw new AppError("Invalid request body", 400);

    const { id } = paraedId.data;
    const { isComplete } = parsedBody.data ?? {};

    const result = await pool.query<Pick<Todo, "id" | "title" | "description" | "isComplete">>(
        `UPDATE todos
        SET "isComplete" = COALESCE($1::boolean, NOT "isComplete")
        WHERE id = $2
        RETURNING id, title, description, "isComplete"`,
        [isComplete, id]
      );

    if (!result) throw new AppError("Todo not found", 404);

    logger.info("Todo updated", { todoId: result.rows[0]?.id });
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error(error);
    throw new AppError("Internal Server Error", 500)
  }
})