import express from "express";
import  { FWrateLimiter }  from "@/limiter/fixedWindow";
import { SLrateLimiter } from "@/limiter/SlidingWindow";
import {
    getAllTodos,
    getTodoById,
    createTodo,
    deleteTodo,
    toggleTodo,
    upaateTodo
} from "@/controllers/app/todos/todo.controller";

export const FXlimiter = FWrateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many attempts, try again in 15 minutes"
})

export const SLlimiter = SLrateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many attempts, try again in 15 minutes"
})

const router = express.Router();

router
    .route("/")
    .get(SLlimiter, getAllTodos)            // e.g. http://localhost:PORT/api/v1/todos?page=1&limit=10
    .post(FXlimiter, createTodo);

router
    .route("/:id")
    .get(SLlimiter, getTodoById)         // e.g. http://localhost:PORT/api/v1/todos/e5049973-a748-49d8-8160-a0b91d7ac3a8
    .delete(FXlimiter, deleteTodo)
    .patch(FXlimiter ,upaateTodo)

router
    .route("/toggle/status/:id")
    .patch(FXlimiter, toggleTodo)



export default router;