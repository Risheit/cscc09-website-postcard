'use client';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';

import { faImage, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import LocateMe from '@/app/components/Dashboard/LocateMe/LocateMe';

import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import { PoiMarker } from './marker';
import CreatePostForm from '@/app/components/CreatePostForm/CreatePostForm';
import { useRouter, useSearchParams } from 'next/navigation';
import { Post } from '@/app/models/post';
import dayjs from 'dayjs';

const SimpleCanvasV3 = dynamic(
  () => import('@/app/components/SimpleCanvasV3/SimpleCanvasV3'),
  {
    ssr: false,
  }
);

import { FC } from 'react';

const Page: FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePostPage />
    </Suspense>
  );
};

export default Page;

const CreatePostPage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isImagePost, setIsImagePost] = useState(true);
  const [cameraLocation, setCameraLocation] = useState({ lat: 0, lng: 0 });
  const [canvasState, setCanvasState] = useState<Blob | null>(null);
  const [remixedPost, setRemixedPost] = useState<Post>();
  const [isRemix, setIsRemix] = useState(false);

  const [poi, setPoi] = useState({
    key: 'poi',
    location: { lat: 0, lng: 0 },
  });

  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState({
    locationName: '',
    title: '',
    textContent: '',
    postedTime: '',
  });

  const CREATE_POST_MAP_ID = 'create-post-map';

  const [secondStep, setSecondStep] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // load default camera location
    if (localStorage.getItem('defaultCamera')) {
      setCameraLocation(
        JSON.parse(
          localStorage.getItem('defaultCamera') ?? '{"lat" : 0, "lng" : 0}'
        )
      );

      setPoi({
        key: 'poi',
        location: JSON.parse(
          localStorage.getItem('defaultCamera') ?? '{"lat" : 0, "lng" : 0}'
        ),
      });
    }

    // Load file from remixed post
    const remixId = parseInt(searchParams.get('remixing') ?? '');
    if (!remixId) {
      router.replace('/post/create');
      setIsLoaded(true);
      return;
    }

    fetch(`/api/posts/${remixId}`).then(async (res) => {
      if (!res.ok) {
        router.replace('/post/create');
        setIsLoaded(true);
        return;
      }

      const post: Post = await res.json();
      if (!post.image_content) {
        router.replace('/post/create');
        setIsLoaded(true);
        return;
      }

      setRemixedPost(post);
      setIsRemix(true);
      setIsImagePost(true);
      setSecondStep(true);

      console.log('remixed post', post);
      const imageRes = await fetch(`/api/images/${post.image_content}`);
      const imageBlob = await imageRes.blob();
      setFile(new File([imageBlob], 'remix.png'));
      setCanvasState(imageBlob);

      setData({
        locationName: post.location_name,
        title: post.title,
        textContent: post.text_content ?? '',
        postedTime: dayjs(post.posted_time).format('YYYY-MM-DDTHH:mm'),
      });
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    console.log('state', canvasState);
    console.log('data', data);
  }, [canvasState, data]);

  const submitPost = async () => {
    if (!remixedPost && isRemix) {
      console.error('Remix post not found. Cannot submit this post.');
      return;
    }

    console.log('submitting post...');
    console.log(data);

    const formData = new FormData();
    if (data.textContent) {
      formData.append('textContent', data.textContent);
    }

    if (canvasState) {
      formData.append('image', canvasState);
    }

    formData.append('locationName', data.locationName);
    formData.append('lat', poi.location.lat.toString());
    formData.append('lng', poi.location.lng.toString());
    formData.append('postedTime', data.postedTime);
    formData.append('title', data.title);

    console.log('Data to be sent: ', formData);
    const res = await fetch(`/api/posts/${remixedPost!.id}/comments`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      console.error('Failed to submit post: ', res);
      router.push(`/dashboard`);
      return;
    }

    const post: Post = await res.json();
    console.log('Post submitted: ', post);
    router.push(`/dashboard?post=${post.id}`);
    setIsSubmitted(true);
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col gap-2 mt-4 w-full max-w-[800px] px-4">
      <h1 className="text-2xl font-bold">Create a Post</h1>

      {!isLoaded && (
        <div className="flex justify-center items-center h-full w-full">
          <img
            src="/static/loading.svg"
            alt="loading..."
            className="w-20 h-20 mt-20 opacity-50 select-none"
          />
        </div>
      )}

      {isLoaded && (
        <p
          className="text-text-500"
          style={{ display: secondStep ? 'none' : 'block' }}
        >
          Choose between an image post or a text-only post
        </p>
      )}
      {isLoaded && (
        <div
          className="grid grid-cols-2 gap-4 mb-4"
          style={{ display: secondStep ? 'none' : 'grid' }}
        >
          <button
            className="flex items-center p-4 bg-background-100 rounded-lg shadow-lg border-2 hover:border-2 text-left"
            style={{
              color: isImagePost ? 'var(--text-800)' : 'var(--text-700)',
              borderColor: isImagePost ? 'var(--text-800)' : 'transparent',
            }}
            onClick={() => setIsImagePost(true)}
          >
            <FontAwesomeIcon icon={faImage} className="text-2xl mr-2" />
            <span className="flex flex-col text-left">
              <span>Image Post</span>
              <span className="text-xs text-text-500">
                Upload an image and customize your postcard
              </span>
            </span>
          </button>
          <button
            className="flex items-center p-4 bg-background-100 rounded-lg shadow-lg border-2 hover:border-2"
            style={{
              color: !isImagePost ? 'var(--text-800)' : 'var(--text-700)',
              borderColor: !isImagePost ? 'var(--text-800)' : 'transparent',
            }}
            onClick={() => setIsImagePost(false)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="text-2xl mr-2" />
            <span className="flex flex-col text-left">
              <span>Text-Only Post</span>
              <span className="text-xs text-text-500">
                Write your message without an image postcard
              </span>
            </span>
          </button>
        </div>
      )}

      {isLoaded && (
        <APIProvider
          apiKey={process.env.NEXT_PUBLIC_GMP_API_KEY ?? ''}
          onLoad={() => console.log('Maps API has loaded.')}
        >
          <div
            className="relative inline-block rounded-md overflow-hidden"
            style={{
              width: '100%',
              height: '100%',
              minHeight: '300px',
              color: 'initial', // resets text color
              display: secondStep ? 'none' : 'inline-block',
            }}
          >
            <Map
              style={{
                visibility: mapLoaded ? 'visible' : 'hidden',
                display: secondStep ? 'none' : 'block',
              }}
              id={CREATE_POST_MAP_ID}
              defaultZoom={
                cameraLocation.lat === 0 && cameraLocation.lng === 0 ? 2 : 5
              }
              defaultCenter={{
                lat: cameraLocation.lat,
                lng: cameraLocation.lng,
              }}
              mapId={process.env.NEXT_PUBLIC_GMP_MAP_ID ?? ''}
              onCameraChanged={(ev: MapCameraChangedEvent) => {
                localStorage.setItem(
                  'defaultCamera',
                  JSON.stringify(ev.detail.center)
                );
              }}
              minZoom={2}
              maxZoom={20}
              disableDefaultUI={true}
              disableDoubleClickZoom={true}
              scrollwheel={true}
              colorScheme={'FOLLOW_SYSTEM'}
              onClick={(ev) => {
                if (!ev.detail.latLng) return;
                setPoi({
                  key: 'poi',
                  location: ev.detail.latLng,
                });
              }}
              onTilesLoaded={() => {
                setMapLoaded(true);
              }}
            >
              <PoiMarker poi={poi} />
            </Map>
            <LocateMe
              mapId={CREATE_POST_MAP_ID}
              className="top-0 text-text-900"
              setPoi={setPoi}
            />
          </div>
        </APIProvider>
      )}

      {isLoaded && (
        <div
          className="my-4"
          style={{ display: secondStep ? 'none' : 'block' }}
        >
          <span className="font-semibold">Coordinates:</span>{' '}
          <span className="bg-background-200 border !border-text-500 rounded px-2 ml-1">
            {poi.location.lat.toFixed(5)}° {poi.location.lat > 0 ? 'N' : 'S'},{' '}
            {poi.location.lng.toFixed(5)}° {poi.location.lng > 0 ? 'W' : 'E'}
          </span>
        </div>
      )}

      {isLoaded && (
        <button
          className="mt-4 p-2 bg-primary-500 rounded flex-none disabled:bg-background-100 disabled:!border-background-300 disabled:border"
          disabled={poi.location.lat === 0 && poi.location.lng === 0}
          onClick={() => setSecondStep(true)}
          style={{ display: secondStep ? 'none' : 'block' }}
        >
          next...
        </button>
      )}

      {/* step 2 if image post was selected */}
      {isLoaded && (
        <p
          className="text-text-500"
          style={{ display: secondStep ? 'block' : 'none' }}
        >
          {isImagePost
            ? 'Upload an image and customize your postcard'
            : 'Write your message without an image postcard'}
        </p>
      )}

      <div
        style={{ display: secondStep && isImagePost ? 'flex' : 'none' }}
        className="w-full flex-col place-items-center"
      >
        <SimpleCanvasV3
          file={file}
          setFile={setFile}
          setCanvasState={setCanvasState}
          submitted={isSubmitted}
        />
      </div>

      {isLoaded && secondStep && (
        <CreatePostForm formData={data} setFormData={setData} />
      )}

      {isLoaded && (
        <div
          className="grid grid-cols-2 gap-2 mb-12"
          style={{ display: secondStep ? 'grid' : 'none' }}
        >
          <button
            className="p-2 bg-background-200 rounded flex-auto disabled:bg-background-100 disabled:border"
            onClick={() => {
              if (isRemix) {
                router.push(
                  `/dashboard${remixedPost ? '?post=' + remixedPost.id : ''}`
                );
              } else {
                setFile(null);
                setData({
                  locationName: '',
                  title: '',
                  textContent: '',
                  postedTime: '',
                });
              }
              setSecondStep(false);
            }}
          >
            back
          </button>
          <button
            className="p-2 bg-primary-500 rounded flex-auto disabled:bg-background-100 disabled:border"
            disabled={
              data.locationName === '' ||
              data.title === '' ||
              data.textContent === '' ||
              data.postedTime === ''
            }
            onClick={submitPost}
          >
            post!
          </button>
        </div>
      )}
    </div>
  );
};
