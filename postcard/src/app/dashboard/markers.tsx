import { useCallback, useEffect, useRef, useState } from "react";
import { AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { Marker, MarkerClusterer } from "@googlemaps/markerclusterer";

export type Poi = { key: string; location: google.maps.LatLngLiteral };

// TODO: replace with real data
import { Post } from "../models/post";
import { mockPosts } from "./mockPosts";

export const locations: Poi[] = mockPosts.map((post: Post) => ({
  key: post.id.toString(),
  location: { lat: post.location.lat, lng: post.location.lng },
}));

export const PoiMarkers = (props: { pois: Poi[] }) => {
  const map = useMap("postcard-map");
  const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  // initialize clusterer
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  // update markers when pois change
  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = (marker: Marker | null, key: string) => {
    if (marker && markers[key]) return;
    if (!marker && !markers[key]) return;

    setMarkers((prev) => {
      if (marker) {
        return { ...prev, [key]: marker };
      } else {
        const newMarkers = { ...prev };
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

  // pan to marker on click
  // TODO: pull up post details linked to marker
  const handleClick = useCallback(
    (ev: google.maps.MapMouseEvent) => {
      if (!map) return;
      if (!ev.latLng) return;
      map.panTo(ev.latLng);
    },
    [map]
  );

  return (
    <>
      {props.pois.map((poi: Poi) => (
        <AdvancedMarker
          key={poi.key}
          position={poi.location}
          ref={(marker) => setMarkerRef(marker, poi.key)}
          clickable={true}
          onClick={handleClick}
        >
          <Pin
            background={
              getComputedStyle(document.documentElement).getPropertyValue(
                "--primary-500"
              ) || "#000"
            }
            borderColor={
              getComputedStyle(document.documentElement).getPropertyValue(
                "--primary-500"
              ) || "#000"
            }
            glyphColor={"#fff"}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};
