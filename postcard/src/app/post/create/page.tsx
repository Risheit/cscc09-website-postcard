"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { faImage, faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import LocateMe from "@/app/components/Dashboard/LocateMe/LocateMe";

import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import { PoiMarker } from "./marker";
import CreatePostForm from "@/app/components/CreatePostForm/CreatePostForm";
import { useRouter } from "next/navigation";

const SimpleCanvasV2 = dynamic(
  () => import("@/app/components/SimpleCanvasV2/SimpleCanvasV2"),
  {
    ssr: false,
  }
);

export default function Page() {
  const router = useRouter();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isImagePost, setIsImagePost] = useState(true);
  const [cameraLocation, setCameraLocation] = useState({ lat: 0, lng: 0 });

  const [poi, setPoi] = useState({
    key: "poi",
    location: { lat: 0, lng: 0 },
  });

  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    locationName: "",
    title: "",
    textContent: "",
    postedTime: "",
  });

  const CREATE_POST_MAP_ID = "create-post-map";

  const [secondStep, setSecondStep] = useState(false);

  useEffect(() => {
    // load default camera location
    if (localStorage.getItem("defaultCamera")) {
      setCameraLocation(
        JSON.parse(
          localStorage.getItem("defaultCamera") ?? '{"lat" : 0, "lng" : 0}'
        )
      );

      setPoi({
        key: "poi",
        location: JSON.parse(
          localStorage.getItem("defaultCamera") ?? '{"lat" : 0, "lng" : 0}'
        ),
      });
    }
  }, []);

  const submitPost = () => {
    console.log("submitting post...");
    console.log(formData);

    const data = JSON.stringify({
      locationName: formData.locationName,
      title: formData.title,
      textContent: formData.textContent,
      postedTime: formData.postedTime,
      lat: poi.location.lat.toFixed(5),
      lng: poi.location.lng.toFixed(5),
    });

    console.log("Data to be sent: ", data);

    fetch("/api/posts", {
      method: "POST",
      body: data,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Post submitted: ", data);
        router.push("/dashboard");
      });
  };

  return (
    <div className="flex flex-col gap-2 mt-4 w-full max-w-[800px] px-4">
      <h1 className="text-2xl font-bold">Create a Post</h1>

      <p
        className="text-text-500"
        style={{ display: secondStep ? "none" : "block" }}
      >
        Choose between an image post or a text-only post
      </p>
      <div
        className="grid grid-cols-2 gap-4 mb-4"
        style={{ display: secondStep ? "none" : "grid" }}
      >
        <button
          className="flex items-center p-4 bg-background-100 rounded-lg shadow-lg border-2 hover:border-2 text-left"
          style={{
            color: isImagePost ? "var(--text-900)" : "var(--text-700)",
            borderColor: isImagePost ? "var(--text-900)" : "transparent",
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
            color: !isImagePost ? "var(--text-900)" : "var(--text-700)",
            borderColor: !isImagePost ? "var(--text-900)" : "transparent",
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

      <APIProvider
        apiKey={process.env.NEXT_PUBLIC_GMP_API_KEY ?? ""}
        onLoad={() => console.log("Maps API has loaded.")}
      >
        <div
          className="relative inline-block rounded-md overflow-hidden"
          style={{
            width: "100%",
            height: "100%",
            minHeight: "300px",
            color: "initial", // resets text color
            display: secondStep ? "none" : "inline-block",
          }}
        >
          <Map
            style={{
              visibility: mapLoaded ? "visible" : "hidden",
              display: secondStep ? "none" : "block",
            }}
            id={CREATE_POST_MAP_ID}
            defaultZoom={
              cameraLocation.lat === 0 && cameraLocation.lng === 0 ? 2 : 5
            }
            defaultCenter={{
              lat: cameraLocation.lat,
              lng: cameraLocation.lng,
            }}
            mapId={process.env.NEXT_PUBLIC_GMP_MAP_ID ?? ""}
            onCameraChanged={(ev: MapCameraChangedEvent) => {
              localStorage.setItem(
                "defaultCamera",
                JSON.stringify(ev.detail.center)
              );
            }}
            minZoom={2}
            maxZoom={20}
            disableDefaultUI={true}
            disableDoubleClickZoom={true}
            scrollwheel={true}
            colorScheme={"FOLLOW_SYSTEM"}
            onClick={(ev) => {
              if (!ev.detail.latLng) return;
              setPoi({
                key: "poi",
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
          />
        </div>
      </APIProvider>
      <div className="my-4" style={{ display: secondStep ? "none" : "block" }}>
        <span className="font-semibold">Coordinates:</span>{" "}
        <span className="bg-background-200 border border-text-500 rounded px-2 ml-1">
          {poi.location.lat.toFixed(5)}° {poi.location.lat > 0 ? "N" : "S"},{" "}
          {poi.location.lng.toFixed(5)}° {poi.location.lng > 0 ? "W" : "E"}
        </span>
      </div>

      <button
        className="mt-4 p-2 bg-primary-500 rounded flex-none disabled:bg-background-100 disabled:border-background-300 disabled:border"
        disabled={poi.location.lat === 0 && poi.location.lng === 0}
        onClick={() => setSecondStep(true)}
        style={{ display: secondStep ? "none" : "block" }}
      >
        next...
      </button>

      {/* step 2 if image post was selected */}
      <p
        className="text-text-500"
        style={{ display: secondStep ? "block" : "none" }}
      >
        {isImagePost
          ? "Upload an image and customize your postcard"
          : "Write your message without an image postcard"}
      </p>

      <div
        style={{ display: secondStep && isImagePost ? "block" : "none" }}
        className="flex w-full place-items-center"
      >
        <SimpleCanvasV2 file={file} setFile={setFile} />
      </div>

      {secondStep && (
        <CreatePostForm formData={formData} setFormData={setFormData} />
      )}

      <div
        className="grid grid-cols-2 gap-2 mb-12"
        style={{ display: secondStep ? "grid" : "none" }}
      >
        <button
          className="p-2 bg-background-200 rounded flex-none disabled:bg-background-100 disabled:border-background-300 disabled:border"
          onClick={() => {
            setFile(null);
            setFormData({
              locationName: "",
              title: "",
              textContent: "",
              postedTime: "",
            });

            setSecondStep(false);
          }}
        >
          back
        </button>
        <button
          className="p-2 bg-primary-500 rounded flex-none disabled:bg-background-100 disabled:border-background-300 disabled:border"
          disabled={
            formData.locationName === "" ||
            formData.title === "" ||
            formData.textContent === "" ||
            formData.postedTime === ""
          }
          onClick={submitPost}
        >
          post!
        </button>
      </div>
    </div>
  );
  return <></>;
}
