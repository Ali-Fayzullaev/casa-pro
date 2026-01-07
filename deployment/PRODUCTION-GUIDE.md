# 🚀 PRO.CASA.KZ - Production Deployment Guide

## 📋 Содержание

1. [Требования к серверу](#требования-к-серверу)
2. [Быстрый старт](#быстрый-старт)
3. [Структура файлов](#структура-файлов)
4. [Настройка домена](#настройка-домена)
5. [Обновление приложения](#обновление-приложения)
6. [Мониторинг и логи](#мониторинг-и-логи)
7. [Резервное копирование](#резервное-копирование)
8. [Troubleshooting](#troubleshooting)

---

## 📦 Требования к серверу

| Параметр | Минимум | Рекомендуется |
|----------|---------|---------------|
| CPU | 2 ядра | 4 ядра |
| RAM | 4 GB | 8 GB |
| Диск | 40 GB SSD | 100 GB SSD |
| ОС | Ubuntu 22.04+ | Ubuntu 24.04 |

### Установка Docker (Ubuntu)

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com | sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Перелогиниться или выполнить
newgrp docker

# Проверка
docker --version
docker compose version
```

---

## 🚀 Быстрый старт

### 1. Клонирование проекта

```bash
# Клонировать репозиторий
git clone https://github.com/your-repo/pro-casa.git /opt/pro-casa
cd /opt/pro-casa/deployment
```

### 2. Настройка DNS

Перед запуском убедитесь, что:
- DNS A-запись `pro.casa.kz` указывает на IP вашего сервера
- Порты 80 и 443 открыты в firewall

```bash
# Проверка DNS
dig pro.casa.kz +short
# Должен показать IP вашего сервера
```

### 3. Настройка секретов

```bash
# Отредактируйте .env.production при необходимости
nano .env.production
```

> ⚠️ **ВАЖНО**: Измените пароли в `.env.production` перед деплоем!

### 4. Запуск деплоя

```bash
# Сделать скрипты исполняемыми
chmod +x deploy-production.sh renew-ssl.sh

# Запустить деплой (автоматически получит SSL)
./deploy-production.sh
```

### 5. Проверка

После завершения деплоя:

- 🌐 **Frontend**: https://pro.casa.kz
- 🔌 **API**: https://pro.casa.kz/api
- 📦 **MinIO Console**: https://pro.casa.kz/minio

**Данные для входа:**
- Email: `admin@casa.kz`
- Password: `admin123`

---

## 📁 Структура файлов

```
deployment/
├── .env.production              # 🔐 Секреты (НЕ КОММИТИТЬ!)
├── docker-compose.production.yml # Docker конфигурация
├── nginx.prod.conf              # Nginx с SSL
├── deploy-production.sh         # Скрипт деплоя
├── renew-ssl.sh                 # Обновление SSL
└── certbot/                     # SSL сертификаты
    ├── conf/                    # Let's Encrypt конфиг
    └── www/                     # ACME challenge
```

---

## 🌐 Настройка домена

### Изменение домена

1. Отредактируйте `.env.production`:

```bash
DOMAIN=your-new-domain.com
ADMIN_EMAIL=admin@your-domain.com
CORS_ORIGIN=https://your-new-domain.com
NEXT_PUBLIC_API_URL=https://your-new-domain.com/api
```

2. Обновите `nginx.prod.conf`:
   - Замените `pro.casa.kz` на ваш домен

3. Перезапустите деплой:

```bash
# Удалить старые сертификаты
rm -rf ./certbot/conf/live/*

# Запустить заново
./deploy-production.sh
```

---

## 🔄 Обновление приложения

### После изменений в коде

```bash
cd /opt/pro-casa/deployment

# Получить последние изменения
git pull origin main

# Пересобрать и перезапустить
docker compose -f docker-compose.production.yml up --build -d
```

### Обновление только frontend

```bash
docker compose -f docker-compose.production.yml up --build -d frontend
```

### Обновление только backend

```bash
docker compose -f docker-compose.production.yml up --build -d backend

# Применить новые миграции если есть
docker compose -f docker-compose.production.yml exec backend npx prisma migrate deploy
```

---

## 📊 Мониторинг и логи

### Просмотр логов

```bash
# Все сервисы
docker compose -f docker-compose.production.yml logs -f

# Конкретный сервис
docker compose -f docker-compose.production.yml logs -f backend
docker compose -f docker-compose.production.yml logs -f frontend
docker compose -f docker-compose.production.yml logs -f nginx

# Последние 100 строк
docker compose -f docker-compose.production.yml logs --tail=100 backend
```

### Статус контейнеров

```bash
docker compose -f docker-compose.production.yml ps
```

### Использование ресурсов

```bash
docker stats
```

### Health check

```bash
curl https://pro.casa.kz/health
# Должно вернуть: {"status":"ok"}
```

---

## 💾 Резервное копирование

### Бэкап базы данных

```bash
# Создать бэкап
docker compose -f docker-compose.production.yml exec postgres \
  pg_dump -U pro_casa_user pro_casa_db > backup_$(date +%Y%m%d).sql

# Восстановить из бэкапа
cat backup_20260106.sql | docker compose -f docker-compose.production.yml exec -T postgres \
  psql -U pro_casa_user -d pro_casa_db
```

### Бэкап MinIO файлов

```bash
# Создать архив файлов
docker run --rm \
  -v pro-casa_minio_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/minio_backup_$(date +%Y%m%d).tar.gz /data
```

### Автоматический бэкап (cron)

```bash
# Добавить в crontab -e
# Ежедневный бэкап БД в 2:00
0 2 * * * cd /opt/pro-casa/deployment && docker compose -f docker-compose.production.yml exec -T postgres pg_dump -U pro_casa_user pro_casa_db > /backups/db_$(date +\%Y\%m\%d).sql

# Обновление SSL каждый понедельник в 3:00
0 3 * * 1 cd /opt/pro-casa/deployment && ./renew-ssl.sh >> /var/log/ssl-renew.log 2>&1
```

---

## 🔧 Troubleshooting

### Контейнер не запускается

```bash
# Проверить логи
docker compose -f docker-compose.production.yml logs backend

# Перезапустить конкретный сервис
docker compose -f docker-compose.production.yml restart backend
```

### SSL сертификат не получен

```bash
# Проверить что домен указывает на сервер
dig pro.casa.kz +short

# Проверить что порт 80 открыт
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443

# Попробовать получить сертификат вручную
docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  --email admin@casa.kz \
  -d pro.casa.kz \
  --agree-tos --non-interactive --debug
```

### Backend не подключается к БД

```bash
# Проверить что postgres запущен
docker compose -f docker-compose.production.yml ps postgres

# Проверить логи postgres
docker compose -f docker-compose.production.yml logs postgres

# Попробовать подключиться вручную
docker compose -f docker-compose.production.yml exec postgres \
  psql -U pro_casa_user -d pro_casa_db -c "SELECT 1"
```

### Очистка и перезапуск с нуля

```bash
# ⚠️ ВНИМАНИЕ: Это удалит все данные!
docker compose -f docker-compose.production.yml down --volumes

# Удалить все образы
docker compose -f docker-compose.production.yml down --rmi all

# Запустить заново
./deploy-production.sh
```

---

## 🔐 Безопасность

### Рекомендации

1. **Firewall** - открывайте только порты 80 и 443
2. **SSH** - используйте ключи, отключите вход по паролю
3. **Секреты** - никогда не коммитьте `.env.production`
4. **Обновления** - регулярно обновляйте Docker образы
5. **Бэкапы** - храните бэкапы на отдельном сервере

### Настройка Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 📞 Поддержка

- **Email**: admin@casa.kz
- **Telegram**: @procasa_support

---

**Версия документации**: 1.0  
**Дата**: 2026-01-06
