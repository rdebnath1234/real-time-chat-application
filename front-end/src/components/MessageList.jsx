import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

export default function MessageList({ messages, meUsername, onEditMessage, onDeleteMessage }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="messages">
      {messages.map((m) => (
        <MessageItem
          key={m.id}
          msg={m}
          meUsername={meUsername}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
