# LMS Materials Bot

Telegram-бот для добавления учебных материалов в Supabase.

## Установка

```bash
cd telegram_bot
pip install -r requirements.txt
```

## Настройка

1. Создай бота через [@BotFather](https://t.me/BotFather) и получи токен.
2. Вставь токен в `.env`:
   ```
   TELEGRAM_TOKEN=1234567890:AAF...
   ```
   `SUPABASE_URL` и `SUPABASE_KEY` уже заполнены.

## Запуск

```bash
python bot.py
```

## Как использовать

**Добавить материал:**
Отправь боту сообщение в формате:

```
React Hooks tutorial https://youtu.be/abc123
```

или

```
https://youtu.be/abc123 React Hooks tutorial
```

Бот автоматически определит тип по ссылке:
- YouTube → `video`
- GitHub → `template`
- Figma / остальное → `resource`

Затем покажет список уроков — выбери нужный кнопкой.

**Команды:**
- `/start` — справка
- `/list` — последние 10 материалов
- `/delete <id>` — удалить материал по ID
