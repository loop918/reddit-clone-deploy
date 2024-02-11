import { Router,Request, Response} from 'express';
import userMiddleware from '../middlewares/user';
import { User } from '../entites/User';
import Post from '../entites/Post';
import Comment from '../entites/Comment';

const getUserData = async(req: Request, res: Response) => {
    try {
       // 유저 정보 가져오기
       const user = await User.findOneOrFail({
            where: { username : req.params.username },
            select: ["username", "createdAt"]
       })
       
       // 유저가 쓴 포스트 정보 가져오기
       const posts = await Post.find({
          where: { username: user.username },
          relations: ["comments", "votes", "sub"]
       })

       // 유저가 쓴 댓글 정보 가져오기
       const comments = await Comment.find({
          where: { username: user.username },
          relations: ["post"]
       })

       if(res.locals.user) {
          const { user } = res.locals;
          posts.forEach(p => p.setUserVote(user));
          comments.forEach(c => c.setUserVote(user));
       }

       let userData: any[] = [];

       posts.forEach(p => userData.push({ type: "Post", ...p.toJSON() }))    // Default가 클래스 형태이므로 JSON 형태로 변경하여 복사한다.
       comments.forEach(c => userData.push({ type: "Comment", ...c.toJSON() })) // Default가 클래스 형태이므로 JSON 형태로 변경하여 복사한다.

       // 최신정보가 상위에 위치하도록 정렬(SORT)
       userData.sort((a,b) => {
            if(b.createdAt > a.createdAt) return 1;
            if(b.createdAt < a.createAt) return -1;
            return 0;
       })

       return res.json({ user, userData}); // user , userData 

    } catch(error) {
        console.log(error);
        return res.status(500).json({error: "유저정보 조회시 문제가 발생 했습니다."});
    }
}

const router = Router();
router.get("/:username", userMiddleware, getUserData); 

export default router;
