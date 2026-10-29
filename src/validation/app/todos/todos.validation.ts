import z from "zod";

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  isComplete: boolean;
  createdAt: Date;
}
// For Todo Schema get ALL Todos --------------------------------
export const getTodosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// For Todo Id Schema get Todo by Id --------------------------------
export const todoParamsSchema = z.object({
  id: z.string().uuid("Invalid todo id"),
});

// For Todo Schema Crete Todo Body --------------------------------
export const createTodoBodySchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
  description: z.string().min(1).nullish(),
  isComplete: z.boolean().default(false),
})

export type CreteTodoInput = z.infer<typeof createTodoBodySchema>

// For Todo Schema Update Todo Body --------------------------------
export const updateTodoBodySchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().min(1).nullish(),
    isComplete: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});

export type UpdateTodoInput = z.infer<typeof updateTodoBodySchema>

// For Todo Schema Toggle Todo --------------------------------
export const toggleTodoBodySchema = z.object({
    isComplete: z.boolean(),
})

export type toggleTodoInput = z.infer<typeof toggleTodoBodySchema> 