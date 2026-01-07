# 🚀 Пошаговое руководство по деплою PRO.CASA.KZ

Это руководство проведет вас от вашего компьютера до работающего сайта на сервере.

---

## 💻 Шаг 1: На вашем компьютере (отправка на GitHub)

Мы обновили `.gitignore`, чтобы секретные пароли не попали в интернет. Теперь можно безопасно загрузить код.

```bash
# 1. Проверьте что вы в корне проекта
cd "/Users/gibatolla/Documents/Pro-casa.kz/pro-casa"

# 2. Добавьте все файлы
git add .

# 3. Сделайте коммит
git commit -m "feat: Production deployment setup with Docker and SSL"

# 4. Отправьте на GitHub (замените URL на ваш репозиторий)
# git remote add origin https://github.com/ВАШ_НИК/pro-casa.git
git push origin main
```

---

## ☁️ Шаг 2: На сервере (Подготовка)

Зайдите на ваш VPS сервер через SSH:

```bash
ssh root@IP_ВАШЕГО_СЕРВЕРА
```

### 1. Установите Docker (если нет)

```bash
# Ubuntu 22.04 / 24.04
curl -fsSL https://get.docker.com | sh
```

### 2. Скачайте проект

```bash
# Создайте папку
mkdir -p /opt/www
cd /opt/www

# Клонируйте репозиторий
git clone https://github.com/ВАШ_НИК/pro-casa.git .
```

---

## 🔐 Шаг 3: Настройка секретов на сервере

Так как мы исключили файл с паролями из Git для безопасности, его нужно создать на сервере вручную.

1.  Перейдите в папку деплоя:
    ```bash
    cd /opt/www/pro-casa/deployment
    ```

2.  Создайте файл `.env.production`:
    ```bash
    nano .env.production
    ```

3.  Вставьте туда содержимое (скопируйте отсюда и замените пароли на свои!):

    ```env
    # Домен
    DOMAIN=pro.casa.kz
    
    # Email для SSL уведомлений
    ADMIN_EMAIL=admin@casa.kz
    
    # База данных
    POSTGRES_USER=pro_casa_user
    POSTGRES_PASSWORD=ПРИДУМАЙТЕ_СЛОЖНЫЙ_ПАРОЛЬ
    POSTGRES_DB=pro_casa_db
    
    # JWT (Генерация ключа: openssl rand -base64 32)
    JWT_SECRET=ПРИДУМАЙТЕ_ДЛИННЫЙ_СЕКРЕТНЫЙ_КЛЮЧ
    JWT_EXPIRES_IN=7d
    
    # MinIO (Файловое хранилище)
    MINIO_ROOT_USER=minio_admin
    MINIO_ROOT_PASSWORD=ПРИДУМАЙТЕ_СЛОЖНЫЙ_ПАРОЛЬ_MINIO
    
    # Настройки URL
    NEXT_PUBLIC_API_URL=https://pro.casa.kz/api
    CORS_ORIGIN=https://pro.casa.kz
    ```

4.  Сохраните файл: нажмите `Ctrl+O`, `Enter`, затем `Ctrl+X`.

---

## 🚀 Шаг 4: ЗАПУСК!

Теперь самое простое. Запустите скрипт деплоя, который сделает всё остальное:

1.  Сделает скрипт исполняемым:
    ```bash
    chmod +x deploy-production.sh
    ```

2.  Запустите:
    ```bash
    ./deploy-production.sh
    ```

**Что произойдет автоматически:**
1.  Скрипт запросит настоящий SSL сертификат у Let's Encrypt для домена `pro.casa.kz`.
2.  Соберет Docker образы.
3.  Запустит базу данных, бекенд, фронтенд и MinIO.
4.  Применит миграции базы данных.

---

## 🎉 Шаг 5: Проверка

Откройте в браузере: **https://pro.casa.kz**

Если вы видите сайт и замочек SSL (HTTPS) — поздравляю, вы справились!

### Полезные команды на сервере:

*   **Обновить код:**
    ```bash
    cd /opt/www/pro-casa/deployment
    git pull origin main
    ./deploy-production.sh
    ```

*   **Посмотреть логи:**
    ```bash
    docker compose -f docker-compose.production.yml logs -f
    ```
