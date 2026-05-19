import os
import re
import logging
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    ContextTypes,
)
from supabase import create_client

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Временное хранилище пока пользователь выбирает урок
pending: dict[int, dict] = {}

TYPE_EMOJI = {"video": "🎥", "template": "📋", "technique": "🛠", "resource": "📎"}

URL_PATTERN = re.compile(r"https?://\S+")


def detect_type(url: str) -> str:
    url_lower = url.lower()
    if "youtube.com" in url_lower or "youtu.be" in url_lower:
        return "video"
    if "github.com" in url_lower:
        return "template"
    if "figma.com" in url_lower:
        return "resource"
    return "resource"


def parse_message(text: str) -> tuple[str | None, str | None]:
    urls = URL_PATTERN.findall(text)
    if not urls:
        return None, None
    url = urls[0]
    title = URL_PATTERN.sub("", text).strip()
    return title or url, url


def build_lessons_keyboard(lessons: list[dict]) -> InlineKeyboardMarkup:
    keyboard = []
    row = []
    for i, lesson in enumerate(lessons):
        label = f"W{lesson['week']}L{lesson['lesson_number']}: {lesson['title'][:18]}"
        # callback_data лимит 64 байта: "lesson:{uuid}:{week}" = ~47 байт
        btn = InlineKeyboardButton(
            label,
            callback_data=f"lesson:{lesson['id']}:{lesson['week']}",
        )
        row.append(btn)
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    return InlineKeyboardMarkup(keyboard)


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Привет! Отправь мне материал в формате:\n\n"
        "<b>Название https://link.com</b>\n\n"
        "или\n\n"
        "<b>https://link.com Название</b>\n\n"
        "Бот определит тип по ссылке и спросит, в какой урок добавить.\n\n"
        "Команды:\n"
        "/list — последние 10 материалов\n"
        "/delete &lt;id&gt; — удалить материал",
        parse_mode="HTML",
    )


async def cmd_list(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    result = (
        supabase.table("materials")
        .select("id, title, type, content_url, week")
        .order("id", desc=True)
        .limit(10)
        .execute()
    )
    materials = result.data

    if not materials:
        await update.message.reply_text("Материалов пока нет.")
        return

    lines = ["📚 <b>Последние 10 материалов:</b>\n"]
    for m in materials:
        emoji = TYPE_EMOJI.get(m["type"], "📎")
        url_display = (m["content_url"] or "")[:50]
        lines.append(
            f"{emoji} <b>{m['title']}</b> (W{m['week']})\n"
            f"   ID: <code>{m['id']}</code>\n"
            f"   <a href='{m['content_url']}'>{url_display}</a>\n"
        )

    await update.message.reply_text("\n".join(lines), parse_mode="HTML")


async def cmd_delete(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not context.args:
        await update.message.reply_text("Укажи ID материала: /delete &lt;id&gt;")
        return

    material_id = context.args[0]
    supabase.table("materials").delete().eq("id", material_id).execute()
    await update.message.reply_text(f"✅ Материал <code>{material_id}</code> удалён.", parse_mode="HTML")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text.strip()
    title, url = parse_message(text)

    if not url:
        await update.message.reply_text(
            "Не нашёл ссылку. Отправь в формате:\n<b>Название https://link.com</b>",
            parse_mode="HTML",
        )
        return

    material_type = detect_type(url)
    user_id = update.effective_user.id
    pending[user_id] = {"title": title, "url": url, "type": material_type}

    result = (
        supabase.table("lessons")
        .select("id, week, lesson_number, title")
        .order("week")
        .order("lesson_number")
        .execute()
    )
    lessons = result.data

    if not lessons:
        await update.message.reply_text("Уроков в базе нет. Сначала добавь уроки.")
        return

    keyboard = build_lessons_keyboard(lessons)
    emoji = TYPE_EMOJI.get(material_type, "📎")

    await update.message.reply_text(
        f"✅ Нашёл материал:\n\n"
        f"<b>Название:</b> {title}\n"
        f"<b>URL:</b> {url}\n"
        f"<b>Тип:</b> {emoji} {material_type}\n\n"
        f"В какой урок добавить?",
        parse_mode="HTML",
        reply_markup=keyboard,
    )


async def handle_lesson_selection(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    material = pending.get(user_id)

    if not material:
        await query.edit_message_text("Сессия истекла. Отправь материал заново.")
        return

    # callback_data формат: "lesson:{uuid}:{week}"
    parts = query.data.split(":")
    lesson_id = parts[1]
    week = int(parts[2])

    supabase.table("materials").insert({
        "lesson_id": lesson_id,
        "title": material["title"],
        "type": material["type"],
        "content_url": material["url"],
        "week": week,
        "markdown_content": None,
    }).execute()

    del pending[user_id]

    emoji = TYPE_EMOJI.get(material["type"], "📎")
    await query.edit_message_text(
        f"✅ Добавлено!\n\n"
        f"{emoji} <b>{material['title']}</b>\n"
        f"Тип: {material['type']}\n"
        f"Неделя: {week}",
        parse_mode="HTML",
    )


def main() -> None:
    if not TELEGRAM_TOKEN:
        raise ValueError("TELEGRAM_TOKEN не задан в .env")

    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("list", cmd_list))
    app.add_handler(CommandHandler("delete", cmd_delete))
    app.add_handler(CallbackQueryHandler(handle_lesson_selection, pattern=r"^lesson:"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("Бот запущен в режиме polling...")
    app.run_polling()


if __name__ == "__main__":
    main()
