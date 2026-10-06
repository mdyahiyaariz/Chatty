import dotenv from "dotenv"
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http"
import path from "path"

import { Server } from "socket.io"

import { connectDB } from "./utils/db.js";

import authRoutes from "./routes/authRoutes.js"
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"

import { initializeSocket } from "./socket.js";
import { socketAuthMiddleware } from "./socket/socketAuthMiddleware.js";

import RedisService from "./services/RedisService.js";

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set. Copy .env to .env and fill it in.");
    process.exit(1);
}

const app = express();

app.set("trust proxy", 1);                           // Render runs behind a proxy
app.get("/health", (req, res) => res.send("ok"));    // used by Render health checks

const httpServer = http.createServer(app);

// Pictures are loaded by the frontend from another origin, so they must be allowed cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
}))
app.use(cookieParser())

app.use(express.json({ limit: "100kb" }))

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false, message: { message: "Too many attempts. Try again later." } })

// routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api/upload', uploadRoutes);

// serve uploaded attachments (images/audio)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_ORIGIN,
        credentials: true,
        methods: ["GET", "POST"]
    },
    pingInterval: 25000,
    pingTimeout: 60000,
})
app.set("io", io);
io.use(socketAuthMiddleware);

await initializeSocket(io);

await RedisService.initialize();

try {
    await connectDB();

    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
        console.log(`Server running on port: ${PORT}`);
    })
} catch (error) {
    console.error("The server failed to start", error);
    process.exit(1);
}
