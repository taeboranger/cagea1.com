"use client";

import { GoogleMap, OverlayView, OverlayViewF, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";
import type { Coordinates, RoadtripPhoto } from "@/lib/roadtrip-types";

const center = { lat: 36.3, lng: 127.8 };
const containerStyle = { width: "100%", height: "100%" };
const options: google.maps.MapOptions = {
  mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
  clickableIcons: false, gestureHandling: "cooperative",
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c4d5dc" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f0eee8" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ saturation: -85 }] },
  ],
};
const markerOffset = () => ({ x: -26, y: -58 });

interface Props {
  apiKey: string;
  photos: RoadtripPhoto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  picking: boolean;
  draft: Coordinates | null;
  onPick: (location: Coordinates) => void;
}
export default function RoadtripMap(props: Props) {
  if (!props.apiKey) return <MapMessage>지도 설정이 필요합니다.</MapMessage>;
  return <LoadedMap {...props} />;
}
function MapMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full min-h-80 items-center justify-center bg-paper px-10 text-center text-sm leading-7 text-ink-soft" role="status">{children}</div>;
}
function LoadedMap({ apiKey, photos, selectedId, onSelect, picking, draft, onPick }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({ id: "roadtrip-google-map", googleMapsApiKey: apiKey, language: "ko", region: "KR" });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [authError, setAuthError] = useState(false);
  const located = useMemo(() => photos.filter((photo) => photo.location), [photos]);
  // Photos at the same spot share a marker; all remain selectable in the list.
  const groups = useMemo(() => {
    const result = new Map<string, RoadtripPhoto[]>();
    for (const photo of located) {
      const key = photo.location!.lat.toFixed(4) + "," + photo.location!.lng.toFixed(4);
      result.set(key, [...(result.get(key) ?? []), photo]);
    }
    return [...result.values()];
  }, [located]);
  useEffect(() => {
    const target = window as typeof window & { gm_authFailure?: () => void };
    const previous = target.gm_authFailure;
    target.gm_authFailure = () => setAuthError(true);
    return () => { target.gm_authFailure = previous; };
  }, []);
  useEffect(() => {
    if (!map || !located.length) return;
    const bounds = new google.maps.LatLngBounds();
    located.forEach((photo) => bounds.extend(photo.location!));
    if (located.length === 1) { map.setCenter(located[0].location!); map.setZoom(12); }
    else map.fitBounds(bounds, 70);
  }, [map, located]);
  const selected = photos.find((photo) => photo.id === selectedId);
  useEffect(() => {
    if (selected?.location && map) map.panTo(selected.location);
  }, [map, selected]);
  if (loadError || authError) return <MapMessage>지도를 불러오지 못했습니다.</MapMessage>;
  if (!isLoaded) return <MapMessage>지도 로딩 중…</MapMessage>;

  return <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={7} options={{ ...options, draggableCursor: picking ? "crosshair" : undefined }}
    onLoad={setMap} onUnmount={() => setMap(null)}
    onClick={(event) => { if (picking && event.latLng) onPick(event.latLng.toJSON()); }}>
    {groups.map((group) => {
      const photo = group.find((photo) => photo.id === selectedId) ?? group[0];
      return <OverlayViewF key={group[0].id} position={photo.location!} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={markerOffset} zIndex={photo.id === selectedId ? 2 : 1}>
        <button type="button" onClick={() => onSelect(photo.id)} aria-label={photo.originalName + (group.length > 1 ? " 외 " + (group.length - 1) + "장" : "")}
          className={"relative block h-14 w-14 border-[3px] bg-paper p-0.5 shadow-md transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent " + (photo.id === selectedId ? "border-accent" : "border-white")}>
          {/* Native images avoid an extra optimizer request for tiny map markers. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt="" className="h-full w-full object-cover" />
          {group.length > 1 && <span className="absolute -right-2 -top-2 min-w-5 bg-accent px-1 text-xs leading-5 text-paper">{group.length}</span>}
        </button>
      </OverlayViewF>;
    })}
    {picking && draft && <OverlayViewF position={draft} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <span className="block h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-lg" aria-label="선택한 위치" />
    </OverlayViewF>}
  </GoogleMap>;
}