import express from "express";
import { FXlimiter } from "@/app";
import {
    getAllTodos,
    getTodoById,
    createTodo,
} from "@/controllers/app/todos/todo.controller";

const router = express.Router();

router
    .route("/")
    .get(FXlimiter, getAllTodos)            // e.g. http://localhost:PORT/api/v1/todos?page=1&limit=10
    .post(FXlimiter, createTodo);

router
    .route("/:id")
    .get(FXlimiter, getTodoById)         // e.g. http://localhost:PORT/api/v1/todos/e5049973-a748-49d8-8160-a0b91d7ac3a8

export default router;