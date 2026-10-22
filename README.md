# Tournament Tracker

Веб-приложение для отслеживания киберспортивных турниров, команд, игроков и матчей.

Проект разработан в рамках курса Fullstack-разработки (Лабораторная работа №2: Backend, API и работа с базой данных).

---

## Стек технологий

- **Backend**: Python 3.11+, [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy 2.0](https://www.sqlalchemy.org/), [Pydantic v2](https://docs.pydantic.dev/), Uvicorn
- **База данных**: [PostgreSQL 16](https://www.postgresql.org/), драйвер `psycopg3`
- **Контейнеризация**: Docker, Docker Compose
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Nginx

---

## Архитектура backend-приложения

Код серверной части разделен по слоям ответственности в соответствии с требованиями лабораторной работы:

```text
backend/
├── app/
│   ├── config.py         # Конфигурация приложения и чтение переменных окружения (.env)
│   ├── database.py       # Подключение к PostgreSQL, фабрика сессий SessionLocal, get_db
│   ├── models.py         # Модели SQLAlchemy (таблицы, первичные и внешние ключи, связи)
│   ├── schemas.py        # Схемы валидации Pydantic (Base, Create, Update, Out, валидаторы)
│   ├── crud.py           # Слой доступа к данным и бизнес-логика (CRUD-операции, проверки связей)
│   ├── seed.py           # Автоматическое наполнение базы демонстрационными данными
│   ├── main.py           # Точка входа FastAPI, CORS, регистрация роутеров и lifespan
│   └── routers/          # Маршруты API по сущностям:
│       ├── tournaments.py
│       ├── teams.py
│       ├── players.py
│       ├── matches.py
│       └── leaderboards.py
├── tests/                # Автоматические тесты (CRUD, валидация, связи, HTTP-статусы)
│   ├── conftest.py
│   ├── test_api.py
│   └── test_crud.py
├── Dockerfile            # Контейнеризация бэкенда
└── requirements.txt      # Зависимости Python
```

---

## Модель данных (Entity-Relationship)

В приложении выделены 4 основные взаимосвязанные сущности: **Турниры (Tournaments)**, **Команды (Teams)**, **Игроки (Players)** и **Матчи (Matches)**.

### ER-диаграмма связей

```mermaid
erDiagram
    TEAMS ||--o{ PLAYERS : "содержит (1:N)"
    TEAMS ||--o{ MATCHES : "участвует как Team A (1:N)"
    TEAMS ||--o{ MATCHES : "участвует как Team B (1:N)"
    TOURNAMENTS ||--o{ MATCHES : "включает (1:N)"

    TOURNAMENTS {
        int id PK
        string title
        string prize_pool
        string start_date
        string end_date
        string status
        string location
    }

    TEAMS {
        int id PK
        string name UK
        string short_name
        string region
        string coach
        string description
        int ranking
    }

    PLAYERS {
        int id PK
        string nickname
        string name
        int age
        string role
        string nationality
        string kd
        float impact
        int maps
        int team_id FK
    }

    MATCHES {
        int id PK
        string status
        int score_a
        int score_b
        string date
        string map_name
        int team_a_id FK
        int team_b_id FK
        int tournament_id FK
    }
```

### Описание сущностей и полей

1. **`teams` (Команды)**:
   - `id` (INTEGER, Primary Key) — уникальный идентификатор;
   - `name` (VARCHAR(120), Unique, Not Null) — название команды;
   - `short_name` (VARCHAR(40)) — аббревиатура/тег;
   - `region` (VARCHAR(60)) — регион (Europe, Americas и др.);
   - `coach` (VARCHAR(120)) — тренер команды;
   - `description` (VARCHAR(500)) — описание команды;
   - `ranking` (INTEGER) — мировой рейтинг команды.
   - *Связи*: каскадное отношение к `players` (`cascade="all, delete-orphan"`).

2. **`players` (Игроки)**:
   - `id` (INTEGER, Primary Key) — уникальный идентификатор;
   - `nickname` (VARCHAR(60)) — игровой никнейм;
   - `name` (VARCHAR(120)) — имя и фамилия;
   - `age` (INTEGER) — возраст (валидируется от 10 до 100);
   - `role` (VARCHAR(60)) — роль (AWPer, IGL, Entry Fragger, Support и др.);
   - `nationality` (VARCHAR(60)) — национальность;
   - `kd` (VARCHAR(10)) — статистика K/D;
   - `impact` (FLOAT) — рейтинг импакта;
   - `maps` (INTEGER) — сыграно карт;
   - `team_id` (INTEGER, Foreign Key `teams.id`, ON DELETE CASCADE) — команда игрока.

3. **`tournaments` (Турниры)**:
   - `id` (INTEGER, Primary Key) — уникальный идентификатор;
   - `title` (VARCHAR(200)) — название турнира;
   - `prize_pool` (VARCHAR(50)) — призовой фонд;
   - `start_date` (VARCHAR(10)) — дата старта (формат `YYYY-MM-DD`);
   - `end_date` (VARCHAR(10)) — дата окончания;
   - `status` (VARCHAR(20)) — статус (`Upcoming`, `Ongoing`, `Completed`);
   - `location` (VARCHAR(120)) — город и страна проведения.
   - *Связи*: каскадное отношение к `matches` (`cascade="all, delete-orphan"`).

4. **`matches` (Матчи)**:
   - `id` (INTEGER, Primary Key) — уникальный идентификатор;
   - `status` (VARCHAR(20)) — статус матча (`LIVE`, `UPCOMING`, `FINISHED`);
   - `score_a` (INTEGER, Nullable) — счет команды А;
   - `score_b` (INTEGER, Nullable) — счет команды B;
   - `date` (VARCHAR(10)) — дата проведения матча;
   - `map_name` (VARCHAR(40), Nullable) — название карты;
   - `team_a_id` (INTEGER, Foreign Key `teams.id`, ON DELETE CASCADE) — участник А;
   - `team_b_id` (INTEGER, Foreign Key `teams.id`, ON DELETE CASCADE) — участник B;
   - `tournament_id` (INTEGER, Foreign Key `tournaments.id`, ON DELETE CASCADE) — турнир, в рамках которого идет матч.
   - *Бизнес-правило*: `team_a_id != team_b_id` (команда не может состязаться сама с собой).

---

## Конфигурация окружения (.env)

Параметры приложения и подключения к БД вынесены в переменные окружения.

Для настройки скопируйте файл примера:

```bash
cp .env.example .env
```

Пример содержимого `.env`:

```env
# Параметры подключения к PostgreSQL
POSTGRES_USER=tracker
POSTGRES_PASSWORD=tracker
POSTGRES_DB=tracker
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# URL подключения SQLAlchemy (psycopg3)
DATABASE_URL=postgresql+psycopg://tracker:tracker@localhost:5432/tracker

# Для Docker Compose используется хост 'db':
# DATABASE_URL=postgresql+psycopg://tracker:tracker@db:5432/tracker

# Для легковесной локальной разработки на SQLite:
# DATABASE_URL=sqlite:///./tracker.db

DEBUG=False
```

---

## Запуск проекта

### Вариант 1. Запуск всего стека через Docker Compose (Рекомендуемый)

Docker Compose поднимает PostgreSQL 16, FastAPI backend и React frontend (Nginx):

```bash
# Сборка и запуск контейнеров
docker compose up --build
```

После старта:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Интерактивная документация Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **PostgreSQL**: порт `5432` доступен для внешних клиентов (DBeaver, DataGrip, `psql`)

*Таблицы в БД и демонстрационные данные создаются автоматически при старте бэкенда через SQLAlchemy lifespan.*

---

### Вариант 2. Локальный запуск Backend (без Docker для бэкенда)

1. **Запустите PostgreSQL** (например, через Docker):
   ```bash
   docker compose up -d db
   ```

2. **Создайте и активируйте виртуальное окружение Python**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate      # На macOS / Linux
   # .venv\Scripts\activate       # На Windows
   ```

3. **Установите зависимости**:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Запустите FastAPI сервер**:
   ```bash
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

Сервер автоматически применит схему `Base.metadata.create_all` и наполнит пустую базу начальными данными (`seed_if_empty`).

---

### Вариант 3. Локальный запуск Frontend

```bash
cd frontend
npm install
npm run dev
```
Фронтенд будет доступен по адресу `http://localhost:5173`.

---

## Основные эндпоинты API

| Метод | URL | Описание | Статусы |
|---|---|---|---|
| `GET` | `/api/health` | Проверка статуса сервиса | 200 |
| `GET` | `/api/tournaments` | Список турниров (фильтр по `status`) | 200 |
| `POST` | `/api/tournaments` | Создать турнир | 201, 422 |
| `GET` | `/api/tournaments/{id}` | Получить турнир по ID | 200, 404 |
| `PATCH` | `/api/tournaments/{id}` | Обновить данные турнира | 200, 404, 422 |
| `DELETE` | `/api/tournaments/{id}` | Удалить турнир (каскадно удаляет матчи) | 204, 404 |
| `GET` | `/api/tournaments/{id}/matches` | Матчи конкретного турнира | 200, 404 |
| `GET` | `/api/teams` | Список команд по рейтингу | 200 |
| `POST` | `/api/teams` | Создать команду (проверка уникальности имени) | 201, 409, 422 |
| `GET` | `/api/teams/{id}` | Получить команду по ID | 200, 404 |
| `PATCH` | `/api/teams/{id}` | Обновить команду | 200, 404, 409, 422 |
| `DELETE` | `/api/teams/{id}` | Удалить команду (каскадно удаляет игроков) | 204, 404 |
| `GET` | `/api/teams/{id}/players` | Игроки конкретной команды | 200, 404 |
| `GET` | `/api/players` | Список игроков (фильтр по `team_id`) | 200 |
| `POST` | `/api/players` | Создать игрока (валидация `team_id`) | 201, 400, 422 |
| `GET` | `/api/players/{id}` | Получить игрока по ID | 200, 404 |
| `PATCH` | `/api/players/{id}` | Обновить данные игрока | 200, 400, 404, 422 |
| `DELETE` | `/api/players/{id}` | Удалить игрока | 204, 404 |
| `GET` | `/api/matches` | Список матчей (фильтр по `status`, `tournament_id`, `team_id`) | 200 |
| `POST` | `/api/matches` | Создать матч (валидация `team_a != team_b` и FK) | 201, 400, 422 |
| `GET` | `/api/matches/{id}` | Получить матч по ID | 200, 404 |
| `PATCH` | `/api/matches/{id}` | Обновить счет/статус матча | 200, 400, 404, 422 |
| `DELETE` | `/api/matches/{id}` | Удалить матч | 204, 404 |
| `GET` | `/api/leaderboards/teams` | Лидерборд команд | 200 |
| `GET` | `/api/leaderboards/players` | Лидерборд игроков по рейтингу | 200 |

---

## Тестирование

Для автоматической проверки бизнес-логики, валидации, связей и корректности обработки ошибок подготовлен набор тестов.

Запуск тестов:

```bash
# Запуск через unittest
python3 backend/tests/test_crud.py

# Либо запуск через pytest (при установленном pytest и httpx)
pytest backend/tests
```
