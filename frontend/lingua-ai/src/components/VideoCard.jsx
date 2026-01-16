export default function VideoCard({ title, channel, url, reason, onOpen, onLike, onDislike }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <h3 style={{ margin: "0 0 6px 0" }}>{title}</h3>
      <p style={{ margin: "0 0 10px 0", opacity: 0.75 }}>{channel}</p>
      {reason && <p style={{ margin: "0 0 10px 0" }}>{reason}</p>}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button type="button" onClick={onOpen}>Open video</button>
        <button type="button" onClick={onLike}>Like</button>
        <button type="button" onClick={onDislike}>Dislike</button>
      </div>
    </div>
  );
}
