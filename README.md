# loc-mp-ui — Районный

Фронтенд гиперлокального маркетплейса **«Районный»**. SPA на Vite + React + TypeScript, подключается к бэкенду [LocalMarketplace](https://github.com/LocMp-olegg/LocalMarketplace) через API Gateway.

> ВКР, 2026.

---

## Стек

| Слой | Технология |
|---|---|
| Сборка | Vite 8 |
| UI | React 19 + TypeScript 6 |
| Роутинг | react-router-dom v7 |
| Анимации | framer-motion |
| Стили | Tailwind CSS v4 (без конфиг-файла) |
| Карусель | embla-carousel-react |
| Карты | react-leaflet + leaflet |
| Графики | recharts |
| Дата | react-day-picker + date-fns |
| Кроппер фото | react-easy-crop |
| Примитивы UI | @radix-ui/react-popover, @radix-ui/react-slot |
| Иконки | lucide-react |
| Real-time | @microsoft/signalr (WebSocket) |

---

## Требования

- Node.js 20+
- npm 10+
- Запущенный бэкенд (`docker compose up -d` из `../LocalMarketplace`)

---

## Быстрый старт

```bash
# Установить зависимости
npm install

# Сгенерировать API-клиенты из Swagger-спецификаций
npm run generate:api

# Запустить dev-сервер
npm run dev
```

Приложение будет доступно на [http://localhost:5173](http://localhost:5173).

---

## Переменные окружения

| Переменная | Где нужна | Назначение |
|---|---|---|
| `VITE_DADATA_KEY` | dev + Docker | API-ключ [DaData](https://dadata.ru) — подсказки адресов и геокодирование |
| `VITE_DADATA_SECRET` | dev + Docker | Секретный ключ DaData |

Без ключей DaData адресные поля и карта работают через бэкенд-эндпоинты, без live-автодополнения.

**Для локальной разработки** — создайте `.env.local`:
```env
VITE_DADATA_KEY=<ваш API-ключ>
VITE_DADATA_SECRET=<ваш секретный ключ>
```

**Для Docker** — создайте `.env` (читается docker-compose автоматически):
```env
VITE_DADATA_KEY=<ваш API-ключ>
VITE_DADATA_SECRET=<ваш секретный ключ>
```

---

## Docker

Фронтенд разворачивается как **статический файловый сервер** (`nginx:1.27-alpine`) внутри общей Docker-сети `marketplace_net`. Весь роутинг API, WebSocket-хабов и раздача фронтенда — через Nginx бэкенда (см. [LocalMarketplace](https://github.com/LocMp-olegg/LocalMarketplace)).

```
Браузер → Nginx (бэкенд, :80)
              ├── /api/**, /connect/**  → Ocelot Gateway (:5000)
              ├── /hubs/**             → микросервисы (SignalR WS)
              └── /                   → frontend (:80, этот контейнер)
```

### Сборка и запуск

```bash
# 1. Создайте .env с ключами DaData (см. раздел «Переменные окружения»)

# 2. Убедитесь, что сеть создана (бэкенд docker-compose создаёт её первым)
docker network inspect marketplace_net

# 3. Запустите контейнер
docker compose up -d --build
```

---

## Скрипты

```bash
npm run dev           # Vite dev-сервер
npm run build         # tsc + vite build (продакшн)
npm run preview       # предпросмотр сборки
npm run lint          # ESLint
npm run format        # Prettier --write src/**
npm run fix           # ESLint --fix + Prettier
npm run check         # tsc + ESLint + Prettier --check (перед коммитом)
npm run generate:api  # генерация src/api/ из swagger/specification/
```

> `src/api/` исключён из git. CI регенерирует его перед сборкой.

---

## Структура проекта

```
src/
├── api/              # Автогенерат (openapi-typescript-codegen) — не трогать вручную
├── components/       # UI-компоненты (без бизнес-логики)
│   ├── aceternity/       # floating-nav, shimmer-button
│   ├── auth/             # формы входа/регистрации, guards, вспомогательные компоненты
│   ├── catalog/          # секции каталога, фильтры
│   ├── chats/            # ChatLayout, ChatsList, ChatInput, ShopFilterDropdown
│   ├── courier/          # карточки заказов, заявок и доставок курьера
│   ├── layout/           # RootLayout, Layout, SellerLayout, CourierLayout, LandscapeBackground
│   ├── location/         # LocationPicker, AddressDropdown
│   ├── nav/              # SearchBar
│   ├── notifications/    # NotificationBell (дропдаун + SignalR toast)
│   ├── orders/           # CheckoutModal, DisputeBlock, StatusHistory
│   ├── product/          # ProductCard, Gallery, Reviews, CartControls, FavoriteButton
│   ├── profile/          # Avatar, PhotoEditor, формы профиля, адреса
│   ├── seller/           # формы магазина/товара, аналитика, заказы продавца
│   ├── shop/             # ShopProductSection, галерея, карта, отзывы
│   └── ui/               # кнопки, бейджи, карусель, select, toast, lightbox, SwitchTabs и др.
├── contexts/         # Глобальное состояние (Auth, Cart, Favorites, Theme, Location, ...)
├── hooks/            # хуки — каталог, детали, профиль, отзывы, уведомления, чаты, курьер, геолокация, UI
├── lib/              # Утилиты без React-состояния (auth, catalog, format, geo, notifications, ...)
├── pages/            # страницы: покупатель, панель продавца, панель курьера
│   ├── seller/           # shops, products, orders, analytics, chats
│   └── courier/          # profile, orders, history, reviews
├── types/            # Типы: Product, ProductDetail, ShopDetail, ReviewItem
├── router.tsx        # Дерево маршрутов
├── main.tsx          # Точка входа
└── index.css         # CSS-переменные + Tailwind tokens
```

---

## Роли пользователей

| Роль | Доступ |
|---|---|
| `User` | каталог, корзина, заказы, избранное, профиль, отзывы, чаты, уведомления |
| `Seller` | всё выше + панель продавца (`/seller/*`) — магазины, товары, заказы, аналитика, чаты |
| `Courier` | панель курьера (`/courier/*`) — профиль, доступные заказы, история, отзывы |
| `Admin` | зарезервировано |

---

## Ключевые возможности

- **Каталог** — двухэтапная загрузка: структура категорий → товары лениво через IntersectionObserver
- **Геолокация** — фильтрация товаров по радиусу (PostGIS на бэкенде), Leaflet-карта для выбора точки
- **Корзина** — хранится на бэкенде (TTL 24ч), групповой checkout по продавцам
- **Частичный checkout** — «Оформить доступные» при недоступных товарах в корзине
- **Отзывы** — написание отзыва после завершения заказа (товар + продавец + курьер), галерея фото, ответы продавца
- **Уведомления** — real-time через SignalR WebSocket + fallback-поллинг; дропдаун в навбаре с toast, полная страница с настройками
- **Чаты** — мессенджер покупатель ↔ продавец (чаты магазина и заказов), панель чатов в разделе продавца
- **Панель продавца** — управление магазинами, товарами, заказами, аналитика (recharts), чаты с покупателями
- **Панель курьера** — просмотр доступных заказов в радиусе, отклики, активные доставки, история
- **Фото** — кроп и загрузка аватара (react-easy-crop → WebP), lightbox для галерей
- **Тёмная тема** — light / dark / system, CSS custom properties
- **Адреса** — CRUD сохранённых адресов, геокодирование, автодополнение (DaData)
- **Сброс пароля** — по email-токену, с индикатором сложности пароля

---

## Страницы

| Путь | Страница | Доступ |
|---|---|---|
| `/` | Каталог (секции по категориям) | публичный |
| `/product/:id` | Детальная страница товара | публичный |
| `/category/:id` | Товары категории с фильтрами | публичный |
| `/search` | Поиск по запросу или тегу | публичный |
| `/shop/:id` | Страница магазина | публичный |
| `/sellers/:id` | Профиль продавца | публичный |
| `/couriers/:id` | Публичная страница курьера | публичный |
| `/reviews/:id` | Детальная страница отзыва | публичный |
| `/login` | Вход / регистрация | публичный |
| `/reset-password` | Сброс пароля по email-ссылке | публичный |
| `/cart` | Корзина | авторизация |
| `/favorites` | Избранное | авторизация |
| `/profile` | Профиль пользователя | авторизация |
| `/orders` | История заказов | авторизация |
| `/orders/:id` | Детали заказа | авторизация |
| `/reviews/new` | Форма отзыва (`?orderId=`) | авторизация |
| `/my-reviews` | Мои отзывы + ожидающие оценки | авторизация |
| `/notifications` | Уведомления + настройки | авторизация |
| `/chats` | Чаты | авторизация |
| `/seller/shops` | Магазины продавца | Seller |
| `/seller/shops/:id/edit` | Редактирование магазина | Seller |
| `/seller/products` | Товары продавца | Seller |
| `/seller/products/:id/edit` | Редактирование товара | Seller |
| `/seller/orders` | Входящие заказы продавца | Seller |
| `/seller/analytics` | Аналитика продаж | Seller |
| `/seller/chats` | Чаты продавца (магазин + заказы) | Seller |
| `/courier/profile` | Профиль и настройки курьера | Courier |
| `/courier/orders` | Доступные заказы и мои доставки | Courier |
| `/courier/history` | История завершённых доставок | Courier |
| `/courier/reviews` | Отзывы о курьере | Courier |

---

## Аутентификация

- **IdentityServer** (Duende) — flow Resource Owner Password
- Access token хранится **в памяти**
- `installFetchInterceptor()` автоматически добавляет Bearer и обновляет токен на 401

---

## Уведомления (SignalR)

`NotificationBell` в навбаре подключается к хабу `/hubs/notifications` (SignalR WebSocket).

- Событие `notification_received` → refetch последних уведомлений + показ toast
- Поллинг счётчика непрочитанных каждые 60с (резерв при потере соединения)
- Автореконнект: 0 / 2s / 5s / 10s / 30s

---

## Бэкенд (локальная разработка)

Репозиторий: [LocMp-olegg/LocalMarketplace](https://github.com/LocMp-olegg/LocalMarketplace)
