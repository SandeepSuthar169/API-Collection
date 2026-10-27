import "dotenv/config";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import pool, { checkDatabaseConnection } from "./db/pool";
import express, { type Request, type Response } from "express";
import morgan from "morgan";
import logger from "../src/utiles/logger";


const app = express()

const PORT = process.env.PORT || 3000;

app.use(cors({
    origin : "http://localhost:3000",
    credentials: true
}))

app.use(express.json())

app.use(cookieParser())

app.get("/api/healthCheck", (_req: Request, res: Response) => {
    try {
        res.status(200).json({
        status: "ok",
        message: "Every thing is Okey!",
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



app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

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

startServer()



