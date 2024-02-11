import {  BeforeInsert, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import BaseEntity   from './Entity';
import {User} from './User';
import Sub from './Sub';
import Comment from './Comment';
import { Exclude, Expose } from "class-transformer";
import { makeId, slugify } from "../utils/helper";
import Vote from "./Vote";

@Entity("posts")
export default class Post extends BaseEntity {
    @Index()
    @Column()
    identifier: string;

    @Column()
    title: string;

    @Index()
    @Column()
    slug: string;

    @Column({ nullable: true, type: "text" })
    body: string;

    @Column()
    subName: string;

    @Column()
    username: string;

    @ManyToOne(() => User, (user) => user.posts)
    @JoinColumn({ name: "username", referencedColumnName: "username" })
    user: User;

    @ManyToOne(() => Sub, (sub) => sub.posts)
    @JoinColumn({ name: "subName", referencedColumnName: "name"})
    sub: Sub;

    //Getter
    @Exclude()
    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[];

    //Getter
    @Exclude()
    @OneToMany(() => Vote, (vote) => vote.post)
    votes: Vote[];

    //Getter
    @Expose() get url(): string {
        return `/r/${this.subName}/${this.identifier}/${this.slug}`
    }

    //Getter
    @Expose() get commentCount(): number {
        return this.comments?.length;
    }

    //Getter
    @Expose() get voteScore(): number {
        return this.votes?.reduce((memo, curt) => memo + (curt.value || 0), 0);
    }

    protected userVote: number;

    // 유저 게시글 점수
    setUserVote(user: User) {
        const index = this.votes?.findIndex(v => v.username === user.username);
        this.userVote = index > -1 ? this.votes[index].value : 0;
    }

    @BeforeInsert()
    makeIdAndSlug() {
        this.identifier = makeId(7);
        this.slug = slugify(this.title);
    }
}