# BLOCK: Gerçek Zamanlı Mesajlaşma Uygulaması

## 1. Genel Bakış
BLOCK, kullanıcıların gerçek zamanlı olarak mesajlaşabildiği, hem genel kanalları hem de özel mesajlaşmayı destekleyen modern bir web uygulamasıdır. Uygulama, kullanıcı dostu arayüzü, hızlı yanıt süresi ve güvenli iletişim özellikleriyle öne çıkar.

## 2. Hedefler ve Amaçlar
- Kullanıcıların hızlı ve kesintisiz iletişim kurmasını sağlamak
- Kullanıcı dostu ve modern bir arayüz sunmak
- Güvenli mesajlaşma ortamı sağlamak
- Grup ve özel mesajlaşma desteği sunmak

## 3. Hedef Kullanıcılar
- Sadece databaseye eklenen kullanıcılar

## 4. Özellikler
### Temel Özellikler (MVP)
- Kullanıcı kaydı ve girişi
- Genel mesaj kanalları
- Mesajların kaybolmaması
- Özel mesajlaşma
- Profil yönetimi
- Mesaj bildirimleri
- Çevrimiçi/çevrimdışı durumu
- Kanal oluşturma

## 5. Teknik Gereksinimler

### Frontend (Tamamı Ücretsiz, Açık Kaynak)
- **Framework**: Next.js, React - Açık kaynak ve ücretsiz
- **Stil**: Tailwind CSS - Açık kaynak ve ücretsiz
- **Bileşen Kitaplığı**: Shadcn UI - Açık kaynak ve ücretsiz
- **State Yönetimi**: React Hooks & Context API - Ücretsiz
- **Dil**: TypeScript - Açık kaynak ve ücretsiz

### Backend (Tamamı Ücretsiz, Açık Kaynak)
- **Framework**: Node.js (Express.js veya NestJS) - Açık kaynak ve ücretsiz
- **Gerçek Zamanlı İletişim**: Socket.io - Açık kaynak ve ücretsiz
- **Veritabanı**: MongoDB - Açık kaynak ve ücretsiz (topluluk sürümü)
- **Önbellek**: Redis - Açık kaynak ve ücretsiz
- **Kimlik Doğrulama**: JWT - Açık kaynak ve ücretsiz
- **API Mimarisi**: RESTful API + WebSockets - Ücretsiz standartlar

### Altyapı
- **Barındırma**: VDS (Virtual Dedicated Server) - Sadece hosting maliyeti
- **Deployment**: Docker & CI/CD Pipeline - Açık kaynak ve ücretsiz
- **CDN**: Cloudflare (isteğe bağlı) - Ücretsiz plan mevcut
- **Medya Depolama**: Local veya S3-compatible storage - Açık kaynak alternatifler mevcut (MinIO)

## 6. Kullanıcı Hikayeleri

1. **Kullanıcı Kaydı ve Profil**
   - Kullanıcı kayıt olamaz sadece giriş ekranı var. Kullanıcıların bilgileri database'de tutuluyor.
   - Kullanıcı profilini düzenleyebilir (isim, avatar, durum mesajı)
   - Kullanıcı çevrimiçi/çevrimdışı durumunu ayarlayabilir

2. **Mesajlaşma**
   - Kullanıcı genel kanallarda mesaj gönderebilir
   - Kullanıcı özel mesaj gönderebilir
   - Kullanıcı okunmamış mesajları görüntüleyebilir
   - Kullanıcı yeni mesaj bildirimleri alabilir

3. **Kanallar ve Gruplar**
   - Kullanıcı mevcut kanallara katılabilir
   - Kullanıcı yeni kanallar oluşturabilir
   - Kullanıcı kanal ayarlarını düzenleyebilir (yetkiliyse)

## 7. Teknik Mimari

### Veri Modeli
#### Kullanıcılar (Users)
```
{
  _id: ObjectId,
  username: String,          // Benzersiz kullanıcı adı
  email: String,             // Benzersiz e-posta
  password: String,          // Hash'lenmiş şifre
  displayName: String,       // Görünen ad
  avatar: String,            // Avatar URL
  status: String,            // "online", "offline"
  lastSeen: Date,            // Son görülme
  createdAt: Date,           // Oluşturulma tarihi
  updatedAt: Date            // Güncellenme tarihi
}
```

#### Kanallar (Channels)
```
{
  _id: ObjectId,
  name: String,              // Kanal adı
  description: String,       // Kanal açıklaması
  createdBy: ObjectId,       // Oluşturan kullanıcı ID
  type: String,              // "public", "private"
  members: [ObjectId],       // Üye kullanıcı ID'leri
  admins: [ObjectId],        // Yönetici kullanıcı ID'leri
  createdAt: Date,           // Oluşturulma tarihi
  updatedAt: Date            // Güncellenme tarihi
}
```

#### Mesajlar (Messages)
```
{
  _id: ObjectId,
  channelId: ObjectId,       // Kanal ID veya null (DM için)
  senderId: ObjectId,        // Gönderen kullanıcı ID
  receiverId: ObjectId,      // Alıcı kullanıcı ID (DM için)
  content: String,           // Mesaj içeriği
  attachments: [String],     // Ekli dosya URL'leri
  readBy: [ObjectId],        // Mesajı okuyan kullanıcı ID'leri
  createdAt: Date,           // Oluşturulma tarihi
  updatedAt: Date            // Güncellenme tarihi
}
```

#### Okunmamış Mesajlar (Unread)
```
{
  _id: ObjectId,
  userId: ObjectId,          // Kullanıcı ID
  channelId: ObjectId,       // Kanal ID veya null
  senderId: ObjectId,        // Gönderen kullanıcı ID (DM için)
  count: Number,             // Okunmamış mesaj sayısı
  lastMessageAt: Date        // Son mesaj tarihi
}
```

### API Endpoints

#### Kimlik Doğrulama (Auth)
- `POST /api/auth/login`: Kullanıcı girişi
  ```
  // Request
  {
    "username": "enes",
    "password": "enesdemirezen"
  }
  
  // Response
  {
    "success": true,
    "message": "Login successful",
    "token": "JWT_TOKEN",
    "user": {
      "id": "USER_ID",
      "username": "enes",
      "displayName": "Enes Demirezen",
      "avatar": "/avatar/enes.jpg",
      "status": "online"
    }
  }
  ```

- `GET /api/auth/me`: Mevcut kullanıcıyı getir
  ```
  // Response
  {
    "id": "USER_ID",
    "username": "enes",
    "displayName": "Enes Demirezen",
    "avatar": "/avatar/enes.jpg",
    "status": "online"
  }
  ```

- `POST /api/auth/logout`: Çıkış yap
  ```
  // Response
  {
    "success": true,
    "message": "Logout successful"
  }
  ```

#### Kullanıcılar (Users)
- `GET /api/users`: Tüm kullanıcıları getir
- `GET /api/users/:id`: Belirli bir kullanıcıyı getir
- `PATCH /api/users/:id`: Kullanıcı bilgilerini güncelle
  ```
  // Request
  {
    "displayName": "Enes D.",
    "status": "offline"
  }
  
  // Response
  {
    "success": true,
    "user": {
      "id": "USER_ID",
      "username": "enes",
      "displayName": "Enes D.",
      "avatar": "/avatar/enes.jpg",
      "status": "offline"
    }
  }
  ```

#### Kanallar (Channels)
- `GET /api/channels`: Kullanıcının kanallarını getir
- `GET /api/channels/:id`: Belirli bir kanalı getir
- `POST /api/channels`: Yeni kanal oluştur
  ```
  // Request
  {
    "name": "Proje Ekibi",
    "description": "Proje ekibi iletişim kanalı"
  }
  
  // Response
  {
    "success": true,
    "channel": {
      "id": "CHANNEL_ID",
      "name": "Proje Ekibi",
      "description": "Proje ekibi iletişim kanalı",
      "type": "public",
      "createdAt": "2023-03-07T12:00:00Z"
    }
  }
  ```
- `PATCH /api/channels/:id`: Kanal bilgilerini güncelle
- `DELETE /api/channels/:id`: Kanalı sil

#### Mesajlar (Messages)
- `GET /api/messages?channelId=CHANNEL_ID`: Kanal mesajlarını getir
- `GET /api/messages?senderId=SENDER_ID&receiverId=RECEIVER_ID`: DM mesajlarını getir
- `POST /api/messages`: Yeni mesaj gönder
  ```
  // Request (Kanal mesajı)
  {
    "channelId": "CHANNEL_ID",
    "content": "Merhaba, nasılsınız?"
  }
  
  // Request (DM)
  {
    "receiverId": "RECEIVER_ID",
    "content": "Merhaba, nasılsın?"
  }
  
  // Response
  {
    "success": true,
    "message": {
      "id": "MESSAGE_ID",
      "channelId": "CHANNEL_ID", // veya null
      "senderId": "SENDER_ID",
      "receiverId": "RECEIVER_ID", // veya null
      "content": "Merhaba, nasılsınız?",
      "createdAt": "2023-03-07T12:30:00Z"
    }
  }
  ```
- `DELETE /api/messages/:id`: Mesajı sil

#### Okunmamış Mesajlar (Unread)
- `GET /api/unread`: Kullanıcının okunmamış mesajlarını getir
- `POST /api/unread/read`: Mesajları okundu olarak işaretle
  ```
  // Request
  {
    "channelId": "CHANNEL_ID" // veya 
    "senderId": "SENDER_ID"
  }
  
  // Response
  {
    "success": true,
    "message": "Messages marked as read"
  }
  ```

### WebSocket Events

#### Bağlantı (Connection)
- `connect`: Kullanıcı bağlandığında
- `disconnect`: Kullanıcı bağlantısı kesildiğinde

#### Kullanıcı Durumu (Status)
- `status:update`: Kullanıcı durumu güncellendiğinde
  ```
  {
    "userId": "USER_ID",
    "status": "online" // veya "offline"
  }
  ```

#### Mesajlaşma (Messaging)
- `message:new`: Yeni mesaj gönderildiğinde
  ```
  {
    "id": "MESSAGE_ID",
    "channelId": "CHANNEL_ID", // veya null
    "senderId": "SENDER_ID",
    "receiverId": "RECEIVER_ID", // veya null
    "content": "Merhaba, nasılsınız?",
    "createdAt": "2023-03-07T12:30:00Z"
  }
  ```
- `message:typing`: Kullanıcı yazıyor durumunda
  ```
  {
    "userId": "USER_ID",
    "channelId": "CHANNEL_ID", // veya null
    "receiverId": "RECEIVER_ID" // veya null
  }
  ```
- `message:read`: Mesaj okunduğunda
  ```
  {
    "messageId": "MESSAGE_ID",
    "userId": "USER_ID"
  }
  ```

#### Kanallar (Channels)
- `channel:new`: Yeni kanal oluşturulduğunda
- `channel:update`: Kanal güncellendiğinde
- `channel:delete`: Kanal silindiğinde

## 8. Backend Uygulama Mimarisi

### Klasör Yapısı
```
/backend
├── /src
│   ├── /config          # Yapılandırma dosyaları
│   │   ├── db.js        # MongoDB bağlantısı
│   │   ├── redis.js     # Redis bağlantısı
│   │   └── socket.js    # Socket.io yapılandırması
│   ├── /controllers     # API endpoint kontrolörleri
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── channels.js
│   │   └── messages.js
│   ├── /middlewares     # Express middlewares
│   │   ├── auth.js      # JWT doğrulama
│   │   ├── error.js     # Hata işleme
│   │   └── validate.js  # Girdi doğrulama
│   ├── /models          # MongoDB modelleri
│   │   ├── user.js
│   │   ├── channel.js
│   │   ├── message.js
│   │   └── unread.js
│   ├── /routes          # API rotaları
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── channels.js
│   │   └── messages.js
│   ├── /services        # İş mantığı servisleri
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── channels.js
│   │   └── messages.js
│   ├── /sockets         # Socket.io olay işleyicileri
│   │   ├── connection.js
│   │   ├── status.js
│   │   ├── messages.js
│   │   └── channels.js
│   ├── /utils           # Yardımcı işlevler
│   │   ├── jwt.js       # JWT üretimi ve doğrulama
│   │   ├── passwords.js # Şifre hash'leme
│   │   └── logger.js    # Loglama
│   ├── app.js           # Express uygulaması
│   └── server.js        # Ana sunucu dosyası
├── .env                 # Ortam değişkenleri
├── .gitignore
├── package.json
└── README.md
```

### MongoDB Kurulum ve Yapılandırma

#### MongoDB'yi VDS'e Kurma (Ubuntu)
```bash
# MongoDB repo anahtarını ekle
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# MongoDB repo'sunu ekle (Ubuntu 22.04 için)
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Paketleri güncelle
sudo apt-get update

# MongoDB'yi yükle
sudo apt-get install -y mongodb-org

# MongoDB servisini başlat
sudo systemctl start mongod

# Sistem başlangıcında otomatik başlatılmasını sağla
sudo systemctl enable mongod
```

#### MongoDB Güvenlik Yapılandırması
```bash
# MongoDB yapılandırma dosyasını düzenle
sudo nano /etc/mongod.conf

# Yapılandırma dosyasında şu değişiklikleri yap:
# net:
#   port: 27017
#   bindIp: 127.0.0.1  # Sadece yerel erişim
# security:
#   authorization: "enabled"  # Kimlik doğrulamayı etkinleştir

# MongoDB'yi yeniden başlat
sudo systemctl restart mongod
```

#### Admin Kullanıcısı Oluşturma
```bash
# MongoDB shell'i başlat
mongosh

# Admin veritabanını seç
use admin

# Admin kullanıcısı oluştur
db.createUser(
  {
    user: "blockAdmin",
    pwd: "guvenliSifre123",  # Güçlü bir şifre kullanın
    roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
  }
)

# Çıkış yap
exit
```

#### Uygulama için Veritabanı ve Kullanıcı Oluşturma
```bash
# MongoDB shell'i admin olarak başlat
mongosh --authenticationDatabase "admin" -u "blockAdmin" -p "guvenliSifre123"

# BLOCK uygulaması için veritabanı oluştur
use blockApp

# Uygulama için kullanıcı oluştur
db.createUser(
  {
    user: "blockAppUser",
    pwd: "appSifresi123",  # Güçlü bir şifre kullanın
    roles: [ { role: "readWrite", db: "blockApp" } ]
  }
)

# Temel koleksiyonları oluştur
db.createCollection("users")
db.createCollection("channels")
db.createCollection("messages")
db.createCollection("unread")

# İlk kullanıcıyı ekle
db.users.insertOne({
  username: "enes",
  email: "enes@example.com",
  password: "$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",  # bcrypt ile hash'lenmiş "enesdemirezen"
  displayName: "Enes Demirezen",
  avatar: "/placeholder.svg?height=40&width=40&text=E",
  status: "offline",
  lastSeen: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
})

# Varsayılan kanalları oluştur
db.channels.insertOne({
  name: "Genel Sohbet",
  description: "Herkes için genel sohbet kanalı",
  type: "public",
  members: [],  # Boş bırakarak tüm kullanıcıların erişebilmesini sağla
  admins: [],   # Boş bırakarak tüm kullanıcıların yönetici olmasını sağla
  createdAt: new Date(),
  updatedAt: new Date()
})

# Çıkış yap
exit
```

### Backend Kodu Örneği (Ana Dosyalar)

#### .env Dosyası
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://blockAppUser:appSifresi123@localhost:27017/blockApp
REDIS_URI=redis://localhost:6379
JWT_SECRET=cok_gizli_jwt_anahtari
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

#### server.js (Ana Giriş Noktası)
```javascript
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./config/socket');
const { connectToDatabase } = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// HTTP sunucusu oluştur
const server = http.createServer(app);

// Socket.io'yu başlat
initializeSocket(server);

// Veritabanına bağlan ve sunucuyu başlat
connectToDatabase()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Database connection failed', error);
    process.exit(1);
  });

// Beklenmeyen hataları yakala
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  // Uygulamayı temiz bir şekilde kapat
  server.close(() => process.exit(1));
});
```

#### app.js (Express Uygulaması)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const unreadRoutes = require('./routes/unread');

const errorMiddleware = require('./middlewares/error');

const app = express();

// Güvenlik middleware'leri
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // her IP için 15 dakikada 100 istek
});
app.use('/api/', limiter);

// Loglama
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Girdi işleme
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API rotaları
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/unread', unreadRoutes);

// 404 - Bulunamadı
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found - ${req.originalUrl}`
  });
});

// Hata işleyici
app.use(errorMiddleware);

module.exports = app;
```

#### config/db.js (MongoDB Bağlantısı)
```javascript
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectToDatabase = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = { connectToDatabase };
```

#### config/socket.js (Socket.io Yapılandırması)
```javascript
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const logger = require('../utils/logger');

// Socket.io işleyicileri
const connectionHandler = require('../sockets/connection');
const statusHandler = require('../sockets/status');
const messageHandler = require('../sockets/messages');
const channelHandler = require('../sockets/channels');

let io;

// Socket.io'yu başlat
const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // JWT kimlik doğrulama middleware'i
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Kullanıcıyı bul
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Socket nesnesine kullanıcı ID'sini ekle
      socket.userId = user._id;
      socket.username = user.username;
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Soket bağlantısı
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId}`);
    
    // Tüm soketten gelen event'ları ilgili işleyicilere yönlendir
    connectionHandler(io, socket);
    statusHandler(io, socket);
    messageHandler(io, socket);
    channelHandler(io, socket);
    
    // Bağlantı kesildiğinde
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Soket örneğini getir
const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIo };
```

### Frontend-Backend Entegrasyonu

#### Frontend'den API İstekleri
```javascript
// api.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Giden isteklere token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gelen cevapları işle
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 401 hatasında kullanıcıyı login sayfasına yönlendir
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### Frontend'den Socket.io Bağlantısı
```javascript
// socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket;

export const initializeSocket = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return null;
  }

  // Soket bağlantısını oluştur
  socket = io(SOCKET_URL, {
    auth: {
      token
    }
  });

  // Bağlantı olaylarını dinle
  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

## 9. Güvenlik Gereksinimleri
- HTTPS bağlantısı zorunluluğu
- Şifrelerin bcrypt ile güvenli bir şekilde hashlenmesi
- JWT tabanlı kimlik doğrulama
- Rate limiting
- Input validation (Joi veya express-validator ile)
- CSRF ve XSS koruması
- Helmet ile HTTP güvenlik başlıkları
- MongoDB enjeksiyon koruması

## 10. Performans Gereksinimleri
- Sayfa yüklenme süresi < 2 saniye
- Mesaj iletim gecikmesi < 500ms
- 1000+ eşzamanlı kullanıcıyı destekleme
- MongoDB indeksleri ile sorgu optimizasyonu
- Redis ile önbellek kullanımı
- 99.9% uptime

## 11. Deployment Süreci

### VDS Ortamı Hazırlama
1. Ubuntu Server 22.04 LTS kurulumu
2. Güvenlik güncellemeleri ve temel paketlerin yüklenmesi
3. Node.js, MongoDB, Redis, Nginx kurulumu
4. Güvenlik duvarı (UFW) yapılandırması
5. Let's Encrypt ile SSL sertifikası edinme

### Backend Deployment
1. GitHub'dan projeyi klonlama
2. Bağımlılıkları yükleme (`npm install --production`)
3. Ortam değişkenlerini ayarlama (`.env` dosyası)
4. MongoDB veritabanı ve kullanıcı oluşturma
5. PM2 ile Node.js uygulamasını çalıştırma ve izleme

### Frontend Deployment
1. Next.js uygulamasını build etme (`npm run build`)
2. Statik dosyaları Nginx ile sunma
3. Nginx'i API ve WebSocket isteklerini backend'e yönlendirecek şekilde yapılandırma





## 13. Kaynaklar ve Dökümantasyon

### Teknik Dökümantasyon
- [Express.js](https://expressjs.com/)
- [Socket.io](https://socket.io/docs/)
- [MongoDB](https://docs.mongodb.com/)
- [Mongoose](https://mongoosejs.com/docs/)
- [JWT](https://jwt.io/introduction)
- [Next.js](https://nextjs.org/docs)

### Yardımcı Kütüphaneler
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Şifre hash'leme
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - JWT oluşturma ve doğrulama
- [joi](https://joi.dev/api/) - Veri doğrulama
- [helmet](https://helmetjs.github.io/) - HTTP güvenlik başlıkları
- [cors](https://github.com/expressjs/cors) - CORS yönetimi
- [morgan](https://github.com/expressjs/morgan) - HTTP istek loglama
- [winston](https://github.com/winstonjs/winston) - Loglama
