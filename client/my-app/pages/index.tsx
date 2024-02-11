import Link from 'next/link'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import useSWR from 'swr';
import { Sub , Post} from '@/types';
import axios from 'axios';
import { useAuthState } from '@/context/auth';
import useSWRInfinite from 'swr/infinite';
import PostCard from '@/components/PostCard';
import { useEffect, useState } from 'react';

const Home: NextPage = () => {
  const { authenticated } = useAuthState();
  /*
  //SWR 적용.
  const fetcher = async(url: string) => {
    return await axios.get(url).then(res => res.data)
  }
  */
  const address = "/subs/sub/topsSubs";
  const { data: topSubs } =  useSWR<Sub[]>( address ); // url, fetcher
  //SWR END

  // SWR Infinity Scroll
  const getKey = (pageIndex: number, previousPageData: Post[]) => {
    if (previousPageData && !previousPageData.length) return null;
    return `/posts?page=${pageIndex}`;
  }
  const { data, error, size: page, setSize: setPage, isValidating, mutate } = useSWRInfinite<Post[]>(getKey);

  const isInitialLoading = !data && !error;
  const posts: Post[] = data ? ([] as Post[]).concat(...data) : [];

  // observer intersections 무한스크롤
  const [observedPost, setObservedPost] = useState("");

  useEffect(() => {
    // 포스트가 없다면 return
    if(!posts || posts.length === 0 ) return ;
  
    // posts 배열안에 마지막 post에 id를 가져옵니다.
    const id = posts[posts.length -1].identifier;

    // posts 배열에 post가 추가돼서 마지막 post가 바뀌었다면 
    // 바뀐 post 중 마지막 post를 observedPost 로 변경.
    if( id !== observedPost ) {
      setObservedPost(id);
      observedElement(document.getElementById(id));
    }
  }, [posts] )

  const observedElement = ( element: HTMLElement | null ) => {
    if(!element) return ;
    // 브라우저 뷰 포트(View Port)와 설정한 요소(Element)의 교차점을 관찰.
    const observer = new IntersectionObserver(
      // entries는 IntersectionObserverEntry 인스턴스의 배열
      (entries) => {
        //isIntersection: 관찰 대상의 교차상태(Boolean)
        if(entries[0].isIntersecting === true) {
          console.log("마지막 포스트에 왔습니다.");
          setPage(page + 1);
          observer.unobserve(element); 
        }
      }, 
      { threshold : 1 }  // 교차상태 백분율 100%
    );
    // 대상 요소의 관찰을 시작
    observer.observe(element);
  }

  return (
    <div className="flex max-w-5xl px-4 pt-5 mx-auto">
      {/* 포스트 리스트 */}
      <div className="w-full md:mr-3 md:w-8/12"> 
          {isInitialLoading && <p className="text-lg text-center">로딩중입니다...</p>}
          {posts?.map(post => (
            <PostCard
              key={post.identifier}
              post={post}
              mutate={mutate}
            />
          ))}

       </div>

      {/* 사이드바 */}
      <div className="hidden w-4/12 ml-3 md:block"> {/* 창이 4/12 정도작아지면 히든 */}
        <div className="bg-white border rounded">
          <div className="p-4 border-b">
            <p className="text-lg font-semibold text-center">상위 커뮤니티</p>
          </div>
          
          {/* 커뮤니티 리스트 */}
          <div>
            {topSubs?.map((sub) => 
              <div key={sub.name} className="flex items-center px-4 py-2 text-xs border-b">
                  <Link href={`/r/${sub.name}`} legacyBehavior>
                    <a>
                      <Image src={`/${sub.imageUrl}`} className="rounded-full cursor-pointer" alt="Sub" width={24} height={24}/>
                    </a>
                  </Link>
                  <Link href={`/r/${sub.name}`} legacyBehavior>
                      <a className="ml-2 font-bold hover:cursor-pointer">
                         /r/{sub.name}
                      </a>
                  </Link>
                  <p className="ml-auto font-md">{sub.postCount}</p>
              </div>  
            )}
          </div>
          
          {/* 권한이 있는 사람만 커뮤니티 만들기 버튼 보이도록 처리.*/}
          {authenticated && 
              <div className="w-full py-6 text-center" >
              <Link href="/subs/create" legacyBehavior>
                <a className="w-full p-2 text-center text-white bg-gray-400 rounded">
                  커뮤니티 만들기
                </a>
              </Link>
            </div>          
          }

        </div>
      </div>
    </div>
  )
}
export default Home;
