import express from "express";
import {
    getAllTodos,
    getTodoById,
} from "@/controllers/app/todos/todo.controller"

const route = express()


route.get("/")
