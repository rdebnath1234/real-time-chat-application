# Real-Time Chat Application

## Project Title
**Chat Application**

---

## Project Overview
This is a real-time web-based chat application where users can join chat rooms, exchange messages instantly, and interact with other users in a smooth and user-friendly environment.

The project focuses on real-time communication using WebSockets, room management, message persistence, and clean UI design while following proper validation and security practices.

---

## Live Demo

- Frontend: https://frontend-production-7598.up.railway.app
- Backend API: https://backend-production-7bc7.up.railway.app

---

## Technologies Used

### Frontend
- HTML
- CSS
- JavaScript
- React (Vite)

### Backend
- Node.js
- Express.js

### Real-Time Communication
- Socket.io

### Database
- MongoDB
- Mongoose

---

## Key Features

- Join chat using a username (no complex authentication)
- Unique username enforcement within a room
- View available chat rooms
- Create new chat rooms dynamically
- Join existing chat rooms
- Real-time messaging without page refresh
- Sender name and timestamp shown with each message
- Typing indicator for active users
- Messages stored persistently in MongoDB
- Last 50 messages loaded when joining a room
- Online users list per room
- System messages for user join/leave
- Basic message formatting:
  - **Bold**
  - *Italic*
  - Auto-detected clickable links
- Responsive and clean user interface
- Modern, card-based UI with gradient background
- Proper handling of user connect and disconnect events

---

## Screenshots

### 1. Join Chat Form
![Join Chat Form](screenshots/01-join-form.png)

### 2. Create Room Flow
![Create Room Flow](screenshots/02-room-created.png)

### 3. Chat Room (Messages + System Updates)
![Chat Room](screenshots/03-chat-room.png)

### 4. Typing Indicator
![Typing Indicator](screenshots/04-typing-indicator.png)

### 5. Online Users + Message Formatting
![Online Users and Formatting](screenshots/05-online-users-and-formatting.png)

---

## Project Structure

Chat Application/
│
├── back-end/
│ ├── src/
│ │ ├── app.js
│ │ ├── server.js
│ │ ├── config/
│ │ ├── models/
│ │ ├── routes/
│ │ ├── sockets/
│ │ └── utils/
│ └── package.json
│
├── front-end/
│ ├── src/
│ │ ├── components/
│ │ ├── hooks/
│ │ ├── utils/
│ │ ├── App.jsx
│ │ └── main.jsx
│ ├── index.html
│ ├── styles.css
│ └── package.json
│
├── screenshots/
│ ├── 01-join-form.png
│ ├── 02-room-created.png
│ ├── 03-chat-room.png
│ ├── 04-typing-indicator.png
│ └── 05-online-users-and-formatting.png
│
└── README.md

---

## Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

## Environment Variables

### Backend (`back-end/.env`)
PORT=5001
MONGO_URI=mongodb+srv://riyakolkatawb:admin@cluster0.impwc3a.mongodb.net/chat-app?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173

### Frontend (`front-end/.env`)

VITE_API_BASE=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001

---

## How to Run the Project

### Development Mode

#### Start Backend
cd back-end
npm install
PORT=5001 npm run dev

#### Start Frontend
cd front-end
npm install
npm run dev

Open browser at:
http://localhost:5173


---

### Production Mode

#### Build Frontend
cd front-end
npm run build


#### Start Backend
cd back-end
PORT=5001 NODE_ENV=production npm start

Open browser at:
http://localhost:5001

---

## Validation and Security

- Username and room name validated on server-side
- Duplicate usernames prevented within the same room
- Empty messages are blocked
- Message length limits enforced
- Message content sanitized before formatting to prevent XSS
- Only limited and safe formatting allowed

---

## Challenges Faced

- Managing real-time socket connections
- Synchronizing REST APIs with WebSocket events
- Persisting rooms and messages using MongoDB
- Handling user disconnects properly
- Maintaining security with formatted messages

---

## Future Improvements

- JWT-based authentication
- Message pagination
- Private one-to-one chat
- Message edit/delete
- Cloud deployment (Render / Railway / AWS)
- Redis adapter for Socket.io scaling

---

## Author
**Name:** Riya Debnath  
**Project Type:** Academic / Internship / Practice Project
