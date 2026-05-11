# loc-mp-ui — Районный

Фронтенд гиперлокального маркетплейса **«Районный»**. SPA на Vite + React + TypeScript, подключается к бэкенду [LocalMarketplace](../LocalMarketplace) через API Gateway.

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
├── api/          # Автогенерат (openapi-typescript-codegen) — не трогать вручную
├── components/   # UI-компоненты (без бизнес-логики)
│   ├── aceternity/   # floating-nav, shimmer-button
│   ├── auth/         # формы входа/регистрации, guards, вспомогательные компоненты
│   ├── catalog/      # секции каталога, фильтры
│   ├── layout/       # RootLayout, Layout, SellerLayout, LandscapeBackground
│   ├── location/     # LocationPicker, AddressDropdown
│   ├── nav/          # SearchBar
│   ├── orders/       # CheckoutModal, DisputeBlock, StatusHistory
│   ├── product/      # ProductCard, Gallery, Reviews, CartControls, FavoriteButton
│   ├── profile/      # Avatar, PhotoEditor, формы профиля, адреса
│   ├── seller/       # формы магазина/товара, аналитика, заказы продавца
│   ├── shop/         # ShopProductSection, галерея, карта, отзывы
│   └── ui/           # кнопки, бейджи, карусель, select, toast, lightbox и др.
├── contexts/     # Глобальное состояние (Auth, Cart, Favorites, Theme, Location, ...)
├── hooks/        # 31 хук — каталог, детали, профиль, формы, геолокация, UI
├── lib/          # Утилиты без React-состояния (auth, catalog, format, geo, ...)
├── pages/        # 18 страниц: 12 покупательских + 6 панели продавца
├── types/        # Типы: Product, ProductDetail, ShopDetail, ReviewItem
├── router.tsx    # Дерево маршрутов
├── main.tsx      # Точка входа
└── index.css     # CSS-переменные + Tailwind tokens
```

---

## Роли пользователей

| Роль | Доступ |
|---|---|
| `User` | каталог, корзина, заказы, избранное, профиль |
| `Seller` | всё выше + панель продавца (`/seller/*`) |
| `Courier` | зарезервировано |
| `Admin` | зарезервировано |

---

## Ключевые возможности

- **Каталог** — двухэтапная загрузка: структура категорий → товары лениво через IntersectionObserver
- **Геолокация** — фильтрация товаров по радиусу (PostGIS на бэкенде), Leaflet-карта для выбора точки
- **Корзина** — хранится на бэкенде (TTL 24ч), групповой checkout по продавцам
- **Частичный checkout** — «Оформить доступные» при недоступных товарах в корзине
- **Панель продавца** — управление магазинами, товарами, заказами, аналитика (recharts)
- **Фото** — кроп и загрузка аватара (react-easy-crop → WebP), lightbox для галерей
- **Тёмная тема** — light / dark / system, CSS custom properties
- **Адреса** — CRUD сохранённых адресов, геокодирование, автодополнение

---

## Аутентификация

- **IdentityServer** (Duende) — flow Resource Owner Password
- Access token хранится **в памяти** (не в localStorage)
- Refresh token — в `localStorage`
- `installFetchInterceptor()` автоматически добавляет Bearer и обновляет токен на 401

---

## Бэкенд (локальная разработка)

| Адрес | Сервис |
|---|---|
| http://localhost:5000 | API Gateway |
| http://localhost:5001 | IdentityService + Swagger |
| http://localhost:5002 | CatalogService + Swagger |
| http://localhost:5003 | OrderService + Swagger |
| http://localhost:5004 | ReviewService + Swagger |
| http://localhost:5005 | NotificationService + Swagger |
| http://localhost:5006 | AnalyticsService + Swagger |
| http://localhost:5007 | ChatService + Swagger |
| http://localhost:15672 | RabbitMQ Management (guest/guest) |
| http://localhost:9001 | MinIO Console (minioadmin/minioadmin) |
| http://localhost:8025 | MailHog |

Запуск: `docker compose up -d` из `D:\programming\CourseWork4c\LocalMarketplace`.

CORS разрешён для `http://localhost:5173`.

---

## Соглашения

- Файлы — **kebab-case**: `product-card.tsx`, `use-product-actions.ts`
- Компоненты — только JSX и стили, логика — в хуках
- `strict: true`, без `any`
- Prettier: без точек с запятой, одинарные кавычки, printWidth 100
- CVA-варианты — в отдельных `*-variants.ts` файлах
- Цвета — только через CSS custom properties, не хардкодить hex в TSX

Подробнее об архитектурных решениях — в [CLAUDE.md](./CLAUDE.md).
