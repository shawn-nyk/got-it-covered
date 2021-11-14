import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import TrackSearchResult from "./TrackSearchResult";
import { Container, Button } from "react-bootstrap";
import { DotLoader } from "react-spinners";
import SpotifyWebApi from "spotify-web-api-node";
import { CSSTransition } from "react-transition-group";
import "./Dashboard.css";

const spotifyApi = new SpotifyWebApi({
  clientId: "ed975e8c8fad40a68e06fe6fba00554d",
});

export default function Dashboard({ code }) {
  const accessToken = useAuth(code);
  const [searchResults, setSearchResults] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [numSavedAlbums, setNumSavedAlbums] = useState(-1);
  const [gameStarted, setGameStarted] = useState(false);
  const [disableRevealBtn, setDisableRevealBtn] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  const getNumSavedAlbums = (offset) => {
    spotifyApi
      .getMySavedAlbums({
        limit: 50,
        offset: offset,
      })
      .then((res) => {
        if (res.body.items.length === 50) {
          getNumSavedAlbums(offset + 50);
          return -1;
        }
        return offset + res.body.items.length;
      })
      .then((lastOffset) => {
        if (lastOffset >= 0) {
          setNumSavedAlbums(lastOffset);
        }
      })
      .catch(() => {
        getNumSavedAlbums(0);
      });
  };

  useEffect(() => {
    if (!accessToken) return;
    getNumSavedAlbums(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const onClickHandler = () => {
    setShowResult(false);
    setDisableRevealBtn(false);
    if (!gameStarted) {
      setGameStarted(true);
    }
    const randomOffset = Math.floor(Math.random() * numSavedAlbums);
    spotifyApi
      .getMySavedAlbums({
        limit: 1,
        offset: randomOffset,
      })
      .then((res) => {
        setSearchResults(
          res.body.items.map((item) => {
            const smallestAlbumImage = item.album.images.reduce(
              (smallest, image) => {
                if (image.height < smallest.height && image.height >= 160)
                  return image;
                return smallest;
              },
              item.album.images[0]
            );

            return {
              artist: item.album.artists[0].name,
              title: item.album.name,
              uri: item.album.uri,
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

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      {numSavedAlbums >= 0 ? (
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
              Reveal
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
