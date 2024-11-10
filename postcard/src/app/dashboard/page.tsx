"use client";
import { useState, useEffect } from "react";
import "./styles.css";

import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";

import { locations, PoiMarkers } from "./markers";
import Dashboard from "../components/Dashboard/Dashboard";

import { Post } from "../models/post";
import { mockPosts } from "./mockPosts";

export default function Page() {
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [cameraLocation, setCameraLocation] = useState({ lat: 0, lng: 0 });

  // TODO: replace with real data
  const [posts, setPosts] = useState<Post[]>(mockPosts);

  useEffect(() => {
    const resizeMap = () => {
      setMapSize({
        width: window.innerWidth,
        height: window.innerHeight - 48, // subtract header height
      });
    };
    window.addEventListener("resize", resizeMap);
    resizeMap();

    // ask for user location to center map by default
    navigator.geolocation.getCurrentPosition((position) => {
      setCameraLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });

    return () => window.removeEventListener("resize", resizeMap);
  }, []);

  return (
    <>
      <APIProvider
        apiKey={process.env.NEXT_PUBLIC_GMP_API_KEY ?? ""}
        onLoad={() => console.log("Maps API has loaded.")}
      >
        <div
          className="relative inline-block"
          style={{
            width: mapSize.width,
            height: mapSize.height,
            color: "black", // resets text color
          }}
        >
          <Map
            id="postcard-map"
            defaultZoom={
              cameraLocation.lat === 0 && cameraLocation.lng === 0 ? 2 : 5
            }
            defaultCenter={{ lat: cameraLocation.lat, lng: cameraLocation.lng }}
            mapId={process.env.NEXT_PUBLIC_GMP_MAP_ID ?? ""}
            onCameraChanged={(ev: MapCameraChangedEvent) => {
              // TODO: maybe update posts based on map bounds
            }}
            minZoom={2}
            maxZoom={20}
            disableDefaultUI={true}
            disableDoubleClickZoom={true}
            scrollwheel={true}
          >
            <PoiMarkers pois={locations} />
          </Map>
        </div>
        <Dashboard posts={posts} />
      </APIProvider>
    </>
  );
}
