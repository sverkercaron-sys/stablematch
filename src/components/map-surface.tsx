import Link from "next/link";

import { Facility } from "@/lib/types";

type MapSurfaceProps = {
  facilities: Facility[];
};

const WIDTH = 100;
const HEIGHT = 100;

function project(value: number, min: number, max: number, size: number) {
  if (max === min) {
    return size / 2;
  }

  return ((value - min) / (max - min)) * size;
}

export function MapSurface({ facilities }: MapSurfaceProps) {
  const latitudes = facilities.map((facility) => facility.latitude);
  const longitudes = facilities.map((facility) => facility.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return (
    <section className="mapCard">
      <div className="mapHeader">
        <div>
          <div className="eyebrow">Map view</div>
          <h2>Kartyta för MVP</h2>
        </div>
        <p>
          Punkten nedan visar ungefärlig geografisk spridning. Byt senare till MapLibre genom att
          ersätta den här komponenten med live tiles.
        </p>
      </div>
      <div className="mapCanvas">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Facility map">
          <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="8" className="mapGridBackground" />
          {facilities.map((facility) => {
            const x = project(facility.longitude, minLng, maxLng, WIDTH - 8) + 4;
            const y = HEIGHT - project(facility.latitude, minLat, maxLat, HEIGHT - 8) - 4;

            return (
              <Link key={facility.id} href={`/stall/${facility.slug}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={facility.verified ? "2.4" : "1.8"}
                  className={facility.verified ? "mapPoint verified" : "mapPoint listed"}
                />
              </Link>
            );
          })}
        </svg>
      </div>
      <div className="mapLegend">
        <span className="legendItem">
          <span className="legendDot verified" />
          Verifierad profil
        </span>
        <span className="legendItem">
          <span className="legendDot listed" />
          Auto-listad profil
        </span>
      </div>
    </section>
  );
}
