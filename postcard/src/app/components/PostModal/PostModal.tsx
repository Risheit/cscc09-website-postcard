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
import { useState } from 'react';
import MapModal from '../MapModal/MapModal';

export default function PostModal(props: {
  isPostOpen: boolean;
  selectedPost: Post | null;
  setSelectedPost: (post: Post) => void;
  upvotePost: (postId: number) => void;
  downvotePost: (postId: number) => void;
  handleCloseModal: () => void;
}) {
  const {
    isPostOpen,
    selectedPost,
    setSelectedPost,
    upvotePost,
    downvotePost,
    handleCloseModal,
  }: {
    isPostOpen: boolean;
    selectedPost: Post | null;
    setSelectedPost: (post: Post) => void;
    upvotePost: (postId: number) => void;
    downvotePost: (postId: number) => void;
    handleCloseModal: () => void;
  } = props;
  const router = useRouter();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapModalLoc, setMapModalLoc] = useState({
    lat: 0,
    lng: 0,
  });

  // inject mock comments
  // TODO: replace with api call to get comments
  if (selectedPost && selectedPost.id === 7) {
    selectedPost.comments = [
      {
        id: 1,
        display_name: 'john_doe',
        profile_pic: 'https://picsum.photos/200/200?random=1',
        text: 'This is a comment.',
        likes: 10,
        dislikes: 2,
      },
      {
        id: 2,
        display_name: 'bob',
        profile_pic: '',
        text: 'remixed the post!',
        remix: 'postid...',
        remix_link: 'https://picsum.photos/600/400?random=1',
        remix_title: "bob's remix haha",
        likes: 5,
        dislikes: 1,
      },
    ];
  } else if (selectedPost) {
    selectedPost.comments = [];
  }

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

          {selectedPost.remix_of && (
            <div
              className="text-xs text-primary-400 font-medium italic hover:bg-background-200 active:bg-background-300 rounded-md cursor-pointer"
              onClick={() => {
                // TODO: replace with api call to get post
                setSelectedPost({
                  id: 7,
                  owner: 3,
                  poster_display_name: 'alice',
                  title: 'Greetings from Paris',
                  image_content: 'https://picsum.photos/600/400?random=1',
                  text_content: 'Enjoying the beautiful sights of Paris!',
                  location_name: 'Eiffel Tower',
                  lat: 48.8584,
                  lng: 2.2945,
                  posted_time: new Date(2021, 5, 15, 10, 30),
                  created: new Date(2021, 5, 16, 11, 45),
                  likes: 120,
                  dislikes: 5,
                  num_comments: 0,
                });
              }}
            >
              <FontAwesomeIcon icon={faRetweet} className="pr-1" />
              remix of {selectedPost.remix_of_poster_display_name}&apos;s &quot;
              {selectedPost.remix_of_title}&quot;
            </div>
          )}

          <div
            className="flex place-items-center justify-between gap-2 text-text-800 text-xs font-light hover:bg-background-200 active:bg-background-300 rounded-md cursor-pointer"
            onClick={() => {
              setMapModalLoc({
                lat: selectedPost.lat,
                lng: selectedPost.lng,
              });
              setIsMapModalOpen(true);
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
              className={`inline whitespace-nowrap ${
                selectedPost.local_liked_status === 'like'
                  ? 'text-primary-700'
                  : 'text-primary-500'
              }`}
              onClick={() => {
                upvotePost(selectedPost.id);
              }}
            >
              {selectedPost.likes}
              <FontAwesomeIcon icon={faThumbsUp} className="pl-1" />
            </button>
            <button
              className={`inline whitespace-nowrap ${
                selectedPost.local_liked_status === 'dislike'
                  ? 'text-primary-700'
                  : 'text-primary-500'
              }`}
              onClick={() => {
                downvotePost(selectedPost.id);
              }}
            >
              {selectedPost.dislikes}
              <FontAwesomeIcon icon={faThumbsDown} className="pl-1" />
            </button>
            <button className="text-primary-500 inline whitespace-nowrap">
              {selectedPost.num_comments}
              <FontAwesomeIcon icon={faComments} className="pl-1" />
            </button>

            <span className="flex-grow"></span>

            <button
              className="text-primary-500"
              onClick={() => {
                router.push(`/post/create?remixing=${selectedPost.id}`);
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

          <hr className="border-t border-gray-300 mx-auto w-1/2" />

          <h1 className="mb-2">comments</h1>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[50vh] no-scrollbar">
            <div className="mt-2"></div>
            {selectedPost.comments.length === 0 && (
              <div className="text-text-700 text-center italic">
                no comments yet.
              </div>
            )}
            {selectedPost.comments.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                {comment.profile_pic ? (
                  <img
                    src={comment.profile_pic}
                    alt="profile"
                    className="flex-none rounded-full w-6 h-6 select-none"
                  />
                ) : (
                  <span className="flex-none rounded-full w-6 h-6 bg-primary-600"></span>
                )}
                <div className="flex flex-col flex-grow">
                  <div className="flex justify-between">
                    <span className="text-primary-600 font-medium">
                      {comment.display_name}
                    </span>
                    <span className="text-xs text-text-400 italic">
                      {new Date().toLocaleString('en-US', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </span>
                  </div>
                  <span
                    className={`text-text-800 text-sm flex ${
                      comment.remix ? 'flex-col' : 'justify-between'
                    }`}
                  >
                    {comment.remix ? (
                      <span
                        className="group text-primary-400 font-medium italic bg-background-200 active:bg-background-300 rounded-md cursor-pointer p-2 !border border-background-100 hover:border-primary-600"
                        onClick={() => {
                          // TODO: replace with api call to get post
                          setSelectedPost({
                            id: 11,
                            owner: 4,
                            poster_display_name: 'bob',
                            title: "bob's remix haha",
                            image_content:
                              'https://picsum.photos/600/400?random=1',
                            text_content:
                              'Enjoying the beautiful sights of Paris! remixed!',
                            location_name: 'Eiffel Tower',
                            lat: 48.8584,
                            lng: 2.2945,
                            posted_time: new Date(2021, 5, 15, 10, 30),
                            created: new Date(2021, 5, 16, 11, 45),
                            likes: 9,
                            dislikes: 1,
                            num_comments: 0,
                            remix_of: 7,
                            remix_of_poster_display_name: 'alice',
                            remix_of_poster_profile_pic:
                              'https://picsum.photos/200/200?random=0',
                            remix_of_title: 'Greetings from Paris',
                          });
                        }}
                      >
                        <div className="text-text-500 italic text-right pb-2 font-normal group-hover:text-primary-600">
                          remix
                        </div>
                        <div className="bg-slate-50 p-2 rounded-md flex h-auto flex-col select-none w-fit">
                          <img
                            src={`${selectedPost.image_content}`}
                            alt={selectedPost.title}
                            className="shadow-sm mb-2 self-center max-h-[70vh] h-auto"
                          />
                          <span className="h-4 bg-slate-50 text-black mb-2">
                            {selectedPost.title}
                          </span>
                        </div>
                      </span>
                    ) : (
                      <span className="mt-0.5">{comment.text}</span>
                    )}
                    <div className="flex gap-2 text-sm text-text-400 mt-1">
                      <button className="text-primary-500 inline">
                        {comment.likes || 0}
                        <FontAwesomeIcon icon={faThumbsUp} className="pl-1" />
                      </button>
                      <button className="text-primary-500 inline">
                        {comment.dislikes || 0}
                        <FontAwesomeIcon icon={faThumbsDown} className="pl-1" />
                      </button>
                    </div>
                  </span>
                </div>
              </div>
            ))}
            {selectedPost.comments.length > 0 && (
              <div className="text-text-700 text-center italic py-2">
                you&apos;ve reached the end of the comments section
              </div>
            )}
          </div>
        </div>
      </div>
      <MapModal
        isModalOpen={isMapModalOpen}
        cameraLocation={mapModalLoc}
        handleCloseModal={() => setIsMapModalOpen(false)}
      />
    </Modal>
  ) : (
    <></>
  );
}
