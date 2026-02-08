export default function OnlineUsers({ users }) {
  return (
    <div className="card sidebar">
      <h3>Online</h3>
      <ul>
        {users.map((u, idx) => (
          <li
            key={`${u}-${idx}`}
            data-initial={(u || "?").trim().charAt(0).toUpperCase()}
          >
            <span className="user-name">{u}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
