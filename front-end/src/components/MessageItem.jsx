import { formatTime } from "../utils/time";
import { formatMessage } from "../utils/formatMessage";

export default function MessageItem({ msg, meUsername, onEditMessage, onDeleteMessage }) {
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
  const readByOthers = (msg.readBy || []).some(
    (u) => String(u).toLowerCase() !== String(meUsername || "").toLowerCase()
  );
  const canModify = isMe && !msg.isDeleted && !readByOthers;

  return (
    <div className={`msg ${isMe ? "me" : ""}`}>
      <div className="meta">
        <strong>{msg.username}</strong>
        <span className="time">
          {time}
          {msg.editedAt ? " (edited)" : ""}
        </span>
      </div>
      <div
        className="text"
        dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
      />
      {isMe ? (
        <div className="msg-actions">
          <button
            type="button"
            className="ghost-btn"
            disabled={!canModify}
            onClick={() => {
              const current = msg.isDeleted ? "" : msg.text;
              const next = prompt("Edit your message:", current);
              if (next === null) return;
              onEditMessage?.(msg.id, next);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="ghost-btn danger"
            disabled={!canModify}
            onClick={() => {
              const confirmed = confirm("Delete this message?");
              if (!confirmed) return;
              onDeleteMessage?.(msg.id);
            }}
          >
            Delete
          </button>
          {!canModify ? <span className="lock-note">Locked after read</span> : null}
        </div>
      ) : null}
    </div>
  );
}
