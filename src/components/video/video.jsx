import "./video.css";

function Video({ videoRef }) {
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="video-feed"
    />
  );
}

export default Video;