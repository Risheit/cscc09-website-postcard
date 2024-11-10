import Link from "next/link";

import {
  faThumbsUp,
  faThumbsDown,
  faComments,
  faRetweet,
  faShareFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useMap } from "@vis.gl/react-google-maps";
import { useRouter } from "next/navigation";

export type Post = {
  id: number;
  title: string;
  type: "postcard" | "text";
  url?: string;
  text?: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
};
export default function Dashboard(props: { posts: any }) {
  const { posts }: { posts: Post[] } = props;
  const map = useMap("postcard-map");

  const router = useRouter();

  return (
    <div
      id="dashboard"
      className="absolute right-0 p-2 z-10 overflow-y-auto no-scrollbar flex flex-col gap-2"
      style={{ width: "30%", height: "calc(100vh - 48px - 8px)" }}
    >
      {posts.map((post) => (
        <Link
          href={`/post/${post.id}`}
          key={post.id}
          className="flex flex-col gap-2 bg-background-100 rounded-md shadow-md px-4 py-2"
        >
          <div className="flex place-items-center">
            {/* profile pic and name */}
            <img
              src="https://picsum.photos/32/32"
              alt="profile"
              className="rounded-full"
            />

            <span className="text-primary-600 pl-2">user</span>

            <span className="flex-grow"></span>

            {/* date stamp, today formatted */}
            <span className="text-sm font-light text-text-900">
              11/09/2024, 12pm
            </span>
          </div>
          <div
            className="flex place-items-center justify-between gap-2 text-text-800 text-xs font-light hover:bg-background-200 active:bg-background-300 rounded-md"
            onClick={() => {
              if (!map) return;
              map.panTo(post.location);
              map.setZoom(15);
            }}
          >
            <span>📍{post.location.name}</span>
            <span>
              {post.location.lat}° {post.location.lat > 0 ? "N" : "S"},{" "}
              {post.location.lng}° {post.location.lng > 0 ? "W" : "E"}
            </span>
          </div>
          {post.type === "postcard" ? (
            <div className="bg-slate-50 p-2 w-full rounded-sm">
              <img src={post.url} alt={post.title} className="shadow-sm mb-2" />

              <span className="h-4 bg-slate-50 text-black">{post.title}</span>
            </div>
          ) : (
            <></>
          )}
          <span className="text-text-800 text-sm font-light px-2 border-l-2 border-l-primary-600 ">
            {post.text}
          </span>

          <div className="flex place-items-center gap-2">
            <button
              className="text-primary-500 inline whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              4
              <FontAwesomeIcon icon={faThumbsUp} className="pl-1" />
            </button>
            <button
              className="text-primary-500 inline whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              2
              <FontAwesomeIcon icon={faThumbsDown} className="pl-1" />
            </button>
            <button
              className="text-primary-500 inline whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              3
              <FontAwesomeIcon icon={faComments} className="pl-1" />
            </button>

            <span className="flex-grow"></span>

            <button
              className="text-primary-500"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/post/${post.id}/remix`);
              }}
            >
              <FontAwesomeIcon icon={faRetweet} />
            </button>
            <button
              className="text-primary-500"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                // TODO: copy post url to clipboard
              }}
            >
              <FontAwesomeIcon icon={faShareFromSquare} />
            </button>
          </div>

          <span className="text-right text-text-400 text-xs font-light italic text-nowrap">
            uploaded: 11/09/2024
          </span>
        </Link>
      ))}
      {/* <div className="h-12"></div> */}
    </div>
  );
}
