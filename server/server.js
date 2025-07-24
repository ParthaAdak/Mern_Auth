import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDb from "./config/mongodb.js";
import authRouter from './routes/authRoutes.js';
import userRouter from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT || 4000;

// ✅ Connect to MongoDB
connectDb();
const allowedOrigins = [
  'http://localhost:5173', // for local dev
  
];




app.use(express.json());
app.use(cookieParser());

// ✅ Only use one CORS middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// ✅ Basic test route
app.get("/", (req, res) => res.send("API Working Fine"));

// ✅ Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// ✅ Start server
app.listen(port, () => console.log(`Server started on PORT : ${port}`));