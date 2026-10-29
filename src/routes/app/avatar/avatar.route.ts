import express from "express";
import  { FWrateLimiter }  from "@/limiter/fixedWindow";
import { SLrateLimiter } from "@/limiter/SlidingWindow";
import {
    createAvatars,
} from "@/controllers/app/avatar/avtar.controller";

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
    // .get(SLlimiter, getAllTodos)            // e.g. http://localhost:PORT/api/v1/todos?page=1&limit=10
    .post(FXlimiter, createAvatars);           // e.g. http://localhost:PORT/api/v1/todos/

// router
//     .route("/:id")
//     .get(SLlimiter, getTodoById)           // e.g.  http://localhost:PORT/api/v1/todos/e5049973-a748-49d8-8160-a0b91d7ac3a8
//     .delete(FXlimiter, deleteTodo)         // e.g.  http://localhost:PORT/api/v1/todos/bbafc088-4c4f-487a-97b0-0fb6168dd31e
//     .patch(FXlimiter ,updateTodo)          // e.g.  http://localhost:PORT/api/v1/toggle/status/7d7005d6-7c73-4829-b498-1c1a49a7498a

// router
//     .route("/toggle/status/:id")
//     .patch(FXlimiter, toggleTodo)          // e.g.  http://localhost:PORT/api/v1/todos/024ba60d-3798-4b1f-91dc-aa8a8a72f7b9



export default router;