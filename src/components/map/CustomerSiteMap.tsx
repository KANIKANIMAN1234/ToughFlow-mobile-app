"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  APILoadingStatus,
  APIProvider,
  InfoWindow,
  Map,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { CustomerMapPin } from "@/components/map/CustomerMapPin";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
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

function GoogleMapsLoadGate({ children }: { children: React.ReactNode }) {
  const status = useApiLoadingStatus();
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  if (
    status === APILoadingStatus.NOT_LOADED ||
    status === APILoadingStatus.LOADING
  ) {
    return (
      <p className="text-caption text-apple-glyph">地図を読み込んでいます…</p>
    );
  }

  if (
    status === APILoadingStatus.FAILED ||
    status === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">Google マップを読み込めませんでした。</p>
        <p className="text-caption">以下をご確認ください。</p>
        <ul className="list-disc space-y-1 pl-5 text-caption">
          <li>
            Google Cloud の API キー「HTTP リファラー」にこのアプリの URL を追加する
            {origin ? `（例: ${origin}/*）` : ""}
          </li>
          <li>Maps JavaScript API が有効になっているか</li>
          <li>
            Vercel（モバイルプロジェクト）に NEXT_PUBLIC_GOOGLE_MAPS_API_KEY と
            NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID が設定済みか（設定後は再デプロイが必要）
          </li>
        </ul>
      </div>
    );
  }

  return <>{children}</>;
}

function MapResizeHandler() {
  const map = useMap();
  const { mode } = useDisplayMode();

  useEffect(() => {
    if (!map) return;
    const trigger = () => {
      google.maps.event.trigger(map, "resize");
    };
    trigger();
    const timers = [100, 400, 800].map((ms) => window.setTimeout(trigger, ms));
    window.addEventListener("resize", trigger);
    return () => {
      for (const id of timers) window.clearTimeout(id);
      window.removeEventListener("resize", trigger);
    };
  }, [map, mode]);

  return null;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const geocodingLib = useMapsLibrary("geocoding");

  useEffect(() => {
    if (!geocodingLib || markers.length === 0) return;

    let cancelled = false;
    const geocoder = new geocodingLib.Geocoder();

    async function resolveMarkers() {
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

      if (!cancelled) setResolved(next);
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
    <div className="overflow-hidden rounded-xl ring-1 ring-surface-border">
        <Map
          mapId={MAP_ID}
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="h-[min(55vh,420px)] min-h-[320px] w-full"
        >
          <MapResizeHandler />
          <MapBoundsFitter markers={resolved} />
          {resolved.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM_CENTER}
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
    <APIProvider
      apiKey={apiKey}
      language="ja"
      region="JP"
      libraries={["marker", "geocoding"]}
    >
      <GoogleMapsLoadGate>
        <CustomerSiteMap enabled={enabled} />
      </GoogleMapsLoadGate>
    </APIProvider>
  );
}
