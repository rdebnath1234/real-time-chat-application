export default function OnlineUsers({ users }) {
  return (
    <div className="card sidebar">
      <h3>Online</h3>
      <ul>
        {users.map((u, idx) => (
          <li key={`${u}-${idx}`}>{u}</li>
        ))}
      </ul>
    </div>
  );
}
