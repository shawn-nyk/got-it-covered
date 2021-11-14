import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import TrackSearchResult from "./TrackSearchResult";
import { Container, Button } from "react-bootstrap";
import { DotLoader } from "react-spinners";
import SpotifyWebApi from "spotify-web-api-node";
import "./Dashboard.css";

const spotifyApi = new SpotifyWebApi({
  clientId: "ed975e8c8fad40a68e06fe6fba00554d",
});

export default function Dashboard({ code }) {
  const accessToken = useAuth(code);
  // const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [numSavedAlbums, setNumSavedAlbums] = useState(-1);

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
        console.log(lastOffset);
        if (lastOffset >= 0) {
          console.log("DONE");
          setNumSavedAlbums(lastOffset);
        }
      })
      .catch(() => {
        console.log("AIYO :(");
        getNumSavedAlbums(0);
      });
  };

  useEffect(() => {
    if (!accessToken) return;
    getNumSavedAlbums(0);
  }, [accessToken]);

  // useEffect(() => {
  //   if (!search) return setSearchResults([]);
  //   if (!accessToken) return;

  //   let cancel = false;
  //   spotifyApi
  //     .getMySavedAlbums({
  //       limit: 50,
  //       offset: 0,
  //     })
  //     .then((res) => {
  //       if (cancel) return;
  //       setSearchResults(
  //         res.body.items.map((item) => {
  //           const smallestAlbumImage = item.album.images.reduce(
  //             (smallest, image) => {
  //               if (image.height < smallest.height && image.height >= 160)
  //                 return image;
  //               return smallest;
  //             },
  //             item.album.images[0]
  //           );

  //           return {
  //             artist: item.album.artists[0].name,
  //             title: item.album.name,
  //             uri: item.album.uri,
  //             albumUrl: smallestAlbumImage.url,
  //           };
  //         })
  //       );
  //     });

  //   return () => (cancel = true);
  // }, [search, accessToken]);

  const onClickHandler = () => {
    setShowResult(false);
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
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      {numSavedAlbums >= 0 ? (
        <div className="image-viewer">
          <div className="flex-grow-1 my-2">
            {searchResults.map((track) => (
              <TrackSearchResult
                track={track}
                showResult={showResult}
                key={track.uri}
              />
            ))}
          </div>
          <Button
            className="get-album-btn"
            variant="custom-green"
            onClick={onClickHandler}
          >
            Get An Album
          </Button>
          <Button
            className="show-result-btn"
            variant="custom-grey"
            onClick={showResultHandler}
          >
            Show Result
          </Button>
        </div>
      ) : (
        <div className="loading-page">
          <DotLoader color={"#1db954"} loading={true} size={100} />
          <div className="loading-text">Loading Game</div>
        </div>
      )}
    </Container>
  );
}
