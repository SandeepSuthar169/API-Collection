import z from "zod";

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: Date;
}
// For Todo Schema get ALL Todos
export const getTodosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// For Todo Id Schema get Todo by Id 
export const todoParamsSchema = z.object({
    id: z.coerce.number().int().positive().max(2_147_483_647)
})

