import React from "react";
import { Button } from "react-bootstrap";
import "./Login.css";

const AUTH_URL =
  "https://accounts.spotify.com/authorize?client_id=ed975e8c8fad40a68e06fe6fba00554d&response_type=code&redirect_uri=https://got-it-covered.netlify.app/&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state";

export default function Login() {
  return (
    <div className="login-page" style={{ minHeight: "100vh" }}>
      <div className="title">GOT IT COVERED</div>
      <div className="subtitle">The album cover guessing game</div>
      <div className="extras">
        See if you can recognise these pixelated album covers
        <br />
        from your Spotify saved albums
      </div>
      <div className="extras" style={{ fontWeight: 500 }}>
        Click below to play!
      </div>
      <Button className="launch-button" variant="custom-green" href={AUTH_URL}>
        Login with Spotify
      </Button>
    </div>
  );
}
