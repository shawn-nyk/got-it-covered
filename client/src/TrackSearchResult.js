import React from "react";
import { Pixelify } from "react-pixelify";
import "./TrackSearchResult.css";

export default function TrackSearchResult({ track, showResult }) {
  return (
    <div className="album-info">
      <Pixelify
        src={track.albumUrl}
        pixelSize={showResult ? 1 : 30}
        width={300}
        height={300}
      />
      <div className="album-info-text">
        <div className={`album-title ${showResult && "show"}`}>
          {track.title}
        </div>
        <div className={`artist-name ${showResult && "show"}`}>
          {track.artist}
        </div>
      </div>
    </div>
  );
}
