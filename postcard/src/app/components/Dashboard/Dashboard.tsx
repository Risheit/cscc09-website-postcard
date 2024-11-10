import Link from "next/link";

import {
  faMapPin,
  faThumbsUp,
  faThumbsDown,
  faComments,
  faRetweet,
  faShareFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useMap } from "@vis.gl/react-google-maps";
import { useRouter } from "next/navigation";

import { Post } from "@/app/models/post";

export default function Dashboard(props: { posts: Post[]; mapId: string }) {
  const { posts, mapId }: { posts: Post[]; mapId: string } = props;
  const map = useMap(mapId);

  const router = useRouter();

  return (
    <div
      id="dashboard"
      className="absolute right-0 p-2 z-10 overflow-y-auto no-scrollbar flex flex-col gap-2"
      style={{ width: "30%", height: "calc(100vh - 48px - 8px)" }}
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
                  className="rounded-full w-6"
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
              {new Date(post.posted_time).toLocaleString("en-US", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
                hour: "numeric",
              })}
            </span>
          </div>
          <div
            className="flex place-items-center justify-between gap-2 text-text-800 text-xs font-light hover:bg-background-200 active:bg-background-300 rounded-md cursor-pointer"
            onClick={(e) => {
              if (!map) return;
              map.panTo(post);
              map.setZoom(15);
            }}
          >
            <span>
              <FontAwesomeIcon icon={faMapPin} className="pr-1" />
              {post.location_name ? post.location_name : "Unnamed location"}
            </span>
            <span>
              {post.lat}° {post.lat > 0 ? "N" : "S"}, {post.lng}°{" "}
              {post.lng > 0 ? "W" : "E"}
            </span>
          </div>
          {post.image_content ? (
            <Link
              href={`/post/${post.id}`}
              className="bg-slate-50 p-2 w-full rounded-sm"
            >
              {/* TODO: get images to work */}
              <img
                src={post.image_url}
                alt={post.title}
                className="shadow-sm mb-2"
              />
              <span className="h-4 bg-slate-50 text-black">{post.title}</span>
            </Link>
          ) : (
            <span className="h-4 mb-2">{post.title}</span>
          )}
          <Link
            href={`/post/${post.id}`}
            className="text-text-800 text-sm font-light px-2 border-l-2 border-l-primary-600"
          >
            {post.text_content}
          </Link>

          <div className="flex place-items-center gap-2">
            <button
              className="text-primary-500 inline whitespace-nowrap"
              onClick={(e) => {}}
            >
              {post.likes}
              <FontAwesomeIcon icon={faThumbsUp} className="pl-1" />
            </button>
            <button
              className="text-primary-500 inline whitespace-nowrap"
              onClick={(e) => {}}
            >
              {post.dislikes}
              <FontAwesomeIcon icon={faThumbsDown} className="pl-1" />
            </button>
            <button
              className="text-primary-500 inline whitespace-nowrap"
              onClick={(e) => {
                router.push(`/post/${post.id}`);
              }}
            >
              {post.num_comments}
              <FontAwesomeIcon icon={faComments} className="pl-1" />
            </button>

            <span className="flex-grow"></span>

            <button
              className="text-primary-500"
              onClick={(e) => {
                router.push(`/post/${post.id}/remix`);
              }}
            >
              <FontAwesomeIcon icon={faRetweet} />
            </button>
            <button
              className="text-primary-500"
              onClick={(e) => {
                // TODO: copy post url to clipboard
              }}
            >
              <FontAwesomeIcon icon={faShareFromSquare} />
            </button>
          </div>

          <span className="text-right text-text-400 text-xs font-light italic text-nowrap">
            posted:{" "}
            {new Date(post.created).toLocaleString("en-US", {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
              hour: "numeric",
              minute: "numeric",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
