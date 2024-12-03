'use client';
import { useState, useEffect } from 'react';
import './styles.css';

import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';

import { PoiMarkers } from './markers';
import Dashboard from '../components/Dashboard/Dashboard';
import LocateMe from '../components/Dashboard/LocateMe/LocateMe';

import { fromRaw, Post } from '../models/post';

const fetchLimit = 15;

export default function Page() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [cameraLocation, setCameraLocation] = useState({ lat: 0, lng: 0 });

  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch(`/api/posts?limit=${fetchLimit}`).then(async (res) => {
      const p = await res.json();
      console.log('gotten', p);
      const setupPosts = p.map(fromRaw);
      console.log('setup', setupPosts);
      setPosts(setupPosts);
    });
  }, []);

  const DASHBOARD_MAP_ID = 'postcard-map';

  useEffect(() => {
    const resizeMap = () => {
      setMapSize({
        width: window.innerWidth,
        height: window.innerHeight - 48, // subtract header height
      });
    };
    window.addEventListener('resize', resizeMap);
    resizeMap();

    // load default camera location
    if (localStorage.getItem('defaultCamera')) {
      setCameraLocation(
        JSON.parse(
          localStorage.getItem('defaultCamera') ?? '{"lat" : 0, "lng" : 0}'
        )
      );
    }

    return () => window.removeEventListener('resize', resizeMap);
  }, []);

  return (
    <>
      <APIProvider
        apiKey={process.env.NEXT_PUBLIC_GMP_API_KEY ?? ''}
        onLoad={() => console.log('Maps API has loaded.')}
      >
        <div
          className="relative inline-block"
          style={{
            width: mapSize.width,
            height: mapSize.height,
            color: 'initial', // resets text color
          }}
        >
          <Map
            style={{ visibility: mapLoaded ? 'visible' : 'hidden' }}
            id={DASHBOARD_MAP_ID}
            defaultZoom={
              cameraLocation.lat === 0 && cameraLocation.lng === 0 ? 2 : 5
            }
            defaultCenter={{ lat: cameraLocation.lat, lng: cameraLocation.lng }}
            mapId={process.env.NEXT_PUBLIC_GMP_MAP_ID ?? ''}
            onCameraChanged={(ev: MapCameraChangedEvent) => {
              localStorage.setItem(
                'defaultCamera',
                JSON.stringify(ev.detail.center)
              );
              // TODO: maybe update posts based on map bounds
            }}
            minZoom={2}
            maxZoom={20}
            disableDefaultUI={true}
            disableDoubleClickZoom={true}
            scrollwheel={true}
            colorScheme={'FOLLOW_SYSTEM'}
            onTilesLoaded={() => {
              setMapLoaded(true);
            }}
          >
            <PoiMarkers mapId={DASHBOARD_MAP_ID} posts={posts} />
          </Map>
        </div>
        <Dashboard postFetchLimits={fetchLimit} posts={posts} setPosts={setPosts} mapId={DASHBOARD_MAP_ID} />
        <LocateMe mapId={DASHBOARD_MAP_ID} />
      </APIProvider>
    </>
  );
}
