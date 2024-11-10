"use client";
import { useState, useEffect } from "react";
import "./styles.css";

import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
  useMap,
} from "@vis.gl/react-google-maps";
import { locations, PoiMarkers } from "./markers";
import Dashboard, { Post } from "../components/Dashboard/Dashboard";

const examplePosts: Post[] = [
  {
    id: 1,
    title: "Hello, world!",
    type: "postcard",
    // to an image,
    url: "https://picsum.photos/536/354",
    text: "Hello, world!",
    location: { name: "Sydney Opera House", lat: -33.8567844, lng: 151.213108 },
  },
  {
    id: 2,
    title: "Hello again, world!",
    type: "text",
    text: "Hello, hello!",
    location: {
      name: "",
      lat: 43.6426,
      lng: 79.3871,
    },
  },
  {
    id: 3,
    title: "Hello, world!",
    type: "postcard",
    url: "https://picsum.photos/536/354",
    location: {
      name: "",
      lat: 43.6426,
      lng: 79.3871,
    },
  },
  {
    id: 4,
    title: "Hello again, world!",
    type: "text",
    text: "Hello, hello!",
    location: {
      name: "",
      lat: 43.6426,
      lng: 79.3871,
    },
  },
  {
    id: 5,
    title: "Hello, world!",
    type: "postcard",
    url: "https://picsum.photos/536/354",
    location: {
      name: "",
      lat: 43.6426,
      lng: 79.3871,
    },
  },
  {
    id: 6,
    title: "Hello again, world!",
    type: "text",
    text: "Hello, hello!",
    location: {
      name: "",
      lat: 43.6426,
      lng: 79.3871,
    },
  },
];

export default function Page() {
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });

  const [posts, setPosts] = useState<Post[]>(examplePosts);

  const map = useMap();

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
      setUserLocation({
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
              userLocation.lat === 0 && userLocation.lng === 0 ? 2 : 5
            }
            defaultCenter={{ lat: userLocation.lat, lng: userLocation.lng }}
            mapId={process.env.NEXT_PUBLIC_GMP_MAP_ID ?? ""}
            onCameraChanged={(ev: MapCameraChangedEvent) =>
              console.log(
                "camera changed.",
                ev.detail.center,
                "zoom:",
                ev.detail.zoom
              )
            }
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
