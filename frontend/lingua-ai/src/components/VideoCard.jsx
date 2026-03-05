export default function VideoCard({
  title,
  channel,
  url,
  reason,
  thumbnail,
  onPlay,
  onOpen,
  onLike,
  onDislike,
  liked,
  disliked,
}) {
  return (
    <div className="videoCard">
      <div className="videoTop">
        {thumbnail ? (
          <img className="thumb" src={thumbnail} alt={title} />
        ) : (
          <div className="thumb" />
        )}

        <div>
          <h3 className="videoTitle">{title}</h3>
          <p className="videoMeta">{channel}</p>
          {reason ? <p className="videoReason">{reason}</p> : null}
        </div>
      </div>

      <div className="actions">
        <button className="btn" type="button" onClick={onPlay} disabled={!onPlay}>
          Play here
        </button>

        <button className="btn-ghost" type="button" onClick={onOpen} disabled={!url}>
          Open on YouTube
        </button>

        <button className="btn" type="button" onClick={onLike} disabled={!onLike || disliked}>
          {liked ? "Liked ✓" : "Like"}
        </button>

        <button className="btn" type="button" onClick={onDislike} disabled={!onDislike || liked}>
          {disliked ? "Disliked ✕" : "Dislike"}
        </button>
      </div>
    </div>
  );
}