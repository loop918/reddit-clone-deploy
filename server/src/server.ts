import express from "express";
import morgan from "morgan";
import { AppDataSource } from "./data-source"
import cors from 'cors';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import subsRouter from "./routes/subs";
import postRouter from "./routes/posts";
import voteRouter from "./routes/votes";
import userRouter from "./routes/users";

const app = express();

app.use(express.json()); // json 형식으로 온 요청을 해석함.
app.use(morgan("dev"));
app.use(cookieParser());
dotenv.config();

const origin = process.env.ORIGIN;

app.use(
    cors({
        origin,
        credentials : true, // 도메인주소가 다를때. 쿠키 사용 설정
    })
)
app.get("/", (_, res) => res.send("running"));

app.use("/api/auth", authRouter);
app.use("/api/subs", subsRouter);
app.use("/api/posts", postRouter);
app.use("/api/votes", voteRouter);
app.use("/api/users", userRouter);

app.use(express.static("public")) // 이미지 안보일때. 정적인 파일을 브라우저로 접근할때 설정.

// Server Start
app.listen(process.env.PORT, async () => {
    console.log(`Server running at ${origin}`);
    // DB Connection
    AppDataSource.initialize().then(() => {
        console.log("Database connected!!");
    }).catch(error => console.log(error));
})