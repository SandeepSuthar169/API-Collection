import express from "express";
import {
    getAllTodos,
    getTodoById,
} from "@/controllers/app/todos/todo.controller"

const route = express()


route.get("/", getAllTodos)              // E.g. : http://localhost:PORT/api/v1/todos?page=1&limit=20
route.get("/:id", getTodoById)           // E.g. : http://localhost:PORT/api/v1/todos/e5049973-a748-49d8-8160-a0b91d7ac3a8


export default route