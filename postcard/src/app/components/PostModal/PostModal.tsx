import Link from 'next/link';
import './PostModal.css';

import {
  faMapPin,
  faThumbsUp,
  faThumbsDown,
  faComments,
  faRetweet,
  faShareFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Modal } from 'react-bootstrap';

import { Post } from '@/app/models/post';
import { useRouter } from 'next/navigation';

export default function PostModal(props: {
  isPostOpen: boolean;
  selectedPost: Post | null;
  upvotePost: (postId: number) => void;
  downvotePost: (postId: number) => void;
  handleCloseModal: () => void;
}) {
  const {
    isPostOpen,
    selectedPost,
    upvotePost,
    downvotePost,
    handleCloseModal,
  }: {
    isPostOpen: boolean;
    selectedPost: Post | null;
    upvotePost: (postId: number) => void;
    downvotePost: (postId: number) => void;
    handleCloseModal: () => void;
  } = props;
  const router = useRouter();

  return isPostOpen && selectedPost ? (
    <Modal show={isPostOpen} onHide={handleCloseModal} centered>
      <div className="grid grid-cols-2 bg-background-200 rounded-lg overflow-hidden shadow-md min-h-[80vh] min-w-[90vw]">
        <div className="flex flex-col gap-2 place-self-center w-full p-10">
          {selectedPost.image_content ? (
            <div
              className="flip-container w-fit"
              onClick={() => {
                const parentDiv = document.querySelector('.flip-container');
                if (parentDiv) {
                  parentDiv.classList.toggle('flip');
                }
              }}
            >
              <div className="front bg-slate-50 p-2 rounded-md flex h-auto flex-col select-none w-fit">
                <img
                  src={`/api/images/${selectedPost.image_content}`}
                  alt={selectedPost.title}
                  className="shadow-sm mb-2 self-center max-h-[70vh] h-auto"
                />
                <span className="h-4 bg-slate-50 text-black mb-2">
                  {selectedPost.title}
                </span>
              </div>

              <div className="back bg-slate-50 p-2 rounded-md flex h-auto flex-col select-none w-fit">
                <img
                  src={`/api/images/${selectedPost.image_content}`}
                  alt={selectedPost.title}
                  className="shadow-sm mb-2 self-center max-h-[70vh] h-auto invisible"
                />
                <span className="h-4 bg-slate-50 text-black mb-2 invisible">
                  {selectedPost.title}
                </span>
                <div className="absolute text-black text-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 font-light">
                  {selectedPost.text_content}
                  <span className="font-bold whitespace-nowrap">
                    {' '}
                    —{selectedPost.poster_display_name}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-4 mb-2 text-center">{selectedPost.title}</div>
          )}
        </div>
        <div className="flex flex-col gap-2 bg-background-100 px-4 py-4">
          <div className="flex place-items-center">
            {/* profile pic and name */}
            <Link
              href={`/user/${selectedPost.owner}`}
              className="flex place-items-center"
            >
              {selectedPost.poster_profile_pic ? (
                <img
                  src={selectedPost.poster_profile_pic}
                  alt="profile"
                  className="rounded-full w-6 select-none"
                />
              ) : (
                <span className="rounded-full h-6 w-6 bg-primary-600"></span>
              )}

              <span className="text-primary-600 pl-2">
                {selectedPost.poster_display_name}
              </span>
            </Link>

            <span className="flex-grow"></span>

            {/* date stamp, today formatted */}
            <span className="text-sm font-light text-text-900">
              {new Date(selectedPost.posted_time).toLocaleString('en-US', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
                hour: 'numeric',
              })}
            </span>
          </div>

          <div
            className="flex place-items-center justify-between gap-2 text-text-800 text-xs font-light hover:bg-background-200 active:bg-background-300 rounded-md cursor-pointer"
            onClick={() => {
              // TODO: open another modal with location pinned shown
            }}
          >
            <span className="flex-grow whitespace-nowrap">
              <FontAwesomeIcon icon={faMapPin} className="pr-1" />
              {selectedPost.location_name
                ? selectedPost.location_name
                : 'Unnamed location'}
            </span>
            <span className="text-right flex-grow">
              <span className="whitespace-nowrap">
                {selectedPost.lat.toFixed(6)}°{' '}
                {selectedPost.lat > 0 ? 'N' : 'S'}
                {', '}
              </span>
              <span className="whitespace-nowrap">
                {selectedPost.lng.toFixed(6)}°{' '}
                {selectedPost.lng > 0 ? 'W' : 'E'}
              </span>
            </span>
          </div>
          <div className="h-4 mb-2">{selectedPost.title}</div>
          <div className="text-text-800 text-sm font-light px-2 border-l-2 border-l-primary-600">
            {selectedPost.text_content}
          </div>

          <div className="flex place-items-center gap-2">
            <button
              className="text-primary-500 inline whitespace-nowrap"
              onClick={() => {
                upvotePost(selectedPost.id);
              }}
            >
              {selectedPost.likes}
              <FontAwesomeIcon
                icon={faThumbsUp}
                className={`pl-1 ${
                  selectedPost.local_liked_status === 'like'
                    ? 'text-orange-900'
                    : ''
                }`}
              />
            </button>
            <button
              className="text-primary-500 inline whitespace-nowrap"
              onClick={() => {
                downvotePost(selectedPost.id);
              }}
            >
              {selectedPost.dislikes}
              <FontAwesomeIcon
                icon={faThumbsDown}
                className={`pl-1 ${
                  selectedPost.local_liked_status === 'dislike'
                    ? 'text-orange-900'
                    : ''
                }`}
              />
            </button>
            <button className="text-primary-500 inline whitespace-nowrap">
              {selectedPost.num_comments}
              <FontAwesomeIcon icon={faComments} className="pl-1" />
            </button>

            <span className="flex-grow"></span>

            <button
              className="text-primary-500"
              onClick={() => {
                router.push(`/post/${selectedPost.id}/remix`);
              }}
            >
              <FontAwesomeIcon icon={faRetweet} />
            </button>
            <button
              className="text-primary-500"
              onClick={() => {
                // TODO: copy post url to clipboard
              }}
            >
              <FontAwesomeIcon icon={faShareFromSquare} />
            </button>
          </div>

          <span className="text-right text-text-400 text-xs font-light italic text-nowrap">
            posted:{' '}
            {new Date(selectedPost.created).toLocaleString('en-US', {
              year: '2-digit',
              month: '2-digit',
              day: '2-digit',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </span>

          <div>
            <h1>comments</h1>
          </div>
        </div>
      </div>
    </Modal>
  ) : (
    <></>
  );
}
