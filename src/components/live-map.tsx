"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import maplibregl, { LngLatBounds } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";

import { Facility } from "@/lib/types";

type LiveMapProps = {
  facilities: Facility[];
};

const defaultCenter: [number, number] = [15.0, 62.0];

function createStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm"
      }
    ]
  } satisfies StyleSpecification;
}

export function LiveMap({ facilities }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const bounds = useMemo(() => {
    if (!facilities.length) {
      return null;
    }

    const nextBounds = new LngLatBounds();
    facilities.forEach((facility) => {
      nextBounds.extend([facility.longitude, facility.latitude]);
    });
    return nextBounds;
  }, [facilities]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createStyle(),
      center: defaultCenter,
      zoom: 4.5
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    facilities.forEach((facility) => {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className = facility.verified ? "mapMarker verified" : "mapMarker listed";
      markerElement.setAttribute("aria-label", facility.name);

      const popupMarkup = `
        <div class="mapPopup">
          <strong>${facility.name}</strong>
          <p>${facility.municipality}, ${facility.region}</p>
          <p>${facility.monthlyPriceSek.toLocaleString("sv-SE")} SEK/mån</p>
          <a href="/stall/${facility.slug}">Visa stallprofil</a>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([facility.longitude, facility.latitude])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(popupMarkup))
        .addTo(map);

      markerElement.addEventListener("click", () => {
        marker.togglePopup();
      });

      markersRef.current.push(marker);
    });

    if (bounds) {
      map.fitBounds(bounds, {
        padding: 48,
        maxZoom: 10,
        duration: 0
      });
    } else {
      map.setCenter(defaultCenter);
      map.setZoom(4.5);
    }
  }, [bounds, facilities]);

  return (
    <section className="mapCard">
      <div className="mapHeader">
        <div>
          <div className="eyebrow">MapLibre</div>
          <h2>Interaktiv kartvy</h2>
        </div>
        <p>
          Första versionen använder MapLibre med OpenStreetMap-tiles. Det räcker för MVP, men bör
          ersättas med egen tile-provider om trafiken växer.
        </p>
      </div>
      <div className="liveMapFrame" ref={containerRef} />
      <div className="mapLegend">
        <span className="legendItem">
          <span className="legendDot verified" />
          Verifierad profil
        </span>
        <span className="legendItem">
          <span className="legendDot listed" />
          Auto-listad profil
        </span>
        {facilities[0] ? (
          <Link className="secondaryLink compactLink" href={`/stall/${facilities[0].slug}`}>
            Testa en stallprofil
          </Link>
        ) : null}
      </div>
    </section>
  );
}
