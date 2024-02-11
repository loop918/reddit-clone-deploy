import { BeforeInsert, Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany } from "typeorm";
import  BaseEntity  from "./Entity";
import { User } from "./User";
import Post from "./Post";
import Vote from "./Vote";
import { Exclude, Expose } from "class-transformer";
import { makeId } from "../utils/helper";

@Entity("comments")
export default class Comment extends BaseEntity {
    @Index()
    @Column()
    identifier: string;

    @Column()
    body: string;

    @Column()
    username: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "username", referencedColumnName: "username" })
    user: User

    @Column()
    postId: number;

    @ManyToOne(() => Post, (post) => post.comments, { nullable: false })
    post: Post;

    @Exclude()
    @OneToMany(() => Vote, (vote) => vote.comment)
    votes: Vote[]

    protected userVote: number;

    // 유저 게시글의 댓글 점수.
    setUserVote(user: User) {
        const index = this.votes?.findIndex(v => v.username === user.username);
        this.userVote = index > -1 ? this.votes[index].value : 0;
    }

    @Expose() get voteScore(): number {
        const initialValue = 0
        return this.votes?.reduce((previousValue, currentObject) =>
            previousValue + (currentObject.value || 0), initialValue)
    }

    @BeforeInsert()
    makeId() {
        this.identifier = makeId(8);
    }
}