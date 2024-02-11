import { NextFunction, Request, Response, Router } from "express";
import { User } from "../entites/User";
import jwt from 'jsonwebtoken';

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 토큰에서 유저 정보 가져오기.
        const token = req.cookies.token;
        if(!token) return next();

        const { username } : any = jwt.verify(token, process.env.JWT_SECRET);  

        const user = await User.findOneBy({ username });
        // 유저 정보를 res.locals.user에 저장 (로컬스토리지)
        res.locals.user = user;
        
        return next(); // 미들웨어에서 반드시 리턴 후, next()를 호출해줘야함... 안그러면 pending 상태...

    } catch (error) {
        console.log(error);
        return res.status(400).json({error: "Something went wrong"});
    }
}
