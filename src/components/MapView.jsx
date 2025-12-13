import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({ center, zoom = 15, markers = [], circle = null, className = '' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center || [41.0082, 28.9784], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers and circles
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add markers
    markers.forEach((marker) => {
      L.marker([marker.lat, marker.lng])
        .addTo(mapInstanceRef.current)
        .bindPopup(marker.popup || '');
    });

    // Add circle (for geofence)
    if (circle) {
      L.circle([circle.lat, circle.lng], {
        radius: circle.radius,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(circle.popup || 'Geofence');
    }

    // Fit bounds if markers exist
    if (markers.length > 0 || circle) {
      const bounds = [];
      markers.forEach((m) => bounds.push([m.lat, m.lng]));
      if (circle) bounds.push([circle.lat, circle.lng]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, markers, circle]);

  return <div ref={mapRef} className={`w-full h-full rounded-lg ${className}`} style={{ minHeight: '300px' }} />;
};

export default MapView;

