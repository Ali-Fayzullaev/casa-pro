# Руководство по развертыванию Casa PRO v1.2 (pro.casa.kz)

Этот документ описывает процесс развертывания проекта на боевой сервер с доменом `pro.casa.kz`.

## Предварительные требования
- Сервер с Ubuntu (или другой Linux).
- Установленный Docker и Docker Compose (скрипт `deploy_scripts/server_setup.sh` делает это).
- Домен `pro.casa.kz`, направленный на IP адрес сервера (A-запись).

## 1. Подготовка на сервере

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/AGGIB/pro-casa.git
   cd pro-casa
   ```

2. Создайте файл `.env` в папке `deployment` (или в корне, но запускать будем из `deployment`):
   ```bash
   cd deployment
   nano .env
   ```

   **Пример содержимого .env:**
   ```env
   # Database
   POSTGRES_USER=pro_casa_admin
   POSTGRES_PASSWORD=SlojniyParolDB2025!
   
   # JWT
   JWT_SECRET=SuperSecretKeyForJWT_ChangeMe!
   
   # MinIO
   MINIO_ROOT_USER=minio_admin
   MINIO_ROOT_PASSWORD=MinioSecretPassword2025!
   ```

## 2. Запуск (Первый раз - без SSL)

По умолчанию `nginx.conf` настроен на работу по HTTP (порт 80) и перенаправление на HTTPS. Но так как сертификатов еще нет, Nginx может не стартовать, если включен SSL блок.
*В текущей конфигурации я оставил включенным HTTP и закомментировал SSL сертификаты, чтобы вы могли сначала получить их.*

1. Запустите контейнеры:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

2. Проверьте статус:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

3. Теперь сайт должен быть доступен по `http://pro.casa.kz`.

## 3. Настройка SSL (HTTPS)

Мы используем Certbot для получения бесплатного сертификата Let's Encrypt.

1. Запустите получение сертификата (Nginx должен работать на 80 порту!):
   ```bash
   docker compose -f docker-compose.prod.yml run --rm certbot
   ```
   Следуйте инструкциям (введите email, согласитесь с условиями).

2. После успешного получения сертификатов, они появятся в папке `deployment/certbot/conf`.

3. **Включите SSL в Nginx:**
   Отредактируйте `nginx.conf`:
   ```bash
   nano nginx.conf
   ```
   Раскомментируйте строки в блоке `server { listen 443 ssl; ... }`:
   ```nginx
   ssl_certificate /etc/letsencrypt/live/pro.casa.kz/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/pro.casa.kz/privkey.pem;
   ```

4. Перезапустите Nginx:
   ```bash
   docker compose -f docker-compose.prod.yml restart nginx
   ```

## 4. Обновление приложения

Если вы внесли изменения в код и запушили в GitHub:

1. Зайдите на сервер:
   ```bash
   cd pro-casa
   git pull origin main
   ```

2. Пересоберите и перезапустите:
   ```bash
   cd deployment
   docker compose -f docker-compose.prod.yml up -d --build
   ```
