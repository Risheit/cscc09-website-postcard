import Link from 'next/link';

import {
  faMapPin,
  faThumbsUp,
  faThumbsDown,
  faComments,
  faRetweet,
  faShareFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Dispatch, UIEventHandler, useEffect, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useRouter, useSearchParams } from 'next/navigation';

import { Post } from '@/app/models/post';
import PostModal from '../PostModal/PostModal';

function upvoted(post: Post): Post {
  switch (post.local_liked_status) {
    case 'like':
      return {
        ...post,
        likes: post.likes - 1,
        local_liked_status: undefined,
      };
    case 'dislike':
      return {
        ...post,
        likes: post.likes + 1,
        dislikes: post.dislikes - 1,
        local_liked_status: 'like',
      };
    default:
      return {
        ...post,
        likes: post.likes + 1,
        local_liked_status: 'like',
      };
  }
}

function downvoted(post: Post): Post {
  console.log(post);
  switch (post.local_liked_status) {
    case 'like':
      return {
        ...post,
        likes: post.likes - 1,
        dislikes: post.dislikes + 1,
        local_liked_status: 'dislike',
      };
    case 'dislike':
      return {
        ...post,
        dislikes: post.dislikes - 1,
        local_liked_status: undefined,
      };
    default:
      return {
        ...post,
        dislikes: post.dislikes + 1,
        local_liked_status: 'dislike',
      };
  }
}

export default function Dashboard(props: {
  postFetchLimits: number;
  posts: Post[];
  setPosts: Dispatch<Post[]>;
  mapId: string;
}) {
  const { postFetchLimits, posts, setPosts, mapId } = props;
  const map = useMap(mapId);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [isFetchingPostDetails, setIsFetchingPostDetails] = useState(false);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [isLoadingSpinner, setLoadingSpinner] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const upvotePost = async (postId: number) => {
    setPosts(
      posts.map((post) => {
        return post.id === postId ? upvoted(post) : post;
      })
    );

    if (isFetchingPostDetails) return;
    setIsFetchingPostDetails(true);
    await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'like' }),
    });
    setIsFetchingPostDetails(false);
  };

  const downvotePost = async (postId: number) => {
    setPosts(
      posts.map((post) => {
        return post.id === postId ? downvoted(post) : post;
      })
    );

    if (isFetchingPostDetails) return;
    setIsFetchingPostDetails(true);
    await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'dislike' }),
    });
    setIsFetchingPostDetails(false);
  };

  const [isPostOpen, setIsPostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleOpenModal = (post: Post) => {
    setSelectedPost(post);
    setIsPostOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
    setIsPostOpen(false);
  };

  useEffect(() => {
    if (searchParams.has('post')) {
      const postId = parseInt(searchParams.get('post')!);

      fetch(`/api/posts/${postId}`).then(async (res) => {
        if (!res.ok) {
          return;
        }
        const post: Post = await res.json();
        handleOpenModal(post);
      });
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setLoadingSpinner(false);
    }, 1000);
  }, [isLoadingSpinner]);

  const handleScroll: UIEventHandler<HTMLDivElement> = async (element) => {
    const target = element.currentTarget;
    const isAtBottom =
      Math.abs(
        target.scrollHeight - (target.scrollTop + target.clientHeight)
      ) <= 1;

    if (!isAtBottom || isFetchingPosts || isLoadingSpinner) return;
    setIsFetchingPosts(true);
    setLoadingSpinner(true);

    const res = await fetch(
      `/api/posts?limit=${postFetchLimits}&offset=${
        currentPage * postFetchLimits
      }`
    );
    const postJson = await res.json();
    const newPosts = postJson.map((post: { action?: 'like' | 'dislike' }) => {
      return { ...post, local_liked_status: post.action };
    });
    setIsFetchingPosts(false);

    if (newPosts.length === 0) return;
    setLoadingSpinner(false);
    setPosts([...posts, ...newPosts]);
    setCurrentPage(currentPage + 1);
  };

  return (
    <div
      id="dashboard"
      className="absolute right-0 p-2 z-10 overflow-y-auto no-scrollbar flex flex-col gap-2 overscroll-contain"
      onScroll={handleScroll}
      style={{ width: 'max(400px, 30%)', height: 'calc(100vh - 48px - 8px)' }}
    >
      {posts.map((post) => (
        <div
          key={post.id}
          className="flex flex-col gap-2 bg-background-100 rounded-md shadow-md px-4 py-2"
        >
          <div className="flex place-items-center">
            {/* profile pic and name */}
            <Link
              href={`/user/${post.owner}`}
              className="flex place-items-center"
            >
              {post.poster_profile_pic ? (
                <img
                  src={post.poster_profile_pic}
                  alt="profile"
                  className="rounded-full w-6 select-none"
                />
              ) : (
                <span className="rounded-full h-6 w-6 bg-primary-600"></span>
              )}

              <span className="text-primary-600 pl-2">
                {post.poster_display_name}
              </span>
            </Link>

            <span className="flex-grow"></span>

            {/* date stamp, today formatted */}
            <span className="text-sm font-light text-text-900">
              {new Date(post.posted_time).toLocaleString('en-US', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
                hour: 'numeric',
              })}
            </span>
          </div>

          {post.remix_of && (
            <div
              className="text-xs text-primary-400 font-medium italic hover:bg-background-200 active:bg-background-300 rounded-md cursor-pointer"
              onClick={() => {
                // TODO: replace with api call to get post
                handleOpenModal(posts.find((p) => p.id === post.remix_of)!);
              }}
            >
              <FontAwesomeIcon icon={faRetweet} className="pr-1" />
              remix of {post.remix_of_poster_display_name}'s "
              {post.remix_of_title}"
            </div>
          )}
          <div
            className="flex place-items-center justify-between gap-2 text-text-800 text-xs font-light hover:bg-background-200 active:bg-background-300 rounded-md cursor-pointer"
            onClick={() => {
              if (!map) return;
              map.panTo(post);
              map.setZoom(15);
            }}
          >
            <span className="flex-grow whitespace-nowrap">
              <FontAwesomeIcon icon={faMapPin} className="pr-1" />
              {post.location_name ? post.location_name : 'Unnamed location'}
            </span>
            <span className="text-right flex-grow">
              <span className="whitespace-nowrap">
                {post.lat.toFixed(6)}° {post.lat > 0 ? 'N' : 'S'}
                {', '}
              </span>
              <span className="whitespace-nowrap">
                {post.lng.toFixed(6)}° {post.lng > 0 ? 'W' : 'E'}
              </span>
            </span>
          </div>
          {post.image_content ? (
            <div
              onClick={() => {
                handleOpenModal(post);
              }}
              className="bg-slate-50 p-2 w-full rounded-sm select-none"
            >
              <img
                src={`/api/images/${post.image_content}`}
                alt={post.title}
                className="shadow-sm mb-2"
              />
              <span className="h-4 bg-slate-50 text-black">{post.title}</span>
            </div>
          ) : (
            <div
              onClick={() => {
                handleOpenModal(post);
              }}
              className="h-4 mb-2 cursor-pointer"
            >
              {post.title}
            </div>
          )}
          <div
            onClick={() => {
              handleOpenModal(post);
            }}
            className="text-text-800 text-sm font-light px-2 border-l-2 border-l-primary-600 cursor-pointer"
          >
            {post.text_content}
          </div>

          <div className="flex place-items-center gap-2">
            <button
              className={`inline whitespace-nowrap ${
                post.local_liked_status === 'like'
                  ? 'text-primary-700'
                  : 'text-primary-500'
              }`}
              onClick={() => {
                upvotePost(post.id);
              }}
            >
              {post.likes}
              <FontAwesomeIcon icon={faThumbsUp} className="pl-1" />
            </button>
            <button
              className={`inline whitespace-nowrap ${
                post.local_liked_status === 'dislike'
                  ? 'text-primary-700'
                  : 'text-primary-500'
              }`}
              onClick={() => {
                downvotePost(post.id);
              }}
            >
              {post.dislikes}
              <FontAwesomeIcon icon={faThumbsDown} className="pl-1" />
            </button>
            <button
              className="text-primary-500 inline whitespace-nowrap"
              onClick={() => {
                handleOpenModal(post);
              }}
            >
              {post.num_comments}
              <FontAwesomeIcon icon={faComments} className="pl-1" />
            </button>

            <span className="flex-grow"></span>

            {post.image_content && (
              <button
                className="text-primary-500"
                onClick={() => {
                  router.push(`/post/create?remixing=${post.id}`);
                }}
              >
                <FontAwesomeIcon icon={faRetweet} />
              </button>
            )}
            <button
              className="text-primary-500"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/dashboard?post=${post.id}`
                );
              }}
            >
              <FontAwesomeIcon icon={faShareFromSquare} />
            </button>
          </div>

          <span className="text-right text-text-400 text-xs font-light italic text-nowrap">
            posted:{' '}
            {new Date(post.created).toLocaleString('en-US', {
              year: '2-digit',
              month: '2-digit',
              day: '2-digit',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </span>
        </div>
      ))}
      {isLoadingSpinner && (
        <div className={`flex justify-center items-center h-full w-full`}>
          <img
            src="/static/loading.svg"
            alt="loading..."
            className="w-11 h-11 mt-2 opacity-50"
          />
        </div>
      )}
      <PostModal
        isPostOpen={isPostOpen}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
        upvotePost={(postId) => {
          const post = posts.find((post) => post.id === postId);
          if (post) {
            setSelectedPost(upvoted(post));
          }

          upvotePost(postId);
        }}
        downvotePost={async (postId) => {
          const post = posts.find((post) => post.id === postId);
          if (post) {
            setSelectedPost(downvoted(post));
          }

          downvotePost(postId);
        }}
        handleCloseModal={handleCloseModal}
      />
    </div>
  );
}
