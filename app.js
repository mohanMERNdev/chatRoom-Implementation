const express = require('express')
const mysql = require('mysql')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const WebSocket = require('ws')
const app = express()
app.use(express.json())
const server = http.createServer(app)
const wss = new WebSocket.Server({server})

const initializeDbAndStartServer = async () => {
  const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '12345678',
    database: 'chatapp',
  })
  db.connect(function (err) {
    if (err) throw err
    console.log('Connected!')
  })
  app.listen(3000, () => {
    console.log('Server Running at http://localhost:3000/')
  })
}

initializeDbAndStartServer()

app.post('/register/', async (request, response) => {
  const {userId, deviceId, name, phone, availCoins} = request.body

  const selectUserQuery = `
    SELECT * FROM user WHERE userId = '${userId}';
    `
  const dbUser = await db.get(selectUserQuery)
  if (dbUser) {
    response.status(400)
    response.send('User already exists')
  } else {
    // Create a new user
    const hashedPassword = await bcrypt.hash(password, 10)
    const addNewUserQuery = `
        INSERT INTO user (userId, password, deviceId, name, phone, availCoins) 
        VALUES ('${userId}', '${deviceId}', '${name}', '${phone}', '${availCoins}');
        `
    await db.run(addNewUserQuery)
    response.send('User created successfully')
  }
})

app.post('/login/', async (request, response) => {
  const {userId, password} = request.body

  const selectUserQuery = `
    SELECT * FROM user WHERE userId = '${userId}';
    `
  const dbUser = await db.get(selectUserQuery)
  if (!dbUser) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (!isPasswordMatched) {
      response.status(400)
      response.send('Invalid password')
    } else {
      const payload = {username}
      const jwtToken = jwt.sign(payload, 'MY_SECRET_KEY')
      response.send({jwtToken})
    }
  }
})

// Authentication Middleware
const authenticateUser = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (!authHeader) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwtToken = authHeader.split(' ')[1]
    jwt.verify(jwtToken, 'MY_SECRET_KEY', (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.userId = payload.userId
        next()
      }
    })
  }
}
let chatRooms = []

app.post('/api/chatrooms', authenticateUser, (request, response) => {
  const {userId} = request.body
  const user = users.find(user => user.userId === userId)
  if (!user || !user.isPrimeMember) {
    return res
      .status(403)
      .json({message: 'Only Prime members can create chat rooms'})
  }

  if (chatRooms.participants.length >= 6)
    return response.status(400).json({message: 'Chat room capacity reached'})

  function generateRoomId(length) {
    var a =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split('')
    var b = []
    for (var i = 0; i < length; i++) {
      var j = (Math.random() * (a.length - 1)).toFixed(0)
      b[i] = a[j]
    }
    return b.join('')
  }

  const generateInvitationToken = () => {
    return Math.random().toString(36).substr(2, 10)
  }

  const roomId = generateRoomId(userId)
  const newRoom = {
    id: roomId,
    participants: [request.user.userId],
    invitationToken: generateInvitationToken(),
  }
  chatRooms.push(newRoom)

  return response
    .status(201)
    .json({message: 'Chat room created successfully', roomId})
})

app.post('/api/chatrooms/join', authenticateUser, (request, response) => {
  const {userId, roomId, invitationToken} = request.body

  const room = chatRooms.find(room => room.id === roomId)

  if (!room) {
    return res.status(404).json({message: 'Chat room not found'})
  }

  if (room.invitationToken !== invitationToken) {
    return res.status(403).json({message: 'Invalid invitation token'})
  }

  const user = users.find(user => user.userId === userId)
  if (!user || (!user.isPrimeMember && user.roomsJoined >= 1)) {
    if (user.availCoins < 150) {
      return res
        .status(403)
        .json({message: 'Insufficient coins to join the room'})
    }
    user.availCoins -= 150
  }

  room.participants.push(userId)
  user.roomsJoined++

  return response
    .status(200)
    .json({message: 'Joined the chat room successfully'})
})

let messages = []
wss.on('connection', ws => {
  ws.send(JSON.stringify(messages))

  ws.on('message', message => {
    const parsedMessage = JSON.parse(message)
    if (parsedMessage.roomId && parsedMessage.text) {
      messages.push(parsedMessage)

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parsedMessage))
        }
      })
    }
  })
})

app.post('/api/messages', (req, res) => {
  const {roomId, text} = req.body
  const message = {roomId, text}
  messages.push(message)

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })

  res.status(201).json({message: 'Message sent successfully'})
})

app.get('/api/profile/:userId', (request, response) => {
  const userId = request.params.userId
  const user = users.find(user => user.userId === userId)
  if (!user) {
    return response.status(404).json({message: 'User not found'})
  } else {
    return response.json(user)
  }
})

app.post('/api/friend-requests', (request, response) => {
  const {senderId, receiverId} = request.body

  const sender = users.find(user => user.userId === senderId)
  const receiver = users.find(user => user.userId === receiverId)
  if (!sender || !receiver) {
    return res.status(404).json({message: 'Sender or receiver not found'})
  }

  if (sender.friends.includes(receiverId)) {
    return res
      .status(400)
      .json({message: 'You are already friends with this user'})
  }

  if (
    friendRequests.some(
      request =>
        request.senderId === senderId && request.receiverId === receiverId,
    )
  ) {
    return res.status(400).json({message: 'Friend request already sent'})
  }

  friendRequests.push({senderId, receiverId})
  return res.status(201).json({message: 'Friend request sent successfully'})
})

module.exports = app
