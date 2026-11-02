

function csstatsProfileUrl(steamId) {
    return 'https://csstats.gg/player/' + encodeURIComponent(String(steamId || ''));
}
