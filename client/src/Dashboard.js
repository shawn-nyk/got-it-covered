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
  const [gameOver, setGameOver] = useState(false);
  const [disableRevealBtn, setDisableRevealBtn] = useState(false);
  const [username, setUsername] = useState("");
  const [numPlaylists, setNumPlaylists] = useState(0);
  const [playlistId, setPlaylistId] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [numTracks, setNumTracks] = useState(-1);
  const [trackOrder, setTrackOrder] = useState([]);
  const [numTracksRemaining, setNumTracksRemaining] = useState(0);
  const [playlistOffset, setPlaylistOffset] = useState(0);
  const [seenAlbumIds, setSeenAlbumIds] = useState(new Set());
  const [isGettingNextAlbum, setIsGettingNextAlbum] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  const shuffle = (array) => {
    let currentIndex = array.length,
      randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  };

  const restartGame = () => {
    setSearchResults([]);
    setShowResult(false);
    setGameStarted(false);
    setGameOver(false);
    setDisableRevealBtn(false);
    setPlaylistId("");
    setPlaylistName("");
    setNumTracks(-1);
    setTrackOrder([]);
    setNumTracksRemaining(0);
    setSeenAlbumIds(new Set());
    setIsGettingNextAlbum(false);
  };

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
        if (lastOffset === 0) {
          window.alert(
            "Oops! Looks like we've selected an empty playlist of yours. Start again to try another one."
          );
          window.location.href = "./";
        }
        if (lastOffset > 0) {
          let trackOrder = [...Array(lastOffset).keys()];
          trackOrder = shuffle(trackOrder);
          setTrackOrder(trackOrder);
          setNumTracks(lastOffset);
          setNumTracksRemaining(lastOffset);
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
        if (lastOffset === 0) {
          window.alert(
            "You don't have any playlists! Create a Spotify playlist to start playing."
          );
          window.location.href = "./";
          return;
        }
        if (lastOffset > 0) {
          setNumPlaylists(lastOffset);
          const randomPlaylistOffset = Math.floor(Math.random() * lastOffset);
          setPlaylistOffset(randomPlaylistOffset);
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

  const onClickHandler = (numTracksRemaining) => {
    setIsGettingNextAlbum(true);
    setShowResult(false);
    setDisableRevealBtn(false);
    if (!gameStarted) {
      setGameStarted(true);
    }
    if (numTracksRemaining === 0) {
      setGameOver(true);
      return;
    }
    setNumTracksRemaining(numTracksRemaining - 1);
    spotifyApi
      .getPlaylistTracks(playlistId, {
        limit: 1,
        offset: trackOrder[numTracks - numTracksRemaining],
        fields: "items",
      })
      .then((res) => {
        const albumId = res.body.items[0].track.album.id;
        if (seenAlbumIds.has(albumId)) {
          onClickHandler(numTracksRemaining - 1);
          return;
        }
        seenAlbumIds.add(albumId);
        setSeenAlbumIds(seenAlbumIds);
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
        setIsGettingNextAlbum(false);
      });
  };

  const showResultHandler = () => {
    setShowResult(true);
    setDisableRevealBtn(true);
  };

  const changePlaylistHandler = () => {
    restartGame();
    let randomPlaylistOffset = Math.floor(Math.random() * numPlaylists);
    if (numPlaylists > 1) {
      while (randomPlaylistOffset === playlistOffset) {
        randomPlaylistOffset = Math.floor(Math.random() * numPlaylists);
      }
    }
    setPlaylistOffset(randomPlaylistOffset);
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
              {gameStarted && !gameOver ? (
                <>
                  {!isGettingNextAlbum &&
                    searchResults.map((track) => (
                      <TrackSearchResult
                        track={track}
                        showResult={showResult}
                        key={track.uri}
                      />
                    ))}
                </>
              ) : (
                <>
                  {gameOver ? (
                    <div className="game-over-text">
                      You've completed <br /> this playlist!
                      <br />
                      <br />
                      Change to another to start a new game!
                    </div>
                  ) : (
                    <div className="album-placeholder">
                      Get an album
                      <br />
                      below to begin!
                    </div>
                  )}
                </>
              )}
            </div>
            <Button
              className="get-album-btn"
              variant="custom-green"
              onClick={() => onClickHandler(numTracksRemaining)}
              disabled={gameOver || isGettingNextAlbum}
            >
              {gameStarted ? "Another One" : "Get An Album"}
            </Button>
            <Button
              className="show-result-btn"
              variant="custom-yellow"
              onClick={showResultHandler}
              disabled={
                !gameStarted ||
                disableRevealBtn ||
                gameOver ||
                isGettingNextAlbum
              }
            >
              Reveal Cover
            </Button>
            <Popup
              trigger={
                <Button
                  className="show-result-btn"
                  variant="custom-grey"
                  onClick={showResultHandler}
                >
                  Reveal Playlist
                </Button>
              }
              modal
            >
              <div className="playlist-popup">
                <div className="playlist-header">Playlist:</div>
                <div>{playlistName}</div>
              </div>
            </Popup>
            <Button
              className="show-result-btn"
              variant="custom-grey"
              onClick={changePlaylistHandler}
            >
              Change Playlist
            </Button>
          </div>
        </div>
      ) : (
        <div className="loading-page">
          <CSSTransition
            classNames="spinner-container"
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
