import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import { PoiMarker } from './markers';
import { Modal } from 'react-bootstrap';

export default function MapModal(props: {
  isModalOpen: boolean;
  cameraLocation: { lat: number; lng: number };
  handleCloseModal: () => void;
}) {
  const { isModalOpen, cameraLocation, handleCloseModal } = props;
  const [mapLoaded, setMapLoaded] = useState(false);
  const [poi, setPoi] = useState({
    key: 'poi',
    location: { lat: 0, lng: 0 },
  });

  useEffect(() => {
    setPoi({
      key: 'poi',
      location: { lat: cameraLocation.lat, lng: cameraLocation.lng },
    });
  }, [cameraLocation]);

  const POST_DETAILS_MAP_ID = 'post-details-map';

  return (
    <Modal show={isModalOpen} onHide={handleCloseModal} centered>
      <div className="grid bg-background-200 rounded-lg overflow-hidden shadow-md min-h-[50vh] min-w-[50vw]">
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
            }}
          >
            <Map
              style={{
                visibility: mapLoaded ? 'visible' : 'hidden',
              }}
              id={POST_DETAILS_MAP_ID}
              defaultZoom={
                cameraLocation.lat === 0 && cameraLocation.lng === 0 ? 2 : 5
              }
              defaultCenter={{
                lat: cameraLocation.lat,
                lng: cameraLocation.lng,
              }}
              mapId={process.env.NEXT_PUBLIC_GMP_MAP_ID ?? ''}
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
              <PoiMarker poi={poi} />
            </Map>
          </div>
        </APIProvider>
      </div>
    </Modal>
  );
}
