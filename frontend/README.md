# Tournament Tracker — Frontend (Лабораторные работы №4–5)

Веб-клиент приложения **Tournament Tracker** для отслеживания киберспортивных турниров, сеток соревнований (Single Elimination, Double Elimination, Round Robin, Swiss), команд, игроков и матчей с детальной HLTV-статистикой.

---

## Стек технологий

- **Фреймворк**: [React 19](https://react.dev/), [TypeScript 6](https://www.typescriptlang.org/)
- **Сборщик**: [Vite 8](https://vitejs.dev/) (с чанкованием вендоров и lazy-загрузкой страниц)
- **UI-библиотека**: [Material UI (MUI v9)](https://mui.com/), `@emotion/react`, `@emotion/styled`
- **Маршрутизация**: [React Router v7](https://reactrouter.com/) (с lazy-импортами компонентов и `ProtectedAdminRoute`)
- **Линтер**: [Oxlint](https://oxc.rs/) (с проверкой TypeScript и React)

---

## Архитектура проекта

Структура исходного кода в `frontend/src`:

```text
frontend/src/
├── app/                              # Слой конфигурации и глобальной логики
│   ├── providers/
│   │   ├── AuthContext.ts            # Интерфейс и контекст аутентификации
│   │   ├── AuthProvider.tsx          # Управление сессией, токенами и выходом
│   │   ├── useAuth.ts                # Хук доступа к данным авторизации
│   │   ├── TournamentContext.ts      # Контекст турниров
│   │   ├── TournamentProvider.tsx    # Реактивный провайдер турниров
│   │   └── useTournaments.ts         # Хук доступа к операциям над турнирами
│   ├── router/
│   │   └── ProtectedRoute.tsx        # Защитник админ-маршрута (Role-Based Access с 404 для не-админов)
│   ├── theme.ts                      # Конфигурация темы и палитры Material UI
│   ├── App.tsx                       # Корневой компонент
│   └── main.tsx                      # Точка монтирования в DOM
│
├── pages/                            # Экраны и страницы приложения
│   ├── admin/
│   │   ├── AdminPage.tsx             # Панель администратора (/admin)
│   │   ├── AdminMatchesPage.tsx      # Редактор матчей (/admin/matches)
│   │   └── AdminBracketEditorPage.tsx# Редактор и посев сеток (/admin/bracket)
│   ├── AboutPage.tsx                 # О проекте (/about)
│   ├── HomePage.tsx                  # Главная страница с матчами и турнирами (/)
│   ├── MatchPage.tsx                 # Детальная страница матча с картами и HLTV-статистикой (/matches/:id)
│   ├── NotFoundPage.tsx              # Страница 404
│   ├── PlayerLeaderboardPage.tsx     # Таблица лидеров игроков по Rating 2.0
│   ├── PlayerPage.tsx                # Профиль игрока (/players/:id)
│   ├── PlayersPage.tsx               # Каталог игроков (/players)
│   ├── TeamLeaderboardPage.tsx       # Таблица лидеров команд по очкам
│   ├── TeamPage.tsx                  # Профиль команды и ростер (/teams/:teamRef)
│   ├── TeamsPage.tsx                 # Каталог команд (/teams)
│   ├── TournamentPage.tsx            # Детальная страница турнира (/tournaments/:id)
│   └── TournamentsPage.tsx           # Каталог турниров с фильтрацией (/tournaments)
│
├── features/                         # Интерактивные фичи и сценарии
│   ├── auth/ui/                      # Выпадающее окно Sign In / Sign Up, бейдж профиля
│   ├── bracket/ui/                   # Визуализаторы сеток:
│   │   ├── BracketMatchCard.tsx      # Карточка матча в сетке
│   │   ├── SingleEliminationBracket.tsx
│   │   ├── DoubleEliminationBracket.tsx
│   │   ├── RoundRobinBracket.tsx
│   │   ├── SwissBracket.tsx
│   │   └── TournamentBracketView.tsx # Корневой переключатель сеток
│   ├── manage-tournaments/ui/        # Формы создания/редактирования/удаления турниров
│   ├── manage-teams/ui/              # Диалоги создания и редактирования команд
│   ├── manage-players/ui/            # Диалоги создания и редактирования игроков
│   └── manage-media/ui/              # Загрузка растровых логотипов и аватаров (PNG / JPG / WEBP)
│
├── shared/                           # Переиспользуемый код, API и базовый UI
│   ├── api/
│   │   ├── client.ts                 # Типизированный API-клиент с авто-обновлением токенов (refresh token rotation)
│   │   ├── errors.ts                 # Унифицированные HTTP-ошибки и сообщения
│   │   └── storage.ts                # Работа с Web Storage (access/refresh tokens, кеш)
│   ├── ui/
│   │   ├── ErrorBoundary.tsx         # Предохранитель падений React-дерева
│   │   ├── LoadingSkeleton.tsx       # Скелетоны для карточек, таблиц и страниц
│   │   ├── EmptyState.tsx            # Информативное пустое состояние
│   │   ├── ErrorAlert.tsx            # Сообщения об ошибках с кнопкой повтора
│   │   ├── TeamLogo.tsx              # Логотип команды (PNG, JPG, WEBP, fallback)
│   │   └── PlayerAvatar.tsx          # Аватар игрока (PNG, JPG, WEBP, fallback)
│   └── utils/
│       ├── formatting.ts             # Форматирование дат и счёта матчей
│       ├── image.ts                  # Валидация и разрешение URL растровых изображений
│       └── validation.ts             # Клиентская валидация форм (email, пароль)
│
└── types/
    └── index.ts                      # TypeScript-интерфейсы моделей и DTO
```

---

## Возможности и сценарии

### 1. Двухтокеновая авторизация и безопасность (Лабораторная работа №4)
- **Вход (Sign In)**: `POST /api/auth/login` сохраняет пару `access_token` (JWT, 30 мин) и `refresh_token` (UUID, 7 дней).
- **Валидация формы входа**: непустой email и непустой пароль (пароль `admin` принимается корректно; ограничение в 6+ символов действует только при регистрации).
- **Ротация Refresh Token**: при получении `401 Unauthorized` интерцептор `client.ts` ставит запросы в очередь, запрашивает новый токен через `POST /api/auth/refresh` и повторяет исходные запросы. При ошибке обновления очередь отклоняется, токены очищаются, а пользователь разлогинивается.
- **Выход (Log Out)**: `POST /api/auth/logout` отправляет refresh-токен на сервер для отзыва, стирает токены из `localStorage` и сбрасывает авторизацию.
- **Ролевая модель**: админ-права определяются строго полем `User.is_admin`. При попытке гостя или не-админа открыть `/admin` маршрут отображает стандартную страницу `NotFoundPage` (404), скрывая существование панели администратора.

### 2. Полная интеграция с Backend API (Лабораторная работа №5)
- Все экраны подключены к реальным эндпоинтам FastAPI (`/api/matches`, `/api/tournaments`, `/api/teams`, `/api/players`, `/api/leaderboards`).
- Никаких скрытых моков и fallback-заглушек: при ошибках сети или сервера интерфейс выводит понятные алерты с кнопками повторной попытки.
- Поддержка создания, редактирования и удаления команд, игроков, турниров и матчей через интерфейс с мгновенной синхронизацией данных.

### 3. Все 4 формата турнирных сеток
- **Double Elimination**: Верхняя сетка (Upper), нижняя сетка (Lower) и Гранд-финал (строго 4 или 8 команд).
- **Single Elimination**: Классический плей-офф (2–32 команд) с поддержкой bye-раундов.
- **Round Robin**: Круговой турнир (таблица туров и партий по алгоритму Бергера).
- **Swiss System**: Швейцарская система со сведением команд по числу побед/поражений и генерацией последующих раундов.
- Визуализатор `TournamentBracketView` автоматически выбирает корректный компонент отображения в зависимости от типа турнира.

### 4. HLTV-статистика матчей
- Страница матча (`/matches/:id`) отображает:
  - Счёт по картам (`MapResult`: Mirage, Nuke, Inferno и др.);
  - Детальную таблицу статистики каждого игрока (`PlayerMatchStat`: K-D, ADR, KAST%, значок MVP матча, Rating 2.0).

---

## Запуск и сборка

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера с HMR
npm run dev

# Проверка типов и production-сборка
npm run build

# Линтинг кода (Oxlint)
npm run lint
```
