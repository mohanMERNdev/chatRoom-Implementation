CREATE TABLE users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    deviceId VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    availCoins INT NOT NULL,
    isPrimeMember BOOLEAN NOT NULL DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for chat rooms
CREATE TABLE chat_rooms (
    roomId INT AUTO_INCREMENT PRIMARY KEY,
    creatorId INT NOT NULL,
    roomName VARCHAR(255) NOT NULL,
    capacity INT NOT NULL DEFAULT 6,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creatorId) REFERENCES users(userId)
);

-- Create table for messages
CREATE TABLE messages (
    messageId INT AUTO_INCREMENT PRIMARY KEY,
    roomId INT NOT NULL,
    senderId INT NOT NULL,
    text TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roomId) REFERENCES chat_rooms(roomId),
    FOREIGN KEY (senderId) REFERENCES users(userId)
);

-- Create table for friend requests
CREATE TABLE friend_requests (
    requestId INT AUTO_INCREMENT PRIMARY KEY,
    senderId INT NOT NULL,
    receiverId INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES users(userId),
    FOREIGN KEY (receiverId) REFERENCES users(userId)
);
