import BackNavigationLink from "./BackNavigationLink";
import OpenStreetMap from "./OpenStreetMap";
import { ExternalLink, MapPin } from "lucide-react";

type PostLocationMapProps = {
  de: boolean;
  postId: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
};


function osmExternalUrl(label: string, latitude: number | null, longitude: number | null) {
  if (latitude !== null && longitude !== null) return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(label)}`;
}

export default function PostLocationMap({ de, postId, label, latitude, longitude }: PostLocationMapProps) {
  const hasCoordinates = latitude !== null && longitude !== null;
  const externalUrl = osmExternalUrl(label, latitude, longitude);

  return <><div className="mb-3 min-h-11 pr-16"><BackNavigationLink language={de ? "de" : "en"} fallbackHref={`/posts/${postId}`} /></div><section className="overflow-hidden rounded-3xl border border-cyan-300/50 bg-white shadow-xl shadow-slate-200 dark:border-cyan-400/25 dark:bg-slate-900 dark:shadow-black/30">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <div className="min-w-0">
        <p className="inline-flex max-w-full items-center gap-2 text-sm font-black text-cyan-900 dark:text-cyan-100"><MapPin size={17} className="shrink-0"/><span className="truncate">{label}</span></p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hasCoordinates ? (de ? "Post-Standort auf OpenStreetMap" : "Post location on OpenStreetMap") : (de ? "Für diesen Ort wurden keine Koordinaten gespeichert." : "No coordinates were saved for this location.")}</p>
      </div>

    </div>
    {hasCoordinates ? <OpenStreetMap de={de} points={[{ latitude, longitude, label }]}/> : <div className="grid min-h-96 place-items-center bg-[radial-gradient(circle_at_20%_30%,rgba(34,211,238,.16),transparent_28%),linear-gradient(135deg,#0f172a,#082f49)] p-6 text-center text-white">
      <div>
        <MapPin className="mx-auto mb-3 text-cyan-200" size={34}/>
        <p className="text-lg font-black">{label}</p>
        <p className="mt-2 max-w-md text-sm text-cyan-50/80">{de ? "Dieser Beitrag hat nur einen Ortsnamen. Öffne die Suche, um ihn auf OpenStreetMap zu finden." : "This post only has a location name. Open search to find it on OpenStreetMap."}</p>
      </div>
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <span className="text-xs text-slate-500 dark:text-slate-400">OpenStreetMap</span>
      <a href={externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white transition hover:bg-cyan-700"><ExternalLink size={15}/>{hasCoordinates ? (de ? "In OpenStreetMap öffnen" : "Open in OpenStreetMap") : (de ? "Ort suchen" : "Search location")}</a>
    </div>
  </section></>;
}
