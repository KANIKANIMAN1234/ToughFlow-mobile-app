"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { CustomerMapPin } from "@/components/map/CustomerMapPin";
import { Card } from "@/components/ui/Card";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import type { MapMarker, ResolvedMapMarker } from "@/lib/map/types";

const MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || "DEMO_MAP_ID";

const DEFAULT_CENTER = { lat: 36.1323, lng: 139.6014 };
const DEFAULT_ZOOM = 10;

function hasCoords(
  marker: MapMarker
): marker is MapMarker & { lat: number; lng: number } {
  return (
    marker.lat != null &&
    marker.lng != null &&
    Number.isFinite(marker.lat) &&
    Number.isFinite(marker.lng)
  );
}

async function geocodeAddress(
  geocoder: google.maps.Geocoder,
  address: string
): Promise<google.maps.LatLngLiteral | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ address, region: "JP" }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        resolve(null);
      }
    });
  });
}

function MapBoundsFitter({ markers }: { markers: ResolvedMapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || markers.length === 0) return;
    if (markers.length === 1) {
      map.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const m of markers) bounds.extend({ lat: m.lat, lng: m.lng });
    map.fitBounds(bounds, 32);
  }, [map, markers]);

  return null;
}

function CustomerSiteMap({ enabled }: { enabled: boolean }) {
  const { data, isLoading, error } = useApi<{ markers: MapMarker[] }>(
    enabled ? "/api/map/markers" : null
  );
  const markers = useMemo(() => data?.markers ?? [], [data?.markers]);
  const [resolved, setResolved] = useState<ResolvedMapMarker[]>([]);
  const [geocodePending, setGeocodePending] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const geocodingLib = useMapsLibrary("geocoding");

  useEffect(() => {
    if (!geocodingLib || markers.length === 0) return;

    let cancelled = false;
    const geocoder = new geocodingLib.Geocoder();

    async function resolveMarkers() {
      setGeocodePending(true);
      const next: ResolvedMapMarker[] = [];

      for (const marker of markers) {
        if (hasCoords(marker)) {
          next.push({ ...marker, lat: marker.lat, lng: marker.lng });
          continue;
        }
        const coords = await geocodeAddress(geocoder, marker.address);
        if (cancelled) return;
        if (coords) next.push({ ...marker, lat: coords.lat, lng: coords.lng });
      }

      if (!cancelled) {
        setResolved(next);
        setGeocodePending(false);
        if (next.length > 0) setSelectedId(next[0].id);
      }
    }

    void resolveMarkers();
    return () => {
      cancelled = true;
    };
  }, [geocodingLib, markers]);

  const selected = resolved.find((m) => m.id === selectedId) ?? null;

  if (isLoading && !data) return <CardListSkeleton />;

  if (error) {
    const detail = error instanceof Error ? error.message : "";
    return (
      <p className="text-caption text-red-600">
        地図データの取得に失敗しました。
        {detail ? `（${detail}）` : ""}
      </p>
    );
  }

  if (markers.length === 0) {
    return (
      <p className="text-caption text-apple-glyph">
        住所が登録された顧客がありません。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl ring-1 ring-surface-border">
        <Map
          mapId={MAP_ID}
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="h-[min(55vh,420px)] w-full"
        >
          <MapBoundsFitter markers={resolved} />
          {resolved.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setSelectedId(marker.id)}
            >
              <CustomerMapPin name={marker.customerName} />
            </AdvancedMarker>
          ))}
          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => setSelectedId(null)}
            >
              <div className="max-w-[220px] space-y-1 text-sm text-gray-900">
                <p className="font-medium">{selected.customerName}</p>
                <p>{selected.address}</p>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>

      <Card title={`現場一覧（${resolved.length}件）`}>
        {geocodePending ? (
          <p className="text-caption text-apple-glyph">位置を取得しています…</p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {resolved.map((marker) => (
              <li key={marker.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(marker.id)}
                  className="flex w-full flex-col gap-0.5 py-3 text-left"
                >
                  <span className="text-caption font-normal text-apple-text">
                    {marker.customerName}
                  </span>
                  <span className="text-nav-link text-apple-glyph">
                    {marker.address}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function CustomerSiteMapRoot({ enabled }: { enabled: boolean }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  if (!apiKey) {
    return (
      <p className="text-caption text-apple-glyph">
        Google Maps API キーが未設定です。
      </p>
    );
  }

  return (
    <APIProvider apiKey={apiKey} language="ja" region="JP">
      <CustomerSiteMap enabled={enabled} />
    </APIProvider>
  );
}
