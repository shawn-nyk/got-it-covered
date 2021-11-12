import React from "react";
import { Pixelify } from "react-pixelify";

export default function TrackSearchResult({ track }) {
  return (
    <div className="d-flex m-2 align-items-center">
      <img
        src={track.albumUrl}
        style={{ height: "64px", width: "64px" }}
        alt="album art"
      />
      <div className="ml-3">
        <div>{track.title}</div>
        <div className="text-muted">{track.artist}</div>
      </div>
      {/* <Pixelify src={track.albumUrl} pixelSize={16} width={160} height={160} /> */}
    </div>
  );
}
