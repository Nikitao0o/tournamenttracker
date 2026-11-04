# Tournament Tracker

Веб-приложение для отслеживания киберспортивных турниров, сеток соревнований, команд, игроков, матчей и детальной статистики по картам (HLTV-style).

Проект разработан в рамках курса Fullstack-разработки (Лабораторные работы №1–5: Backend, API, База данных, Аутентификация, Ролевая модель, Турнирные сетки и Интеграция Frontend/Backend).

---

## Стек технологий

- **Backend**: Python 3.11+, [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy 2.0](https://www.sqlalchemy.org/), [Pydantic v2](https://docs.pydantic.dev/), [Alembic](https://alembic.sqlalchemy.org/), Uvicorn
- **База данных**: [PostgreSQL 16](https://www.postgresql.org/) (драйвер `psycopg3`), [SQLite](https://www.sqlite.org/) (для легковесного локального тестирования и CI с `PRAGMA foreign_keys=ON;`)
- **Безопасность и аутентификация**:
  - Хеширование паролей: **Argon2id** (`argon2-cffi`) в соответствии с рекомендациями OWASP.
  - Двухтокеновая авторизация: **JWT Access Token** (HS256 через PyJWT с обязательной проверкой подписи и срока жизни) + **Refresh Token** с хранением в БД и отзывом при логауте.
  - Строгая валидация прав администратора по подтвержденному email (`admins.txt` и `User.is_admin`), защита от спуфинга через никнейм.
  - Безопасная загрузка файлов: проверка magic bytes через Pillow (PNG, JPEG, WEBP; SVG исключён во избежание XSS).
- **Контейнеризация**: Docker (непривилегированный пользователь `appuser`), Docker Compose с healthcheck и томом `uploads_data`.
- **Frontend**: [React 19](https://react.dev/), [TypeScript 6](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/), [Material UI (MUI v9)](https://mui.com/), `@emotion/react`, `@emotion/styled`, [React Router v7](https://reactrouter.com/), [Oxlint](https://oxc.rs/)

---

## Реализованные лабораторные работы

### Лабораторная работа №4: Аутентификация и авторизация
1. **Стойкое хеширование паролей**: миграция на Argon2id с уникальной солью на пользователя.
2. **Двухтокеновая аутентификация**:
   - `POST /api/auth/login` выдаёт пару токенов: `access_token` (JWT, 30 минут) и `refresh_token` (UUID, 7 дней).
   - `POST /api/auth/refresh` обновляет access-токен по действующему refresh-токену, отклоняя истекшие, отозванные или несуществующие токены.
   - `POST /api/auth/logout` отзывает refresh-токен текущей сессии в базе данных и очищает клиентское состояние.
3. **Защита роутов и ролевая модель**:
   - Публичные эндпоинты: просмотр матчей, турниров, сеток, команд, игроков, лидербордов.
   - Защищенные эндпоинты: создание/редактирование турниров, команд, игроков, матчей, загрузка медиа и управление сетками доступны только администратору (`get_current_admin`).
   - Идентификация администратора строго по email, смена email в `PATCH /api/auth/me` заблокирована.

### Лабораторная работа №5: Интеграция Frontend и Backend
1. **Единый источник истины и API-клиент**:
   - Полное подключение всех экранов frontend к FastAPI backend без скрытых моков.
   - Автоматический интерцептор перехвата 401 ошибки с прозрачным обновлением access-токена через refresh-токен (`client.ts`).
2. **Генерация турнирных сеток для произвольного N команд**:
   - **Single Elimination**: плей-офф с автоматической добивкой до степени двойки и bye-раундами.
   - **Double Elimination**: верхняя и нижняя сетки с выходом в Гранд-финал.
   - **Round Robin**: круговой турнир по алгоритму Бергера (все играют со всеми).
   - **Swiss System**: швейцарская система раундов со сведением участников по очкам.
3. **HLTV-статистика матчей**:
   - Сущности `MapResult` (счёт по картам: Mirage, Dust2, Inferno и др.) и `PlayerMatchStat` (индивидуальная статистика: K, D, ADR, KAST%, MVP, Rating 2.0).
   - Расчёт рейтинга игроков по картам и динамическое начисление очков командам.
4. **Оптимизация и надёжность**:
   - Маршрутизация нативного React Router `lazy` для разбиения сборки на чанки (размер основного бандла снижен с 156 кБ до 37 кБ).
   - Компонент `ErrorBoundary` и `Suspense` со скелетонами загрузки.
   - Линтинг `oxlint` без ошибок и предупреждений (0 warnings, 0 errors).

---

## Архитектура проекта

```text
tournamenttracker/
├── backend/
│   ├── alembic/              # Миграции базы данных Alembic
│   ├── app/
│   │   ├── config.py         # Настройки, переменные окружения, секреты
│   │   ├── auth.py           # Argon2id, JWT HS256, RefreshToken, проверка прав
│   │   ├── database.py       # SQLAlchemy engine, сессии, SQLite PRAGMA FK listener
│   │   ├── models.py         # Модели: User, RefreshToken, Tournament, Bracket, Match, MapResult, PlayerMatchStat, Team, Player
│   │   ├── schemas.py        # Pydantic v2 схемы с RFC-валидацией
│   │   ├── crud.py           # CRUD-операции, Pillow-проверка изображений, алгоритмы сеток N команд, HLTV Rating 2.0
│   │   ├── seed.py           # Демо-данные с реальными CS2 командами (Spirit, Vitality, G2, MOUZ, FURIA)
│   │   ├── main.py           # FastAPI app, безопасный CORS, lifespan
│   │   └── routers/          # Роутеры: auth, admin, tournaments, matches, teams, players, leaderboards
│   ├── tests/                # Юнит- и интеграционные тесты с pytest и TestClient
│   │   ├── conftest.py
│   │   ├── test_all_38_swagger_routes.py
│   │   ├── test_api.py
│   │   ├── test_audit.py
│   │   ├── test_crud.py
│   │   ├── test_lab4_security_and_auth.py
│   │   └── test_swagger_endpoints.py
│   ├── admins.txt            # Список email-адресов администраторов
│   ├── requirements.txt      # Продакшн-зависимости (закрепленные версии)
│   ├── requirements-dev.txt  # Зависимости разработки и тестирования (pytest, httpx)
│   └── Dockerfile            # Контейнер бэкенда (non-root appuser)
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Провайдеры (AuthProvider, TournamentProvider) и стили
│   │   ├── components/       # Header, MatchRow, RankingBox, StatusChips
│   │   ├── features/         # Модальные окна, фильтры, сетки (Single, Double, RoundRobin, Swiss)
│   │   ├── layouts/          # MainLayout с ErrorBoundary и Suspense
│   │   ├── pages/            # Экраны SPA (HomePage, MatchPage, TournamentPage, AdminPage и др.)
│   │   ├── router/           # React Router v7 с lazy-загрузкой страниц
│   │   ├── shared/           # Typed API Client, storage, UI-компоненты (TeamLogo, PlayerAvatar)
│   │   └── types/            # TypeScript типы (BracketType, Match, Team, Player, MapResult, PlayerMatchStat)
│   ├── .oxlintrc.json        # Конфигурация линтера
│   └── package.json
│
├── docker-compose.yml        # Оркестрация: PostgreSQL 16 + FastAPI + Nginx Frontend
└── README.md
```

---

## Запуск приложения

### 1. Запуск через Docker Compose (рекомендуется)

```bash
# Клонирование и запуск всех сервисов в фоновом режиме
docker compose up -d --build

# Проверка статуса контейнеров
docker compose ps
```

Сервисы будут доступны по адресам:
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Интерактивная документация Swagger**: `http://localhost:8000/docs`

---

### 2. Локальный запуск без Docker

#### Backend
```bash
# Переход в директорию бэкенда
cd backend

# Создание и активация виртуального окружения
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Применение миграций Alembic (при работе с PostgreSQL)
alembic upgrade head

# Запуск dev-сервера
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
# Переход в директорию фронтенда
cd frontend

# Установка зависимостей
npm install

# Запуск dev-сервера с HMR
npm run dev
```

---

## Тестирование и линтинг

### Запуск тестов бэкенда (pytest)
Все 30 тестов используют изолированный `TestClient` и in-memory базу SQLite, не требуя предварительно запущенных внешних процессов:

```bash
# Из корня проекта
python3 -m pytest backend/tests -v
```

### Проверка типов и сборка фронтенда
```bash
cd frontend

# Проверка линтером Oxlint
npm run lint

# Компиляция TypeScript и production-сборка Vite
npm run build
```

---

## Тестовые учетные записи

- **Администратор**: `admin@tracker.local` / `password123` (доступ к админ-панели, управлению матчами и сетками)
- **Пользователь**: `user@tracker.local` / `password123` (стандартный гостевой/пользовательский доступ)
