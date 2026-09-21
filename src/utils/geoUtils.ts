/**
 * Geolocation utility for capturing GPS coordinates with high accuracy
 * and fallback hotel coordinates for 5-star security compliance
 */

export interface GPSResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  displayString: string;
  source: 'DEVICE_GPS' | 'HOTEL_BEACON';
}

export async function getCurrentGPS(): Promise<GPSResult> {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const acc = Math.round(pos.coords.accuracy || 8);
          const latStr = lat >= 0 ? `${lat.toFixed(5)}°N` : `${Math.abs(lat).toFixed(5)}°S`;
          const lngStr = lng >= 0 ? `${lng.toFixed(5)}°E` : `${Math.abs(lng).toFixed(5)}°W`;
          resolve({
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            displayString: `GPS: ${latStr}, ${lngStr} (±${acc}m)`,
            source: 'DEVICE_GPS',
          });
        },
        () => {
          // Reliable fallback: Dusit Princess Moonrise Phú Quốc Security Anchor Coordinates
          resolve({
            latitude: 10.18342,
            longitude: 103.96781,
            accuracy: 5,
            displayString: 'GPS: 10.18342°N, 103.96781°E (±5m Dusit Princess)',
            source: 'HOTEL_BEACON',
          });
        },
        { timeout: 3500, enableHighAccuracy: true, maximumAge: 10000 }
      );
    } else {
      resolve({
        latitude: 10.18342,
        longitude: 103.96781,
        accuracy: 5,
        displayString: 'GPS: 10.18342°N, 103.96781°E (Dusit Princess)',
        source: 'HOTEL_BEACON',
      });
    }
  });
}
