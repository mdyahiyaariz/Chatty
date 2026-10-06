# Chatty

Real-time chat with friends, now with **group conversations** and **profile pictures**.

**Stack:** React 19, TypeScript, Vite, Tailwind 4, React Query, Zustand · Node, Express 5, Socket.IO, MongoDB, Redis.

## What's new
- **Group chats.** Create a group from 2+ friends, with a name and an optional picture. Members see who sent each message, typing indicators name who is typing, unread counts work per member. Admins can rename, change the picture, add friends and remove members. Anyone can leave; if the last admin leaves, the longest-standing member is promoted.
- **Profile and group pictures.** Click the avatar in Profile & settings (or the group dialog) to upload a JPG, PNG or WebP up to 2 MB. People without one get tonal initials instead of a stock placeholder.
- Display name can be changed; changes appear live for everyone you chat with.

## Fixes
- **Anyone logged in could read any conversation's messages.** The messages endpoint now checks membership.
- **Uploads trusted the client.** File type is checked against a whitelist, the stored extension comes from the MIME type (not the file name), and image bytes are verified, so a renamed HTML file can no longer be served from `/uploads`. Uploaded files are no longer committed to git.
- **Online status silently expired after 10 minutes.** Sessions now refresh on activity.
- **Conversation list crashed** if a friendship had no conversation; it now reads conversations directly.
- Accepting a friend request no longer disconnects and reconnects the socket; rooms are joined live.
- Unread counts use atomic increments, so simultaneous messages don't lose counts.
- Added `helmet`, rate limiting on login/register, 100 kb JSON limit, email normalisation, server-side field validation, cookie cleared with matching options on logout, startup check for `JWT_SECRET`, env-based Mongo URI.
- The open conversation is now live state (not a copy), so online dots, member lists and renames stay current.
- Seed data created friendships as `pending`; they are now accepted, and a demo group is included.

## Design
Kept the existing ink / paper / teal palette and Fraunces + Public Sans, and tightened it: squarer corners (6–8 px), hairline rules, a 340 px sidebar, rounded-square avatars for groups vs circles for people, consistent modals with Escape-to-close.

## Run
```bash
docker compose up -d                       # MongoDB + Redis (see backend/docker-compose.yaml)

cd backend && cp .env .env         # set JWT_SECRET
npm install && npm run seed                # optional demo data (john/bob/alice, password: "password")
npm run dev                                # http://localhost:4000

cd ../frontend && cp .env .env
npm install && npm run dev                 # http://localhost:5173
```
Upgrading an existing database? The server drops the old one-chat-per-pair index and tags old conversations as `direct` on start.

## Group API
| Method | Route | Who |
|---|---|---|
| POST | `/api/conversations/groups` `{name, memberIds, avatarUrl?}` | any user, members must be your friends |
| PATCH | `/api/conversations/:id/group` `{name?, avatarUrl?}` | admin |
| POST | `/api/conversations/:id/members` `{memberIds}` | admin |
| DELETE | `/api/conversations/:id/members/:userId` | admin, or yourself to leave |
| GET | `/api/conversations/friends` | friends list for pickers |
| PATCH | `/api/auth/profile` `{fullName?, avatarUrl?}` | yourself |
| POST | `/api/upload/avatar` (multipart `file`) | stores a picture, returns its URL |
