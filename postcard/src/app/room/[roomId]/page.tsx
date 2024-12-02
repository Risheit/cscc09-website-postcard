'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const RoomCanvas = dynamic(
  () => import('@/app/components/SimpleCanvasV3/RoomCanvas/RoomCanvas'),
  {
    ssr: false,
  }
);

export default function Page({ params }: { params: { roomId: string } }) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/room/images/${params.roomId}`).then(async (res) => {
      if (!res.ok) {
        setError('Failed to fetch image');
        setIsLoading(false);
        return;
      }
      const blob = await res.blob();
      const newFile = new File([blob], 'postcard.png');
      setFile(newFile);
      setIsLoading(false);
    });
  }, [params.roomId]);

  return (
    <div className="flex flex-col gap-2 mt-4 w-full max-w-[800px] px-4">
      <h1 className="text-2xl font-bold">Collaborative Room</h1>
      {isLoading && <p className="text-text-500">Loading...</p>}
      {!isLoading && error ? (
        <p className="text-text-500">
          Oops, the room you are looking for doesn't exist.
        </p>
      ) : (
        !isLoading && (
          <>
            <p className="text-text-500">
              You've joined a collaborative room. Help create a postcard by
              drawing on the canvas below.
            </p>

            <div className="block w-full place-items-center">
              <RoomCanvas file={file} roomId={params.roomId} />
            </div>
          </>
        )
      )}
    </div>
  );
}
