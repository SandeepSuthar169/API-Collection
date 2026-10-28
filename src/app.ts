import "dotenv/config";
import cors from "cors";
import morgan from "morgan";
import logger from "@/logger/winston.logger";
import session from "express-session";
import cookieParser from "cookie-parser";
import pool, { checkDatabaseConnection } from "./db/pool";
import express, { type Request, type Response } from "express";
import todoRoutes from "@/routes/app/todos/todos.route"
import { FWrateLimiter } from "./limiting/fixedWindow";
import { SLrateLimiter } from "./limiting/SlidingWindow"; 

const app = express()

const PORT = process.env.PORT || 3000;

app.use(cors({
    origin : process.env.ORIGIN,
    credentials: true
}))

app.use(express.json())

app.use(cookieParser())

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

export const FXlimiter = FWrateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many attempts, try again in 15 minutes"
})

export const SLlimiter = SLrateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many attempts, try again in 15 minutes"
})

app.use("/api/v1/todos", todoRoutes)

app.get("/api/healthCheck", (_req: Request, res: Response) => {
    try {
        res.status(200).json({
        status: "ok",
        message: "Every thing is okey!",
        database : "Connected"
    })  
    } catch (error) {
        console.error("Database health check failed!", error);
        res.status(500).json({
            status: "error",
            database: "disconnected"
        })
    }
})

async function startServer() {
    try {
        await checkDatabaseConnection()

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    } catch (error) {
        console.error("Failed to Connect Database", error);
        process.exit(1)
    }
}


startServer();

