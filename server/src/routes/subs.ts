import { NextFunction, Request, Response, Router } from "express";
import { User } from "../entites/User";
import Sub  from '../entites/Sub';
import { isEmpty } from "class-validator";
import { AppDataSource } from "../data-source";
import userMiddleware from '../middlewares/user';
import authMiddleware from '../middlewares/auth';
import Post from "../entites/Post";
import multer, { FileFilterCallback } from "multer";
import { makeId } from "../utils/helper";
import path from "path";
import { unlinkSync } from "fs";

// 커뮤니티 상세 페이지
const getSub = async( req: Request, res: Response) => {
    const name = req.params.name;
    try {
        const sub = await Sub.findOneByOrFail({ name });

        // 포스트를 생성한 후에 해당 sub에 속한 포스트 정보들을 넣어주기
        const posts = await Post.find({
            where : { subName : sub.name }, // subName
            order : { createdAt : "DESC"},
            relations: ["comments", "votes"],
        });
        sub.posts = posts;
        
        if(res.locals.user) {
            sub.posts.forEach((p) => p.setUserVote(res.locals.user));
        }
        
        return res.json(sub);

    } catch(error) {
        return res.status(404).json({ error : "커뮤니티를 찾을수 업습니다." });
    }
}

// 커뮤니티생성
const createSub = async(req: Request, res: Response, next) => {
    const {name, title, description} = req.body;
    try {
        let errors : any = {};
        if(isEmpty(name)) errors.name = "이름은 비워둘 수 없습니다.";
        if(isEmpty(title)) errors.name = "제목은 비워둘 수 없습니다.";
        
        const sub = await  AppDataSource.getRepository(Sub)
                                        .createQueryBuilder("sub")
                                        .where("lower(sub.name) = :name", { name : name.toLowerCase() })
                                        .getOne();

        if(sub) errors.name = "같은 이름의 Sub가 이미 존재합니다.";

        if(Object.keys(errors).length > 0) {
            throw errors;
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({error : "문제가 발생했습니다."});
    }

    try {
        const user: User = res.locals.user;

        const sub = new Sub();
        sub.name = name;
        sub.title = title;
        sub.description = description;
        sub.user = user;
        await sub.save();

        return res.status(200).json(sub);
    } catch(error) {
        console.log(error);
        return res.status(500).json({error : "문제가 발생했습니다.'"})
    }
}

// 탑 커뮤니티 조회
const topSubs = async (req : Request, res: Response) => {
    try {
        const imageUrlExp = `COALESCE('${process.env.APP_URL}/images/' || s."imageUrn", 'https://www.gravatar.com/avatar?d=mp&f=y')`; // COALESCE - null이 아닌값 반환.
        const subs = await AppDataSource
        .createQueryBuilder()
        .select(`s.title, s.name, ${imageUrlExp} as "imageUrl", count(p.id) as "postCount"`)
        .from(Sub, "s")
        .leftJoin(Post, "p", `s.name = p."subName"`)
        .groupBy('s.title, s.name, "imageUrl"')
        .orderBy(`"postCount"`, "DESC")
        .limit(5)
        .execute();

        //return res.json(subs);
        return res.status(200).json(subs);

    } catch(error) {
        console.log(error);
        return res.status(500).json({error: "Something went wrong"});
    }
}

// 커뮤니티 소유자인지 확인하는 미들웨어
const ownSub = async(req: Request, res: Response, next: NextFunction) => {
    const user: User = res.locals.user;
    try {
        const sub = await Sub.findOneOrFail({ where : {name: req.params.name }} )
        if(sub.username !== user.username) {
            return res.status(403).json({ error: "이 커뮤니티를 소유하고 있지 않습니다."});
        }
        res.locals.sub = sub;
        next();
    } catch(error) {
        console.log(error);
        return res.status(500).json({ error: "문제가 발생했습니다." });
    }
}


const upload = multer({
    storage: multer.diskStorage({
        destination: "public/images",
        filename: (_, file, callback) =>{
            const name = makeId(10);
            callback(null, name + path.extname(file.originalname)); 
        }
    }),
    fileFilter: ( _ , file: any, callback: FileFilterCallback) => {
        if(file.mimetype === "image/jpeg" || file.mimetype === "png") {
            callback(null, true);
        } else {
            callback(new Error("이미지형식이 아닙니다."))
        }
    },
})

const uploadSubImage = async(req: Request, res: Response) => {
    const sub: Sub = res.locals.sub;
    try {
        const type = req.body.type;
        // 파일 유형을 지정치 않았을시 업로드 된 파일 삭제.
        if(type !== "image" && type !== "banner") {
            if(!req.file?.path) {
                return res.status(400).json({error: "유효하지 않은 파일"});
            }
            // 파일 지워주기.
            unlinkSync(req.file.path);
            return res.status(400).json({error: "잘못된 유형"});
        }

        let oldImageUrn: string = "";

        if(type === "image") {
            // 사용중인 Urn을 저장 (이전 파일을 아래서 삭제하기 위해)
            oldImageUrn = sub.imageUrn || "";
            // 새로운 파일 이름을 Urn으로 넣어준다.
            sub.imageUrn = req.file?.filename || "";
        } else if(type === "banner") {
            oldImageUrn = sub.bannerUrn || "";
            sub.bannerUrn = req.file?.filename || "";
        }
        await sub.save();

        //사용하지 않는 이미지 파일 삭제
        if(oldImageUrn !== "") {
            const fullFileName = path.resolve(
                process.cwd(),
                "public",
                "images",
                oldImageUrn
            )
            unlinkSync(fullFileName);
        }
        console.log(sub);
        return res.json(sub);
        
    } catch(error) {
        console.log(error);
        return res.status(500).json({ error: "문제가 발생했습니다." });
    }
}

const router = Router();

router.get("/:name", userMiddleware, getSub);
router.post("/", userMiddleware, authMiddleware, createSub); // userMiddleware , authMiddleware 를 통과한 이후 createSub 핸들러를 처리하도록..
router.get("/sub/topsSubs", topSubs);
router.post("/:name/upload"
            , userMiddleware
            , authMiddleware
            , ownSub
            , upload.single("file")
            , uploadSubImage
           )

export default router;