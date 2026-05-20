import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY"),
)

GOALS = [
    {
        "keywords": ["pavel", "проскряков", "proskryakov", "proskriakov"],
        "goal": "Сделать систему работы с телеграм-каналами: агрегировать сообщения из большого количества каналов, делать дедупликацию новостей, сжимать тексты, упрощать язык и расшифровывать аббревиатуры, плюс классифицировать сообщения по темам и складывать в базу данных по группам.",
    },
    {
        "keywords": ["andrei", "андрей", "andrey"],
        "goal": "Запустить архитектуру для конкретного ресёрча — система, которая ходит по сети и ищет источники под заданную исследовательскую задачу.",
    },
    {
        "keywords": ["helen", "лена", "elena", "lena"],
        "goal": "Собирать по кусочкам своё «рабочее место консультанта по одному профилю» — полный цикл рутины, включая работу с базой знаний. Не браться за что-то новое, а вырывать куски из своей реальной практики и пробовать на них.",
    },
    {
        "keywords": ["katerina", "катерина", "ekaterina", "kateryna"],
        "goal": "Развивать «контент-завод» для LinkedIn: к уже собранному пайплайну (сбор новостей → сортировка под ЦА → фильтрация → пост по пятницам) добавить отслеживание подкаст-каналов и блогеров на YouTube, чтобы агент вытаскивал оттуда мысли для постов. Плюс разобраться, чтобы всё это бегало автономно.",
    },
    {
        "keywords": ["mikhail", "михаил", "novikov", "новиков"],
        "goal": "Сделать лендинг для одного из новых продуктов компании. Фоточки уже собирают, к воскресенью должен быть готовый лендинг.",
    },
    {
        "keywords": ["mark", "марк"],
        "goal": "Доработать автоматизацию сортировки документов: инвойсы и PDF с общим словом в названии — в отдельные папки. Плюс настроить отправку документов нужным людям через WhatsApp.",
    },
    {
        "keywords": ["наташ", "natasha", "natalia", "наталья", "natalya"],
        "goal": "Написать SEO-оптимизированную статью, сверстать из неё красивую страницу с учётом всех SEO-требований и отправить на сайт. Параллельно — починить подключение сервисов Яндекса.",
    },
    {
        "keywords": ["валери", "свалов", "lera", "лера", "valeriya", "valeria"],
        "goal": "Сделать систему мониторинга СМИ: агент ходит по интернету, находит публикации где два бренда упоминаются в главной роли, и собирает отчёт. Важно чтобы работало постоянно, не разово.",
    },
]

def match_goal(name: str) -> str | None:
    name_lower = (name or "").lower()
    for entry in GOALS:
        if any(kw in name_lower for kw in entry["keywords"]):
            return entry["goal"]
    return None

def main():
    # Fetch all users
    result = supabase.table("users").select("id, name, email").execute()
    users = result.data

    if not users:
        print("Пользователей не найдено.")
        return

    updated = 0
    skipped = 0

    for user in users:
        name = user.get("name") or user.get("email", "")
        goal = match_goal(name)

        if goal:
            supabase.table("users").update({"goal": goal}).eq("id", user["id"]).execute()
            print(f"✅ {name} → цель добавлена")
            updated += 1
        else:
            print(f"⏭  {name} → совпадение не найдено")
            skipped += 1

    print(f"\nГотово: обновлено {updated}, пропущено {skipped}")

if __name__ == "__main__":
    main()
