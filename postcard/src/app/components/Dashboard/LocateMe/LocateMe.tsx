import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap } from "@vis.gl/react-google-maps";

export default function LocateMe(props: { mapId: string; className?: string }) {
  const { mapId, className } = props;
  const map = useMap(mapId);

  return (
    <div
      className={"absolute left-0 p-2 z-10 " + (className ?? "")}
      style={{ width: "20px", height: "20px" }}
    >
      <button
        className="bg-background-100 flex whitespace-nowrap px-3"
        onClick={() => {
          navigator.geolocation.getCurrentPosition((position) => {
            const newCameraLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            if (!map) return;
            map.panTo(newCameraLocation);
            map.setZoom(10);
          });
        }}
      >
        <FontAwesomeIcon icon={faLocationCrosshairs} className="pr-2" />
        locate me
      </button>
    </div>
  );
}
