import React from "react";
import { Pixelify } from "react-pixelify";
import "./TrackSearchResult.css";

export default function TrackSearchResult({ track, showResult }) {
  return (
    <div className="album-info">
      {showResult ? (
        <img
          src={track.albumUrl}
          alt="album cover"
          style={{ width: "300px", height: "300px" }}
        />
      ) : (
        <Pixelify
          src={track.albumUrl}
          pixelSize={30}
          width={300}
          height={300}
        />
      )}
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
