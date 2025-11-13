// import { useCallback, useEffect, useMemo, useState } from 'react';
// import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

// const defaultCenter = { lat: 52.52, lng: 13.405 };
// const containerStyle = { width: '100%', height: '320px' };

// function getValidPositions(caregivers) {
//   return caregivers
//     .map((caregiver) => ({
//       id: caregiver.id,
//       name: caregiver.daycareName ?? caregiver.name,
//       address: caregiver.address,
//       position: caregiver.location?.latitude && caregiver.location?.longitude
//         ? { lat: caregiver.location.latitude, lng: caregiver.location.longitude }
//         : null,
//     }))
//     .filter((entry) => entry.position);
// }

// function MapContainer({ caregivers, apiKey }) {
//   const { isLoaded, loadError } = useJsApiLoader({
//     id: 'google-maps-script',
//     googleMapsApiKey: apiKey,
//   });
//   const [mapInstance, setMapInstance] = useState(null);

//   const markers = useMemo(() => getValidPositions(caregivers), [caregivers]);

//   const center = useMemo(() => {
//     if (markers.length > 0) {
//       return markers[0].position;
//     }
//     return defaultCenter;
//   }, [markers]);

//   useEffect(() => {
//     if (!mapInstance || markers.length === 0 || !window.google?.maps) {
//       return;
//     }

//     const bounds = new window.google.maps.LatLngBounds();
//     markers.forEach((marker) => bounds.extend(marker.position));
//     if (!bounds.isEmpty()) {
//       mapInstance.fitBounds(bounds, 64);
//     }
//   }, [mapInstance, markers]);

//   const handleOnLoad = useCallback((map) => {
//     setMapInstance(map);
//   }, []);

//   const handleOnUnmount = useCallback(() => {
//     setMapInstance(null);
//   }, []);

//   if (loadError) {
//     return (
//       <div className="flex h-80 w-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-6 text-sm text-rose-600">
//         Die Karte konnte nicht geladen werden. Bitte überprüfe deinen API-Schlüssel.
//       </div>
//     );
//   }

//   if (!isLoaded) {
//     return <div className="h-80 w-full animate-pulse rounded-2xl bg-brand-100/60" />;
//   }

//   return (
//     <GoogleMap
//       mapContainerStyle={containerStyle}
//       center={center}
//       zoom={12}
//       options={{ disableDefaultUI: true, zoomControl: true, gestureHandling: 'cooperative' }}
//       onLoad={handleOnLoad}
//       onUnmount={handleOnUnmount}
//     >
//       {markers.map((marker) => (
//         <Marker key={marker.id} position={marker.position} title={`${marker.name}\n${marker.address ?? ''}`} />
//       ))}
//     </GoogleMap>
//   );
// }

// function MapView({ caregivers }) {
//   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

//   if (!apiKey) {
//     return (
//       <div className="flex h-80 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-brand-100 bg-white/80 p-6 text-center text-sm text-slate-500">
//         <p>Aktiviere die Google Maps API, um die Live-Karte mit Standorten zu sehen.</p>
//         <p className="text-xs text-slate-400">Setze die Variable VITE_GOOGLE_MAPS_API_KEY in deiner Umgebung.</p>
//       </div>
//     );
//   }

//   return <MapContainer caregivers={caregivers} apiKey={apiKey} />;
// }

// export default MapView;
