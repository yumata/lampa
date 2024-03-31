# Lampa

Приложение полностью бесплатное и использует публичные ссылки для просмотра информации о фильмах, новинках, популярных фильмов и т.д. Вся доступная информация используется исключительно в познавательных целях, приложение не использует свои собственные серверы для распространения информации.

Исходники лампы доступны тут: https://github.com/yumata/lampa-source

#### Устройства
* LG WebOS
* Samsung Tizen
* MSX

## Установка для MSX

На данный момент ручная установка, вам необходим свой собственный хостинг или локальный веб-сервер.

1. Тут же нажмите на зеленую кнопку (Code) и выберите (Download ZIP) загрузите файлы на хостинг или веб-сервер.
2. Откройте файл `msx/start.json` и замените содержиое `{domain}` на свой домен или IP
3. Откройте MSX и выполните установку

## Docker образ

1. Соберите образ `docker build --build-arg domain={domain} -t lampa . `
2. Запустите контейнер `docker run -p 8080:80 -d --restart unless-stopped -it --name lampa lampa`

### Docker & Docker Compose

```bash
docker run --rm -d --restart unless-stopped --name lampa -p 8080:80 gentslava/lampa
```

#### Docker Compose

```yml
# docker-compose.yml

version: '3.3'
services:
    lampa:
        image: gentslava/lampa
        container_name: lampa
        ports:
            - 8080:80
        restart: unless-stopped
    ...

```