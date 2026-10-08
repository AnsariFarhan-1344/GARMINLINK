import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

interface StaticMapEmbedProps {
  address: string;
  title?: string;
  className?: string;
  height?: number | string;
  zoom?: number;
}

export const StaticMapEmbed: React.FC<StaticMapEmbedProps> = ({
  address,
  title = 'Location Preview',
  className = '',
  height = 220,
  zoom = 14,
}) => {
  const encodedAddress = encodeURIComponent(address);
  const embedUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  const externalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-earth-200/80 bg-earth-50 shadow-sm ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <iframe
        title={title}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
        className="w-full h-full"
      />
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-earth-800 shadow-md backdrop-blur-sm border border-earth-200/60 hover:bg-earth-100 transition-colors">
        <a
          href={externalMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-terracotta-700 hover:text-terracotta-800"
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>Open in Google Maps</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default StaticMapEmbed;
