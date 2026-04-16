# CLAUDE.md — Универсальные правила Claude Code

> Применяется ко ВСЕМ проектам. Версия 1.0 | 2026-04-16

---

## Режим работы

**Автономное исполнение.** Довожу задачу до конца без пауз на подтверждение. Вопросы — только при реальном блокере (конфликт бизнес-правил, риск потери данных, недоступность окружения).

**Полный цикл разработки (ОБЯЗАТЕЛЕН):**
1. Изучить задачу (LightRAG → код → контекст)
2. Написать код
3. Lint → тесты
4. `git commit` с описательным сообщением
5. `git push` в remote
6. **Никогда не останавливаться на "код написан"** — commit + push без отдельного запроса

---

## CLI инструменты

| Инструмент | Когда | Пример |
|---|---|---|
| **git** | Всегда | `git status`, `git commit`, `git push` |
| **gh** | GitHub операции | `gh pr create`, `gh issue list` |
| **railway** | Деплой, логи | `railway logs`, `railway status` |
| **jules** | Тесты, рефакторинг | `PYTHONIOENCODING=utf-8 jules auto` |
| **ruff** | Python lint | `ruff check .`, `ruff check . --fix` |
| **pytest** | Python тесты | `python -m pytest tests/ -v --tb=short` |
| **npm** | Frontend | `npm run dev`, `npm run build` |

---

## MCP серверы

### LightRAG — Граф знаний (включён для всех проектов)

**Сервер:** `https://lightrag-server-production-3229.up.railway.app`
**Auth:** `X-API-Key` header
**Workspace:** имя проекта (slug репозитория)

**Когда использовать (ОБЯЗАТЕЛЬНО, ДО чтения файлов):**
- Бизнес-логика, связи между модулями
- Архитектурные решения, ADR
- Исторический контекст (почему принято решение X)
- Поиск по документации, когда ответ требует нескольких документов

**Когда НЕ использовать:**
- Конкретный баг в конкретном файле
- Синтаксис, lint, тесты
- Git-операции

**Режимы поиска:**
- `local` — точные факты (конкретная функция, конкретное правило)
- `global` — концептуальные связи (как модули взаимодействуют)
- `hybrid` — оба (рекомендуется по умолчанию)

**API:**
```bash
# Запрос к графу знаний
POST /query
Headers: Content-Type: application/json, X-API-Key: <key>, LIGHTRAG-WORKSPACE: <project>
Body: {"query": "описание", "mode": "hybrid"}

# Индексация документа
POST /documents/text
Body: {"text": "содержимое документа"}

# Статус индексации
GET /documents/status_counts
```

### Другие MCP (по проекту)

- **github** — issues, PR, reviews
- **fetch** — веб-страницы и API
- **sentry** — production ошибки (если подключён)

---

## Порядок работы

### Разработка фичи
1. **LightRAG** → бизнес-правила, архитектура, контекст
2. Прочитать связанные файлы
3. Написать код
4. Lint → тесты → зелёные
5. `git commit` → `git push`

### Диагностика бага
1. **LightRAG** → правила и инварианты модуля
2. **Sentry** → есть ли ошибка в production?
3. `railway logs` → последние логи
4. Найти код → починить → тесты
5. `git commit` → `git push`

### Деплой
1. Тесты зелёные, lint чистый
2. `gh pr create` или `git push`
3. `railway logs` → проверить деплой
4. **Sentry** → мониторинг ошибок после деплоя

---

## Стандарты кода

### Python (если есть backend)
```python
# ✅ Async
async def get_item(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item))

# ✅ Типы обязательны
async def create(db: AsyncSession, name: str, price: float | None = None) -> Item:

# ❌ Запрещено
time.sleep()       # → asyncio.sleep()
os.getenv()        # → settings.FIELD
print()            # → logging
raw SQL            # → ORM
```

### Именование
- Python: файлы `snake_case.py`, классы `PascalCase`, функции `snake_case`
- API paths: `kebab-case`
- JS/JSX: `camelCase`

---

## Безопасность

- Не коммитить `.env`, credentials, API keys
- Секреты только через env vars или GitHub Secrets
- `role=admin` всегда имеет полный доступ (если есть RBAC)
- Input validation на границах системы (user input, external API)

---

## Commit Blocker (перед git commit)

1. Lint чистый (ruff / eslint)
2. Тесты зелёные
3. Нет hardcoded secrets в коде
4. Если менялась БД — миграция создана

---

## Post-Mortem паттерны (избегать)

| Антипаттерн | Профилактика |
|---|---|
| `except Exception: pass` | Логировать или пробрасывать |
| Dead code endpoint | grep по фронту перед созданием |
| Auto-POST при открытии страницы | Только по действию пользователя |
| DDL в коде приложения | Только через миграции |
