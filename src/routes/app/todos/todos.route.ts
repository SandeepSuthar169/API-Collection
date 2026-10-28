import express from "express";
import {
    getAllTodos,
    getTodoById,
    createTodo,
} from "@/controllers/app/todos/todo.controller";

const router = express.Router();

router
    .route("/")
    .get(getAllTodos)            // e.g. http://localhost:PORT/api/v1/todos?page=1&limit=20
    .post(createTodo);

router
    .route("/:id")
    .get( getTodoById);         // e.g. http://localhost:PORT/api/v1/todos/e5049973-a748-49d8-8160-a0b91d7ac3a8

export default router;