import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import TrackSearchResult from "./TrackSearchResult";
import { Container, Button } from "react-bootstrap";
import { DotLoader } from "react-spinners";
import SpotifyWebApi from "spotify-web-api-node";
import { CSSTransition } from "react-transition-group";
import Popup from "reactjs-popup";
import "./Dashboard.css";

const spotifyApi = new SpotifyWebApi({
  clientId: "ed975e8c8fad40a68e06fe6fba00554d",
});

export default function Dashboard({ code }) {
  const accessToken = useAuth(code);
  const [searchResults, setSearchResults] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [disableRevealBtn, setDisableRevealBtn] = useState(false);
  const [username, setUsername] = useState("");
  const [numPlaylists, setNumPlaylists] = useState(0);
  const [playlistId, setPlaylistId] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [numTracks, setNumTracks] = useState(-1);

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  const getNumTracksInPlaylist = (playlistId, offset) => {
    spotifyApi
      .getPlaylistTracks(playlistId, {
        limit: 50,
        offset: offset,
      })
      .then((res) => {
        if (res.body.items.length === 50) {
          getNumTracksInPlaylist(playlistId, offset + 50);
          return -1;
        }
        return offset + res.body.items.length;
      })
      .then((lastOffset) => {
        if (lastOffset >= 0) {
          setNumTracks(lastOffset);
        }
      });
  };

  const getPlaylists = (usr, offset) => {
    spotifyApi
      .getUserPlaylists(usr, {
        limit: 50,
        offset: offset,
      })
      .then((res) => {
        if (res.body.items.length === 50) {
          getPlaylists(usr, offset + 50);
          return -1;
        }
        return offset + res.body.items.length;
      })
      .then((lastOffset) => {
        if (lastOffset >= 0) {
          setNumPlaylists(lastOffset);
          const randomPlaylistOffset = Math.floor(Math.random() * lastOffset);
          spotifyApi
            .getUserPlaylists(usr, {
              limit: 1,
              offset: randomPlaylistOffset,
            })
            .then((res) => {
              const playlistName = res.body.items[0].name;
              const playlistId = res.body.items[0].id;
              setPlaylistName(playlistName);
              setPlaylistId(playlistId);
              getNumTracksInPlaylist(playlistId, 0);
            });
        }
      })
      .catch(() => {
        getPlaylists(usr, 0);
      });
  };

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.getMe().then((res) => {
      const username = res.body.id;
      setUsername(username);
      getPlaylists(username, 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const onClickHandler = () => {
    setShowResult(false);
    setDisableRevealBtn(false);
    if (!gameStarted) {
      setGameStarted(true);
    }
    const randomTrackOffset = Math.floor(Math.random() * numTracks);
    spotifyApi
      .getPlaylistTracks(playlistId, {
        limit: 1,
        offset: randomTrackOffset,
        fields: "items",
      })
      .then((res) => {
        setSearchResults(
          res.body.items.map((item) => {
            const smallestAlbumImage = item.track.album.images.reduce(
              (smallest, image) => {
                if (image.height < smallest.height && image.height >= 160)
                  return image;
                return smallest;
              },
              item.track.album.images[0]
            );

            let artists = item.track.album.artists[0].name;
            for (const artist of item.track.album.artists.slice(1)) {
              artists += ", " + artist.name;
            }

            return {
              artist: artists,
              title: item.track.album.name,
              uri: item.track.album.uri,
              albumUrl: smallestAlbumImage.url,
            };
          })
        );
      });
  };

  const showResultHandler = () => {
    setShowResult(true);
    setDisableRevealBtn(true);
  };

  const changePlaylistHandler = () => {
    setSearchResults([]);
    setShowResult(false);
    setGameStarted(false);
    setDisableRevealBtn(false);
    setNumTracks(-1);
    const randomPlaylistOffset = Math.floor(Math.random() * numPlaylists);
    spotifyApi
      .getUserPlaylists(username, {
        limit: 1,
        offset: randomPlaylistOffset,
      })
      .then((res) => {
        const playlistName = res.body.items[0].name;
        const playlistId = res.body.items[0].id;
        setPlaylistName(playlistName);
        setPlaylistId(playlistId);
        getNumTracksInPlaylist(playlistId, 0);
      });
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      {numTracks >= 0 ? (
        <div className="dashboard">
          <a className="dashboard-title" href="./" title="Back to main menu">
            GOT IT COVERED
          </a>
          <div className="image-viewer">
            <div className="flex-grow-1 my-2">
              {searchResults.length > 0 ? (
                searchResults.map((track) => (
                  <TrackSearchResult
                    track={track}
                    showResult={showResult}
                    key={track.uri}
                  />
                ))
              ) : (
                <div className="album-placeholder">
                  Get an album
                  <br />
                  below to begin!
                </div>
              )}
            </div>
            <Button
              className="get-album-btn"
              variant="custom-green"
              onClick={onClickHandler}
            >
              {gameStarted ? "Another One" : "Get An Album"}
            </Button>
            <Button
              className="show-result-btn"
              variant="custom-grey"
              onClick={showResultHandler}
              disabled={!gameStarted || disableRevealBtn}
            >
              Reveal Cover
            </Button>
            <Popup
              trigger={
                <Button
                  className="show-result-btn"
                  variant="custom-blue"
                  onClick={showResultHandler}
                >
                  Reveal Playlist
                </Button>
              }
              modal
            >
              <div className="playlist-name">
                <div className="playlist-header">Playlist:</div>
                <div>{playlistName}</div>
              </div>
            </Popup>
            <Button
              className="show-result-btn"
              variant="custom-blue"
              onClick={changePlaylistHandler}
            >
              Change Playlist
            </Button>
          </div>
        </div>
      ) : (
        <div className="loading-page">
          <CSSTransition
            classNames="loading-page-container"
            in={true}
            appear={true}
            timeout={5000}
          >
            <DotLoader
              className="spinner"
              color={"#1db954"}
              loading={true}
              size={90}
            />
          </CSSTransition>
          <div className="loading-text">Knockin' on Spotify's door</div>
        </div>
      )}
    </Container>
  );
}
