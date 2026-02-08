import { formatTime } from "../utils/time";
import { formatMessage } from "../utils/formatMessage";

export default function MessageItem({ msg, meUsername }) {
  const time = formatTime(msg.createdAt);

  if (msg.system) {
    return (
      <div className="msg system">
        <span>{msg.text}</span>
        <span className="time">{time}</span>
      </div>
    );
  }

  const isMe =
    meUsername && msg.username
      ? meUsername.toLowerCase() === msg.username.toLowerCase()
      : false;

  return (
    <div className={`msg ${isMe ? "me" : ""}`}>
      <div className="meta">
        <strong>{msg.username}</strong>
        <span className="time">{time}</span>
      </div>
      <div
        className="text"
        dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
      />
    </div>
  );
}
