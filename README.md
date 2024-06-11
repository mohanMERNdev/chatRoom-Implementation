# chatRoom-Implementation

User Registration and Authentication

Users can register and authenticate using JWT.
During registration, users provide details such as userId, deviceId, name, phone, and availCoins.

Chat Room Creation

Prime members can create chat rooms.
An endpoint (POST /api/chatrooms) is provided for room creation, accessible only to authenticated prime members.
Chat rooms have a maximum capacity of 6 people, and further participants are prevented from joining once the limit is reached.

Inviting Participants

Chat room creators can invite other prime members using a room ID and password.
A secure invitation mechanism is implemented using a token system.
Non-prime members can join one room for free, but subsequent room joins require 150 coins.

Joining a Room as a Non-Prime Member

An endpoint (POST /api/joinroom) allows non-prime members to join a room.
It checks if the user is a prime member and has already joined a room for free. Access is denied if the user lacks sufficient coins.

Chat Functionality

Users within a chat room can send and receive messages in real-time.
WebSocket is implemented for real-time communication (POST /api/messages).

Profile Viewing

Users can view each other's profiles.
An endpoint (GET /api/profile/:userId) is provided for profile retrieval.

Friend Requests

Users can send friend requests to other participants.
Functionality for sending friend requests is implemented (POST /api/friend-requests).
