/**
 * Плагин для отображения даты выхода ближайшего эпизода на карточках сериалов
 * Совместим с Lampa
 */
(function () {
    'use strict';

    window.NEXT_EPISODE_VER = '1.0';
    window.NEXT_EPISODE_LOADED = false;
    window.NEXT_EPISODE_ERROR = null;

    if (typeof Lampa === 'undefined') {
        window.NEXT_EPISODE_ERROR = 'Lampa not found';
        return;
    }

    var PLUGIN_NAME = 'next-episode-plugin';
    var STORAGE_PREFIX = 'next_episode_';
    var RETRY_ATTEMPTS = 3;
    var RETRY_DELAY = 1000;
    var CACHE_TTL = 30 * 60 * 1000; // 30 минут
    var episodeCache = {};

    // =================================================================
    // НАСТРОЙКИ
    // =================================================================

    var defaultSettings = {
        enabled: true
    };

    function getSettings() {
        var settings = Lampa.Storage.get(STORAGE_PREFIX + 'settings', defaultSettings);
        return Object.assign({}, defaultSettings, settings);
    }

    // =================================================================
    // TMDB API
    // =================================================================

    function getTmdbKey() {
        var custom = (Lampa.Storage.get('flixio_tmdb_apikey') || '').trim();
        return custom || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '');
    }

    function fetchNextEpisode(tmdbId, callback, attempt) {
        if (!tmdbId) return callback(null);

        attempt = attempt || 1;

        var cached = episodeCache[tmdbId];
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return callback(cached.data);
        }

        var lang = Lampa.Storage.get('language', 'ru');
        var url = Lampa.TMDB
            ? Lampa.TMDB.api('tv/' + tmdbId + '?api_key=' + getTmdbKey() + '&language=' + lang)
            : 'https://api.themoviedb.org/3/tv/' + tmdbId + '?api_key=' + getTmdbKey() + '&language=' + lang;

        var network = new Lampa.Reguest();

        network.silent(url, function (data) {
            episodeCache[tmdbId] = {
                timestamp: Date.now(),
                data: data
            };
            callback(data);
        }, function (error) {
            if (attempt < RETRY_ATTEMPTS) {
                setTimeout(function () {
                    fetchNextEpisode(tmdbId, callback, attempt + 1);
                }, RETRY_DELAY);
            } else {
                callback(null);
            }
        });
    }

    // =================================================================
    // РАСЧЁТ ДАТЫ
    // =================================================================

    function formatDaysUntil(airDateStr) {
        if (!airDateStr) return null;

        var parts = airDateStr.split('-');
        var airDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        var diffMs = airDate.getTime() - today.getTime();
        var diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return null; // уже вышел
        if (diffDays === 0) return 'Сегодня';
        if (diffDays === 1) return 'Завтра';

        // Склонение: дн. для краткости
        return 'Через ' + diffDays + ' дн.';
    }

    // =================================================================
    // БЕЙДЖ
    // =================================================================

    function createNextEpisodeBadge(text) {
        var badge = $('<div>', {
            class: 'card__badge card__badge--next-episode',
            text: text
        });
        return badge;
    }

    // =================================================================
    // ИНЪЕКЦИЯ В КАРТОЧКУ
    // =================================================================

    function isTvShow(movie) {
        return movie.name
            || movie.original_name
            || (movie.first_air_date && !movie.release_date)
            || movie.type === 'tv'
            || movie.media_type === 'tv'
            || movie.number_of_seasons > 0
            || (movie.seasons && Array.isArray(movie.seasons) && movie.seasons.length > 0)
            || movie.last_episode_to_air;
    }

    function processNextEpisodeData(data, view) {
        if (!data || !data.next_episode_to_air) return;

        var nextEp = data.next_episode_to_air;
        var text = formatDaysUntil(nextEp.air_date);
        if (!text) return;

        view.find('.card__badge--next-episode').remove();
        var badge = createNextEpisodeBadge(text);
        view.append(badge);
    }

    function injectNextEpisodeBadge(movie, view) {
        if (!getSettings().enabled) return;
        if (!isTvShow(movie)) return;

        // Если данные уже есть в объекте
        if (movie.next_episode_to_air) {
            processNextEpisodeData(movie, view);
            return;
        }

        var seriesId = movie.id || movie.tmdb_id;
        if (!seriesId) return;

        fetchNextEpisode(seriesId, function (data) {
            processNextEpisodeData(data, view);
        });
    }

    // =================================================================
    // ИНТЕГРАЦИЯ С LAMPA
    // =================================================================

    function initCardInjection() {
        function processCards() {
            $('.card:not(.next-episode-processed)').each(function () {
                var card = $(this);
                card.addClass('next-episode-processed');

                if (card.hasClass('hero-banner')) return;

                var movie = card.data('item')
                    || (card[0] && (card[0].card_data || card[0].item))
                    || null;

                if (movie && movie.id && !movie.size) {
                    var view = card.find('.card__view');
                    if (!view.length) view = card;

                    setTimeout(function () {
                        injectNextEpisodeBadge(movie, view);
                    }, 150);
                }
            });
        }

        var observer = new MutationObserver(function () {
            processCards();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(processCards, 600);

        Lampa.Listener.follow('full', function (event) {
            if (event.type === 'start') {
                setTimeout(function () {
                    var act = Lampa.Activity.active();
                    if (act && act.card) {
                        var renderEl = act.activity && act.activity.render && act.activity.render();
                        if (renderEl) {
                            injectNextEpisodeBadge(act.card, $(renderEl));
                        }
                    }
                }, 500);
            }
        });
    }

    // =================================================================
    // ИНИЦИАЛИЗАЦИЯ
    // =================================================================

    function init() {
        console.log('[NextEpisode] Initializing plugin v' + window.NEXT_EPISODE_VER);

        $('<style>').html(
            '.card__badge--next-episode {' +
            '  position: absolute;' +
            '  z-index: 15;' +
            '  bottom: 0;' +
            '  left: 0;' +
            '  right: 0;' +
            '  padding: 0.3em 0.4em;' +
            '  font-size: 0.72em;' +
            '  font-weight: bold;' +
            '  color: #fff;' +
            '  background: rgba(0, 0, 0, 0.75);' +
            '  text-align: center;' +
            '  text-shadow: 0 1px 2px rgba(0,0,0,0.8);' +
            '  pointer-events: none;' +
            '  white-space: nowrap;' +
            '  overflow: hidden;' +
            '  text-overflow: ellipsis;' +
            '  line-height: 1.3;' +
            '  box-sizing: border-box;' +
            '}' +
            '.hero-banner .card__badge--next-episode {' +
            '  display: none !important;' +
            '}'
        ).appendTo('head');

        initCardInjection();

        window.NEXT_EPISODE_LOADED = true;
        console.log('[NextEpisode] Plugin loaded successfully');
    }

    if (Lampa.ready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                init();
            }
        });
    }
})();
