import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapView({ caregivers }) {
  const center = caregivers.length
    ? [caregivers[0].location?.latitude ?? 52.52, caregivers[0].location?.longitude ?? 13.405]
    : [52.52, 13.405];

  return (
    <MapContainer center={center} zoom={12} className="h-80 w-full rounded-2xl" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {caregivers.map((caregiver) => (
        <Marker
          key={caregiver.id}
          position={[caregiver.location?.latitude ?? center[0], caregiver.location?.longitude ?? center[1]]}
          icon={defaultIcon}
        >
          <Popup>
            <p className="font-semibold">{caregiver.daycareName ?? caregiver.name}</p>
            <p className="text-sm">{caregiver.address}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default MapView;
