// export default function VideoCard({ title, channel, url, reason, onOpen, onLike, onDislike }) {
//   return (
//     <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
//       <h3 style={{ margin: "0 0 6px 0" }}>{title}</h3>
//       <p style={{ margin: "0 0 10px 0", opacity: 0.75 }}>{channel}</p>
//       {reason && <p style={{ margin: "0 0 10px 0" }}>{reason}</p>}

//       <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//         <button type="button" onClick={onOpen}>Open video</button>
//         <button type="button" onClick={onLike}>Like</button>
//         <button type="button" onClick={onDislike}>Dislike</button>
//         <button type="button" onClick={onPlay}>Play here</button>
//       </div>
//     </div>
//   );
// }

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
}) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <div style={{ display: "flex", gap: 12 }}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            style={{ width: 160, height: 90, objectFit: "cover", borderRadius: 8 }}
          />
        ) : null}

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 6px 0" }}>{title}</h3>
          <p style={{ margin: "0 0 8px 0", opacity: 0.75 }}>{channel}</p>
          {reason ? <p style={{ margin: 0 }}>{reason}</p> : null}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={onPlay} disabled={!onPlay}>
          Play here
        </button>

        <button type="button" onClick={onOpen} disabled={!url}>
          Open on YouTube
        </button>

        <button type="button" onClick={onLike} disabled={!onLike}>
          Like
        </button>

        <button type="button" onClick={onDislike} disabled={!onDislike}>
          Dislike
        </button>
      </div>
    </div>
  );
}
