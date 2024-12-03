import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

export type Poi = { key: string; location: google.maps.LatLngLiteral };

export const PoiMarker = (props: { poi: Poi }) => {
  const { poi } = props;

  return (
    <AdvancedMarker key={poi.key} position={poi.location}>
      <Pin
        background={
          getComputedStyle(document.documentElement).getPropertyValue(
            '--primary-500'
          ) || '#000'
        }
        borderColor={
          getComputedStyle(document.documentElement).getPropertyValue(
            '--primary-500'
          ) || '#000'
        }
        glyphColor={'#fff'}
      />
    </AdvancedMarker>
  );
};
