import { NextFunction, Request, Response, Router } from "express";
import { User } from "../entites/User";
import jwt from 'jsonwebtoken';

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user: User | undefined = res.locals.user;

        if(!user) throw new Error("Unauthenticated");

        return next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({error: "Unauthenticated"});
    }
}
