

const CSSTATS_RECENT_MAX = 10;

const CSSTATS_HEDGE_MS = 400;

function parseCSStatsMatchData(sourceHtml) {
    const src = String(sourceHtml || '');
    const m = src.match(/(?:window\.)?MATCH_DATA\s*=\s*\{/);
    if (!m || m.index === undefined) return undefined;
    const start = src.indexOf('{', m.index);
    if (start < 0) return undefined;

    let depth = 0, inStr = false, esc = false, end = -1;
    for (let i = start; i < src.length; i++) {
        const c = src[i];
        if (inStr) {
            if (esc) esc = false;
            else if (c === '\\') esc = true;
            else if (c === '"') inStr = false;
            continue;
        }
        if (c === '"') { inStr = true; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end < 0) return undefined;

    let obj;
    try { obj = JSON.parse(src.slice(start, end)); } catch (e) { return undefined; }
    const list = obj && Array.isArray(obj.rows) ? obj.rows : null;
    if (!list || !list.length) return undefined;

    const toMMDD = (ts) => {
        const d = new Date(ts * 1000);
        const mm = d.getMonth() + 1;
        const dd = d.getDate();
        return `${mm < 10 ? '0' : ''}${mm}-${dd < 10 ? '0' : ''}${dd}`;
    };

    const rows = [];
    for (const r of list) {
        if (!r || typeof r !== 'object') continue;
        const k = Number(r.k);
        const d = Number(r.d);
        const a = Number(r.a);
        const sc = Array.isArray(r.score) ? r.score : [];
        const s1 = Number(sc[0]);
        const s2 = Number(sc[1]);
        const hasScore = Number.isFinite(s1) && Number.isFinite(s2);
        const res = String(r.result || '').toLowerCase();
        const draw = res === 'n' || res === 'd' || (hasScore && s1 === s2);
        const win = !draw && (res === 'w' || (hasScore && s1 > s2));

        let map = String(r.map || '').replace(/^(?:de|cs)_/i, '');
        map = map ? map.charAt(0).toUpperCase() + map.slice(1) : '-';

        const ts = Number(r.date);
        const finished_at = (Number.isFinite(ts) && ts > 0) ? ts : undefined;
        const date = finished_at ? toMMDD(finished_at) : undefined;

        const rankType = (r.rank && r.rank.t) ? String(r.rank.t) : '';
        const rankNum = Number(r.rankSort);
        const rank = (rankType !== 'faceit' && Number.isFinite(rankNum) && rankNum > 0) ? rankNum : undefined;
        const isWingmanMatch = rankType === 'wingman' || /wingman/i.test(String(r.mode || '')) || /wingman/i.test(String(r.type || ''));

        const hasKd = Number.isFinite(k) && Number.isFinite(d);
        const kda = hasKd ? `${k}/${d}${Number.isFinite(a) ? '/' + a : ''}` : undefined;
        const kd = hasKd ? (d > 0 ? (k / d).toFixed(2) : String(k)) : undefined;
        const diff = hasKd ? k - d : undefined;
        const adr = (r.adr !== undefined && r.adr !== null) ? String(r.adr) : undefined;
        const hs = (r.hs !== undefined && r.hs !== null) ? String(r.hs) + '%' : undefined;

        rows.push({
            map,
            score: hasScore ? `${s1}:${s2}` : '-',
            win,
            ...(draw ? { draw: true } : {}),
            ...(isWingmanMatch ? { mode: 'wingman', rank_type: 7 } : {}),
            ...(finished_at ? { finished_at } : {}),
            ...(date ? { date } : {}),
            ...(rank !== undefined ? { rank } : {}),
            ...(kda ? { kda } : {}),
            ...(kd ? { kd } : {}),
            ...(diff !== undefined ? { diff } : {}),
            ...(adr ? { adr } : {}),
            ...(hs ? { hs } : {})
        });
        if (rows.length >= CSSTATS_RECENT_MAX) break;
    }
    return rows.length ? rows : undefined;
}

function parseCSStatsRecentMatches(statsHtml, profileHtml) {
    
    const rows = [];
    const sourceHtml = (statsHtml || '') + '\n' + (profileHtml || '');

    const matchDataRows = parseCSStatsMatchData(sourceHtml);
    if (matchDataRows && matchDataRows.length) return matchDataRows;

    if (sourceHtml.includes('match-list-outer') || sourceHtml.includes('match-row') || /id=["']?(?:matches|match-list|match-history)\b/i.test(sourceHtml) || /<th[^>]*>[\s\S]*?(?:date|map|score|日期|地图|比分)/i.test(sourceHtml)) {
        let matchSection = sourceHtml;
        const outerMatch = sourceHtml.match(/id="(?:match-list-outer|matches|match-history)"|class="[^"]*(?:match-list-outer|matches|match-history)[^"]*"/i);
        if (outerMatch && outerMatch.index !== undefined) {
            matchSection = sourceHtml.slice(outerMatch.index);
        }
        let tblM = matchSection.match(/<table\b[^>]*>([\s\S]*?)<\/table>/i);
        
        const isMatchTable = (html) => {
            if (!html) return false;
            if (/match-list|match-row/i.test(html)) return true;
            const hasDateHead = /<t[hd][^>]*>[\s\S]{0,30}?(?:date|日期)/i.test(html);
            const hasScore = /\b\d{1,2}\s*[:：]\s*\d{1,2}\b/.test(html);
            const hasStatHead = /<t[hd][^>]*>[\s\S]{0,20}?(?:kda|adr|hs%|rating|k\/d)/i.test(html);
            return (hasDateHead && hasScore) || (hasScore && hasStatHead);
        };
        if (tblM && !isMatchTable(tblM[0])) {
            const allTables = matchSection.match(/<table\b[^>]*>[\s\S]*?<\/table>/gi) || [];
            const found = allTables.find(isMatchTable);
            if (found) tblM = [found, found.replace(/^<table\b[^>]*>/i, '').replace(/<\/table>$/i, '')];
        }
        if (tblM) {
            matchSection = tblM[0];
        }

        const colMap = { date: -1, map: -1, score: -1, rank: -1, k: -1, d: -1, a: -1, kda: -1, diff: -1, hs: -1, adr: -1, rating: -1 };
        const applyHeaderCells = (cellHtmls) => {
            let colIdx = 0;
            for (const cellHtml of cellHtmls) {
                const thTxt = String(cellHtml).replace(/<[^>]+>/g, '').replace(/[▲▼▾▴↑↓]/g, '').trim().toUpperCase();
                if (/\b(?:DATE|TIME)\b|日期|时间/.test(thTxt)) colMap.date = colIdx;
                else if (/\bMAP\b|地图/.test(thTxt)) colMap.map = colIdx;
                else if (/\b(?:SCORE|RESULT)\b|比分|结果/.test(thTxt)) colMap.score = colIdx;
                else if (/\b(?:RANK|TIER)\b|段位|等级/.test(thTxt)) colMap.rank = colIdx;
                else if (/\bKDA\b|K\/D\/A|K-D-A/.test(thTxt)) colMap.kda = colIdx;
                else if (/\b(?:K|KILL|KILLS)\b|击杀|杀敌/.test(thTxt)) colMap.k = colIdx;
                else if (/\b(?:D|DEATH|DEATHS)\b|死亡/.test(thTxt)) colMap.d = colIdx;
                else if (/\b(?:A|ASSIST|ASSISTS)\b|助攻/.test(thTxt)) colMap.a = colIdx;
                else if (/\b(?:DIFF|\+\/\-|\+\-)\b|差值/.test(thTxt) || thTxt.includes('+/-')) colMap.diff = colIdx;
                else if (/\b(?:HS|HEADSHOT)\b|爆头/.test(thTxt)) colMap.hs = colIdx;
                else if (/\bADR\b|均伤/.test(thTxt)) colMap.adr = colIdx;
                else if (/\bRATING\b|评分/.test(thTxt)) colMap.rating = colIdx;
                colIdx++;
            }
        };
        const theadM = matchSection.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
        if (theadM) {
            const thTexts = [];
            const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
            let thM;
            while ((thM = thRegex.exec(theadM[1])) !== null) thTexts.push(thM[1]);
            applyHeaderCells(thTexts);
        }

        const tbodyM = matchSection.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
        const rowsHtml = tbodyM ? tbodyM[1] : matchSection;

        let skipFirstRow = false;
        if (!theadM) {
            const firstTrM = rowsHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
            if (firstTrM) {
                const headCells = [];
                const htdRegex = /<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/gi;
                let htdM;
                while ((htdM = htdRegex.exec(firstTrM[1])) !== null) headCells.push(htdM[2]);
                const joined = headCells.map(t => t.replace(/<[^>]+>/g, '').trim().toUpperCase()).join('|');
                const hits = ['DATE', 'MAP', 'SCORE', 'RANK', 'ADR', 'RATING', 'HS'].filter(k => joined.includes(k)).length;
                if (headCells.length >= 3 && hits >= 2) {
                    applyHeaderCells(headCells);
                    skipFirstRow = true;
                }
            }
        }

        const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let trMatch;
        let rowIndex = -1;

        const cellText = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
        
        const looksLikeDate = (txt) => {
            const t = String(txt || '').trim();
            if (!t || t.length > 48) return false;
            if (/^\d{1,2}\s*[:：]\s*\d{1,2}$/.test(t)) return false;          
            if (/^[+\-]?\d{1,4}(?:\.\d+)?%?$/.test(t)) return false;          
            if (/^(?:yesterday|today|昨天|今天|前天)$/i.test(t)) return true;
            if (/\b\d{1,3}\s*(?:seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|wks?|months?|mos?|years?|yrs?|s|m|h|d|w|y)\b(?:\s*ago)?/i.test(t)) return true;
            if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i.test(t)) return true;
            if (/\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/.test(t)) return true;
            if (/\b\d{1,2}[-/.]\d{1,2}(?:[-/.]\d{2,4})?\b/.test(t)) return true;
            if (/\d{1,2}月\d{1,2}日/.test(t)) return true;
            return false;
        };

        while ((trMatch = trRegex.exec(rowsHtml)) !== null) {
            rowIndex++;
            if (skipFirstRow && rowIndex === 0) continue;
            const trHtml = trMatch[1];
            const fullTr = trMatch[0];

            if (/<th\b/i.test(trHtml) && !/<td\b/i.test(trHtml)) continue;

            const cells = [];
            const tdRegex = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
            let tdM;
            while ((tdM = tdRegex.exec(trHtml)) !== null) {
                cells.push({ attrs: tdM[1] || '', html: tdM[2] || '' });
            }
            if (cells.length < 2) continue;

            const findCell = (clsName, colIdx) => {
                const byCls = cells.find(c => new RegExp(`\\b${clsName}\\b`, 'i').test(c.attrs));
                if (byCls !== undefined) return byCls.html;
                if (colIdx >= 0 && colIdx < cells.length) return cells[colIdx].html;
                return '';
            };

            const mapCell = findCell('map', colMap.map);
            const scoreCell = findCell('score', colMap.score);
            let dateCell = findCell('date', colMap.date);
            
            if (!looksLikeDate(cellText(dateCell))) {
                const scannedDate = cells.find(c => looksLikeDate(cellText(c.html)));
                if (scannedDate) dateCell = scannedDate.html;
            }
            const rankCell = findCell('rank', colMap.rank);
            const adrCell = findCell('adr', colMap.adr);
            const hsCell = findCell('hs', colMap.hs);

            let win = false;
            let draw = false;
            let hasResultMarker = false;
            const isWingmanMatch = /wingman/i.test(fullTr);
            const scrubbedTr = fullTr.replace(/wingman/gi, '');
            if (/match-draw|class="[^"]*\b(?:draw|tie)\b[^"]*"|color:\s*blue/i.test(scrubbedTr)) {
                draw = true;
                win = false;
                hasResultMarker = true;
            } else if (/match-win|class="[^"]*\bwin\b[^"]*"|color:\s*green/i.test(scrubbedTr)) {
                win = true;
                hasResultMarker = true;
            } else if (/match-lose|class="[^"]*\b(?:lose|loss)\b[^"]*"|color:\s*red/i.test(scrubbedTr)) {
                win = false;
                hasResultMarker = true;
            }

            let map = '';
            const mapImgM = mapCell.match(/<img[^>]*alt="([^"]+)"/i);
            const mapSpanM = mapCell.match(/<span>\s*([^<]+)\s*<\/span>/i);
            if (mapImgM) {
                map = mapImgM[1].trim();
            } else if (mapSpanM) {
                map = mapSpanM[1].trim();
            } else {
                const mapFallbackM = (mapCell || trHtml).match(/\b(?:de_)?(mirage|inferno|dust2|nuke|anubis|ancient|vertigo|overpass|office|italy|cache|train|thera|mills)\b/i);
                if (mapFallbackM) map = mapFallbackM[1];
            }
            if (!map) {
                for (const c of cells) {
                    const m = (c.html + ' ' + c.attrs).match(/\b(?:de_)?(mirage|inferno|dust2|nuke|anubis|ancient|vertigo|overpass|office|italy|cache|train|thera|mills)\b/i);
                    if (m) {
                        map = m[1];
                        break;
                    }
                }
            }
            if (map) {
                const rawMap = map.replace(/^de_/, '');
                map = rawMap.charAt(0).toUpperCase() + rawMap.slice(1);
            }

            let score = '-';
            const scoreM = (scoreCell || trHtml).match(/(\d{1,2}\s*[:\-–]\s*\d{1,2})/i);
            if (scoreM) {
                score = scoreM[1].replace(/\s+/g, '').replace(/[–\-]/, ':');
            } else {
                for (const c of cells) {
                    const m = c.html.match(/\b(\d{1,2}\s*[:\-–]\s*\d{1,2})\b/);
                    if (m) {
                        score = m[1].replace(/\s+/g, '').replace(/[–\-]/, ':');
                        break;
                    }
                }
            }
            if (score !== '-') {
                const parts = score.split(':');
                if (parts.length === 2) {
                    const s1 = parseInt(parts[0], 10);
                    const s2 = parseInt(parts[1], 10);
                    if (s1 === s2 && !win) {
                        draw = true;
                    }
                    
                    if (!hasResultMarker && !draw && s1 !== s2) {
                        win = s1 > s2;
                    }
                }
            }

            let finished_at = undefined;
            let date = undefined;
            const dateAttrM = fullTr.match(/data-(?:date|timestamp)="(\d+)"/i)
                || dateCell.match(/data-(?:date|timestamp)="(\d+)"/i);
            if (dateAttrM) {
                let ts = parseInt(dateAttrM[1], 10);
                if (ts > 1000000000000) ts = Math.floor(ts / 1000);
                if (Number.isFinite(ts) && ts > 0) finished_at = ts;
            }

            const titleM = (dateCell || fullTr).match(/title="([^"]*(?:20\d\d|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}[-/.]\d{1,2})[^"]*)"/i);
            const titleDateStr = titleM ? titleM[1].replace(/^Last match\s*[-—–]\s*/i, '').trim() : '';

            const rawDateText = cellText(dateCell);
            
            const cleanDateText = looksLikeDate(rawDateText) ? rawDateText : '';

            const parseDateCandidate = (str) => {
                if (!str) return null;
                const scrubbed = str.replace(/(\d+)(?:st|nd|rd|th)/gi, '$1');
                const parsedTs = Date.parse(scrubbed);
                if (Number.isFinite(parsedTs) && parsedTs > 0) {
                    return Math.floor(parsedTs / 1000);
                }
                return null;
            };

            if (!finished_at && titleDateStr) {
                const pts = parseDateCandidate(titleDateStr);
                if (pts) finished_at = pts;
            }
            if (!finished_at && cleanDateText) {
                const pts = parseDateCandidate(cleanDateText);
                if (pts) finished_at = pts;
            }

            const toMMDD = (dObj) => {
                const m = dObj.getMonth() + 1;
                const d = dObj.getDate();
                return `${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
            };

            const checkDateText = titleDateStr || cleanDateText;
            const monthsMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
            const enM1 = checkDateText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
            const enM2 = checkDateText.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/i);
            const relM = checkDateText.match(/\b(\d{1,3})\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|wks?|months?|mos?|years?|yrs?|s|m|h|d|w|y)\b(?:\s*ago)?/i);
            if (enM2) {
                
                const d = parseInt(enM2[1], 10);
                const m = monthsMap[enM2[2].slice(0, 3).toLowerCase()];
                date = `${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
            } else if (enM1) {
                const m = monthsMap[enM1[1].slice(0, 3).toLowerCase()];
                const d = parseInt(enM1[2], 10);
                date = `${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
            } else if (/昨天|yesterday/i.test(checkDateText)) {
                const yd = new Date(Date.now() - 86400000);
                date = toMMDD(yd);
                if (!finished_at) finished_at = Math.floor(yd.getTime() / 1000);
            } else if (/前天/i.test(checkDateText)) {
                const yd = new Date(Date.now() - 86400000 * 2);
                date = toMMDD(yd);
                if (!finished_at) finished_at = Math.floor(yd.getTime() / 1000);
            } else if (relM) {
                
                const n = parseInt(relM[1], 10);
                const unit = relM[2].toLowerCase();
                let unitMs = 3600000;
                if (/^(?:s|sec)/.test(unit)) unitMs = 1000;
                else if (/^(?:m|min)/.test(unit)) unitMs = 60000;
                else if (/^(?:h|hr)/.test(unit)) unitMs = 3600000;
                else if (/^(?:d|day)/.test(unit)) unitMs = 86400000;
                else if (/^(?:w|wk|week)/.test(unit)) unitMs = 604800000;
                else if (/^(?:mo|month)/.test(unit)) unitMs = 2592000000;
                else if (/^(?:y|yr|year)/.test(unit)) unitMs = 31536000000;
                const dObj = new Date(Date.now() - n * unitMs);
                date = toMMDD(dObj);
                if (!finished_at) finished_at = Math.floor(dObj.getTime() / 1000);
            } else {
                const isoM = checkDateText.match(/\b(?:\d{4}|\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
                const zhM = checkDateText.match(/(?:\d{1,4}(?:st|nd|rd|th)?年)?\s*(\d{1,2})月(\d{1,2})日/i);
                const euM = checkDateText.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](?:\d{4}|\d{2})\b/);
                const mdM = checkDateText.match(/(?:^|[^\d])(\d{1,2})[-/](\d{1,2})(?:$|[^\d])/);
                if (isoM) {
                    const m = parseInt(isoM[1], 10);
                    const d = parseInt(isoM[2], 10);
                    date = `${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
                } else if (zhM) {
                    const m = parseInt(zhM[1], 10);
                    const d = parseInt(zhM[2], 10);
                    date = `${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
                } else if (euM) {
                    let d = parseInt(euM[1], 10);
                    let m = parseInt(euM[2], 10);
                    if (m > 12 && d <= 12) { const tmp = m; m = d; d = tmp; }
                    date = `${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
                } else if (mdM) {
                    const m = parseInt(mdM[1], 10);
                    const d = parseInt(mdM[2], 10);
                    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                        date = `${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
                    }
                }
            }
            
            if (!date && finished_at) {
                date = toMMDD(new Date(finished_at * 1000));
            }

            let rank = undefined;
            const medalM = rankCell.match(/\/(?:ranks|medals)\/(\d+)\.(?:png|svg)/i)
                || rankCell.match(/alt="[^"]*?(?:Rank|Lv|Skill Group)\s*(\d+)/i);
            if (medalM) {
                rank = parseInt(medalM[1], 10);
            } else {
                const premAll = rankCell.match(/\b\d{1,2}[,\s]\d{3}\b/g)
                    || rankCell.match(/\b\d{4,5}\b/g);
                if (premAll && premAll.length) {
                    const lastNum = parseInt(premAll[premAll.length - 1].replace(/[,\s]/g, ''), 10);
                    if (Number.isFinite(lastNum) && lastNum >= 1000 && lastNum <= 40000) {
                        rank = lastNum;
                    }
                } else {
                    const rawRankNum = parseInt(rankCell.replace(/<[^>]+>/g, '').replace(/[,\s]/g, ''), 10);
                    if (Number.isFinite(rawRankNum) && rawRankNum > 0 && rawRankNum <= 40000) {
                        rank = rawRankNum;
                    }
                }
            }

            if (rank === undefined) {
                const rowMedal = fullTr.match(/\/(?:ranks|medals)\/(\d+)\.(?:png|svg)/i);
                if (rowMedal) {
                    const rn = parseInt(rowMedal[1], 10);
                    if (Number.isFinite(rn) && rn >= 0 && rn <= 40000) rank = rn;
                }
            }

            let kda = undefined;
            let kd = undefined;
            let diff = undefined;

            if (colMap.kda >= 0 && colMap.kda < cells.length) {
                const rawKda = cells[colMap.kda].html.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
                const m = rawKda.match(/\b(\d{1,3}\/\d{1,3}(?:\/\d{1,3})?)\b/);
                if (m) kda = m[1];
            }

            if (!kda && colMap.k >= 0 && colMap.d >= 0 && colMap.k < cells.length && colMap.d < cells.length) {
                const k = parseInt(cells[colMap.k].html.replace(/<[^>]+>/g, '').trim(), 10);
                const d = parseInt(cells[colMap.d].html.replace(/<[^>]+>/g, '').trim(), 10);
                const a = colMap.a >= 0 && colMap.a < cells.length ? parseInt(cells[colMap.a].html.replace(/<[^>]+>/g, '').trim(), 10) : undefined;
                if (Number.isFinite(k) && Number.isFinite(d)) {
                    kda = `${k}/${d}${Number.isFinite(a) ? '/' + a : ''}`;
                    kd = d > 0 ? (k / d).toFixed(2) : String(k);
                }
            }

            if (!kda) {
                const kdaCell = cells.find(c => /\bkda\b/i.test(c.attrs) || (/\bkd\b/i.test(c.attrs) && c.html.includes('/')));
                if (kdaCell) {
                    const m = kdaCell.html.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim().match(/\b(\d{1,3}\/\d{1,3}(?:\/\d{1,3})?)\b/);
                    if (m) kda = m[1];
                }
                if (!kda) {
                    const kCell = cells.find(c => /\bk\b/i.test(c.attrs));
                    const dCell = cells.find(c => /\bd\b/i.test(c.attrs));
                    const aCell = cells.find(c => /\ba\b/i.test(c.attrs));
                    if (kCell && dCell) {
                        const k = parseInt(kCell.html.replace(/<[^>]+>/g, '').trim(), 10);
                        const d = parseInt(dCell.html.replace(/<[^>]+>/g, '').trim(), 10);
                        const a = aCell ? parseInt(aCell.html.replace(/<[^>]+>/g, '').trim(), 10) : undefined;
                        if (Number.isFinite(k) && Number.isFinite(d)) {
                            kda = `${k}/${d}${Number.isFinite(a) ? '/' + a : ''}`;
                            kd = d > 0 ? (k / d).toFixed(2) : String(k);
                        }
                    }
                }
                if (!kda) {
                    for (const c of cells) {
                        const txt = c.html.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
                        const m = txt.match(/^(\d{1,3}\/\d{1,3}(?:\/\d{1,3})?)$/);
                        if (m) {
                            kda = m[1];
                            break;
                        }
                    }
                }
            }

            let diffIdx = -1;
            if (!kda) {
                const scanDiffIdx = cells.findIndex(c => /^[+\-]\d{1,3}$/.test(cellText(c.html).replace(/\s+/g, '')));
                if (scanDiffIdx >= 3) {
                    const kNum = parseInt(cellText(cells[scanDiffIdx - 3].html), 10);
                    const dNum = parseInt(cellText(cells[scanDiffIdx - 2].html), 10);
                    const aNum = parseInt(cellText(cells[scanDiffIdx - 1].html), 10);
                    if (Number.isFinite(kNum) && Number.isFinite(dNum) && Number.isFinite(aNum)
                        && kNum >= 0 && kNum <= 200 && dNum >= 0 && dNum <= 200 && aNum >= 0 && aNum <= 200) {
                        kda = `${kNum}/${dNum}/${aNum}`;
                        kd = dNum > 0 ? (kNum / dNum).toFixed(2) : String(kNum);
                        diff = kNum - dNum;
                        diffIdx = scanDiffIdx;
                    }
                }
            }

            if (colMap.diff >= 0 && colMap.diff < cells.length) {
                const diffTxt = cells[colMap.diff].html.replace(/<[^>]+>/g, '').trim();
                const dParsed = parseInt(diffTxt, 10);
                if (Number.isFinite(dParsed)) diff = dParsed;
            }

            if (diffIdx < 0) {
                diffIdx = cells.findIndex(c => /^[+\-]\d{1,3}$/.test(cellText(c.html).replace(/\s+/g, '')));
            }
            if (diff === undefined && diffIdx >= 0) {
                const dParsed = parseInt(cellText(cells[diffIdx].html).replace(/[+\s]/g, ''), 10);
                if (Number.isFinite(dParsed)) diff = dParsed;
            }

            if (!kd && kda) {
                const parts = kda.split('/');
                if (parts.length >= 2) {
                    const k = parseInt(parts[0], 10);
                    const d = parseInt(parts[1], 10);
                    if (Number.isFinite(k) && Number.isFinite(d)) {
                        kd = d > 0 ? (k / d).toFixed(2) : String(k);
                        if (diff === undefined) diff = k - d;
                    }
                }
            }

            if (!kd) {
                const kdCell = findCell('kd', -1);
                const kdM = kdCell.match(/>\s*([\d.]+)\s*</)
                    || kdCell.match(/\b([\d.]+)\b/)
                    || trHtml.match(/data-kd="([\d.]+)"/i);
                if (kdM) {
                    kd = kdM[1];
                }
            }

            let adr = undefined;
            const adrM = adrCell.match(/class="adr"[^>]*>\s*([\d.]+)/i)
                || adrCell.match(/>\s*([\d.]+)\s*</)
                || adrCell.match(/\b([\d.]+)\b/);
            if (adrM && Number.isFinite(parseFloat(adrM[1]))) {
                adr = adrM[1];
            }

            let hs = undefined;
            const hsM = hsCell.match(/class="hs"[^>]*>\s*([\d.]+%?)/i)
                || hsCell.match(/>\s*(\d{1,3}%?)\s*</)
                || hsCell.match(/(\d{1,3}%?)/);
            if (hsM && hsM[1]) {
                hs = hsM[1].endsWith('%') ? hsM[1] : hsM[1] + '%';
            }

            if (diffIdx >= 0) {
                if (!hs && cells[diffIdx + 1]) {
                    const hsTxt = cellText(cells[diffIdx + 1].html);
                    const hsNum = parseInt(hsTxt, 10);
                    if (/^\d{1,3}%?$/.test(hsTxt) && Number.isFinite(hsNum) && hsNum >= 0 && hsNum <= 100) {
                        hs = hsNum + '%';
                    }
                }
                if (!adr && cells[diffIdx + 2]) {
                    const adrTxt = cellText(cells[diffIdx + 2].html);
                    const adrNum = parseFloat(adrTxt);
                    if (/^\d{1,3}(?:\.\d+)?$/.test(adrTxt) && Number.isFinite(adrNum) && adrNum > 0 && adrNum <= 300) {
                        adr = adrTxt;
                    }
                }
            }

            if (map || score !== '-') {
                rows.push({
                    map: map || '-',
                    score,
                    win,
                    ...(draw ? { draw: true } : {}),
                    ...(isWingmanMatch ? { mode: 'wingman', rank_type: 7 } : {}),
                    ...(finished_at ? { finished_at } : {}),
                    ...(date ? { date } : {}),
                    ...(rank !== undefined ? { rank } : {}),
                    ...(kda ? { kda } : {}),
                    ...(kd ? { kd } : {}),
                    ...(diff !== undefined ? { diff } : {}),
                    ...(adr ? { adr } : {}),
                    ...(hs ? { hs } : {})
                });
            }
        }
    }

    if (!rows.length) {
        const statsM = sourceHtml.match(/var\s+stats\s*=\s*(\{[\s\S]*?\});/);
        if (statsM) {
            try {
                const sObj = JSON.parse(statsM[1]);
                if (sObj && Array.isArray(sObj.past10)) {
                    const list = sObj.past10.slice().reverse();
                    list.forEach(item => {
                        if (!item) return;
                        const isWin = item.result === 'win';
                        const isDraw = item.result === 'draw';
                        let mapName = String(item.map || '').replace(/^de_/, '');
                        if (mapName) mapName = mapName.charAt(0).toUpperCase() + mapName.slice(1);
                        let kdaStr = undefined;
                        let kVal = item.kills ?? item.k;
                        let dVal = item.deaths ?? item.d;
                        let aVal = item.assists ?? item.a;
                        if (kVal !== undefined && dVal !== undefined) {
                            kdaStr = `${kVal}/${dVal}${aVal !== undefined ? '/' + aVal : ''}`;
                        } else if (item.kda) {
                            kdaStr = String(item.kda);
                        }
                        let kdStr = undefined;
                        let diffVal = undefined;
                        if (item.kd !== undefined) {
                            const numKd = Number(item.kd);
                            
                            if (Number.isInteger(numKd) || numKd < 0) {
                                diffVal = numKd;
                            } else {
                                kdStr = String(item.kd);
                            }
                        }
                        if (item.diff !== undefined) {
                            const numD = Number(item.diff);
                            if (Number.isFinite(numD)) diffVal = numD;
                        }
                        let parsedDate = undefined;
                        let finished_at = undefined;
                        const itemTs = item.timestamp || item.ts || item.created || item.finished_at || undefined;
                        const itemDate = item.date || item.datetime || item.created_at || item.time || undefined;
                        if (itemTs && Number.isFinite(Number(itemTs))) {
                            let ts = Number(itemTs);
                            if (ts > 1e11) ts = Math.floor(ts / 1000);
                            finished_at = ts;
                            const ed = new Date(ts * 1000);
                            const ym = ed.getMonth() + 1;
                            const yday = ed.getDate();
                            parsedDate = `${ym < 10 ? '0' : ''}${ym}-${yday < 10 ? '0' : ''}${yday}`;
                        } else if (itemDate) {
                            const ds = String(itemDate);
                            const clean = ds.replace(/(\d+)(?:st|nd|rd|th)/gi, '$1');
                            const pts = Date.parse(clean);
                            if (Number.isFinite(pts) && pts > 0) {
                                finished_at = Math.floor(pts / 1000);
                                const ed = new Date(pts);
                                const ym = ed.getMonth() + 1;
                                const yday = ed.getDate();
                                parsedDate = `${ym < 10 ? '0' : ''}${ym}-${yday < 10 ? '0' : ''}${yday}`;
                            } else {
                                const dM = ds.match(/(\d{1,2})[\/\-](\d{1,2})/);
                                if (dM) {
                                    const m = parseInt(dM[1], 10);
                                    const d = parseInt(dM[2], 10);
                                    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                                        parsedDate = `${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
                                    }
                                }
                            }
                        }
                        rows.push({
                            map: mapName || '-',
                            score: item.score || '-',
                            win: isWin,
                            ...(isDraw ? { draw: true } : {}),
                            ...(item.rank !== undefined ? { rank: item.rank } : {}),
                            ...(parsedDate ? { date: parsedDate } : {}),
                            ...(finished_at ? { finished_at } : {}),
                            ...(kdaStr ? { kda: kdaStr } : {}),
                            ...(kdStr ? { kd: kdStr } : {}),
                            ...(diffVal !== undefined ? { diff: diffVal } : {}),
                            ...(item.adr !== undefined ? { adr: String(item.adr) } : {}),
                            ...(item.hs !== undefined ? { hs: String(item.hs) + '%' } : {})
                        });
                    });
                }
            } catch (e) {  }
        }
    }

    return rows.length ? rows.slice(0, CSSTATS_RECENT_MAX) : undefined;
}

function parseCSStatsHtml(profileHtml, statsHtml) {
    if (!profileHtml && !statsHtml) return { error: 'NETWORK_ERROR' };

    const pStr = String(profileHtml || '');
    const sStr = String(statsHtml || '');

    const isCf = (str) => /<title>Just a moment\.\.\.<\/title>/i.test(str)
        || /id="cf-challenge/i.test(str)
        || /cf-browser-verification/i.test(str)
        || /Checking your browser/i.test(str);
    if (isCf(pStr) || isCf(sStr)) return { error: 'CF_CHALLENGE' };

    if (/<h1[^>]*>\s*Private Profile\s*<\/h1>/i.test(pStr) || /id="outer-wrapper"[\s\S]*?Private Profile/i.test(pStr)) {
        return { error: 'PRIVATE' };
    }

    if (!sStr.includes('content-sub-nav-outer') && !pStr.includes('rank-panel')) {
        return { error: 'NOT_FOUND' };
    }

    const nameMatch = pStr.match(/id="player-name"[^>]*>([^<]+)<\/(?:span|div)>/i)
        || sStr.match(/id="player-name"[^>]*>([^<]+)<\/(?:span|div)>/i)
        || pStr.match(/<h1[^>]*class="[^"]*\bid-name\b[^"]*"[^>]*>([^<]+)<\/h1>/i)
        || sStr.match(/<h1[^>]*class="[^"]*\bid-name\b[^"]*"[^>]*>([^<]+)<\/h1>/i)
        || pStr.match(/class="[^"]*\bid-name\b[^"]*"[^>]*title="([^"]+)"/i);
    const name = nameMatch ? nameMatch[1].trim() : undefined;

    const kpdMatch = sStr.match(/id="kpd"[^>]*>[\s\S]*?<span>\s*([\d.]+)\s*<\/span>/i);
    const kd_ratio = kpdMatch ? parseFloat(kpdMatch[1]) : undefined;

    const ratingMatch = sStr.match(/id="rating"[^>]*>[\s\S]*?<span>\s*([\d.]+)\s*<\/span>/i);
    const hltv_rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

    let most_played_map = undefined;
    const mapMatch = sStr.match(/class="[^"]*maps-body[^"]*"[^>]*>[\s\S]*?class="row"[^>]*data-name="([^"]+)"/i)
        || sStr.match(/id="([^"]+)-wr-chart-canvas"/i);
    if (mapMatch) {
        let rawMap = mapMatch[1].trim().replace(/^de_/, '');
        most_played_map = rawMap.charAt(0).toUpperCase() + rawMap.slice(1);
    }

    let win_rate = undefined;
    let matches = undefined;
    let hs_percentage = undefined;
    let adr = undefined;
    let clutch = undefined;

    const statBlockRegex = /<div class="[^"]*stat-heading[^"]*"[^>]*>([\s\S]*?)<\/div>[\s\S]*?style="[^"]*font-size:\s*34px[^"]*"[^>]*>([\s\S]*?)(?=<div class="[^"]*stat-panel"|<div class="[^"]*stat-heading"|<div class="[^"]*match-dot"|$)/gi;
    let sMatch;
    while ((sMatch = statBlockRegex.exec(sStr)) !== null) {
        const heading = sMatch[1].replace(/<[^>]+>/g, '').trim();
        const valText = sMatch[2].replace(/<[^>]+>/g, '').trim();
        const valMatch = valText.match(/[\d.]+/);
        if (!valMatch) continue;
        const numVal = Math.round(parseFloat(valMatch[0]));
        if (!Number.isFinite(numVal)) continue;

        if (/win/i.test(heading)) {
            win_rate = numVal;
            const nextHeadingIdx = sStr.indexOf('class="stat-heading"', sMatch.index + heading.length);
            const blockEnd = nextHeadingIdx !== -1 ? nextHeadingIdx : sStr.length;
            const rest = sStr.slice(sMatch.index, blockEnd);
            const totalMatch = rest.match(/class="total-value"[^>]*>([\d,]+)/i);
            if (totalMatch) matches = parseInt(totalMatch[1].replace(/,/g, ''), 10);
        } else if (heading.includes('HS') && hs_percentage === undefined) {
            hs_percentage = numVal;
        } else if (heading.includes('ADR')) {
            adr = numVal;
        } else if (heading.includes('Clutch')) {
            clutch = numVal;
        }
    }

    if (win_rate === undefined) {
        
        const wrBlockM = sStr.match(/(?:<div[^>]*class="[^"]*stat-heading[^"]*"[^>]*>[\s\S]*?win[\s\S]*?<\/div>|Win\s*Rate)[\s\S]{0,300}?(\d{1,3})\s*%/i);
        if (wrBlockM) {
            const parsedWr = parseInt(wrBlockM[1], 10);
            if (Number.isFinite(parsedWr) && parsedWr >= 0 && parsedWr <= 100) {
                win_rate = parsedWr;
            }
        }
    }
    if (win_rate === undefined) {
        
        const wonM = sStr.match(/Won[\s\S]{0,100}?>\s*([\d,]+)\s*</i);
        const playedM = sStr.match(/Played[\s\S]{0,100}?>\s*([\d,]+)\s*</i);
        if (wonM && playedM) {
            const won = parseInt(wonM[1].replace(/,/g, ''), 10);
            const played = parseInt(playedM[1].replace(/,/g, ''), 10);
            if (Number.isFinite(won) && Number.isFinite(played) && played > 0) {
                win_rate = Math.round((won / played) * 100);
                if (matches === undefined) matches = played;
            }
        }
    }

    const dots = [];
    const dotRegex = /class="match-dot\s+([^"]+)"/gi;
    let dMatch;
    while ((dMatch = dotRegex.exec(sStr)) !== null) {
        const cls = dMatch[1];
        if (cls.includes('match-win')) dots.push('W');
        else if (cls.includes('match-lose')) dots.push('L');
        else if (cls.includes('match-draw')) dots.push('T');
    }
    const recent_results = dots.length ? dots.slice(-5).reverse() : undefined;

    let premier = undefined;
    const competitive = [];
    let wingman = undefined;
    let csgo = undefined;

    const parseRating = (snippet) => {
        if (!snippet || snippet.includes('class="dash"') || snippet.includes('---')) return 0;
        
        const ratingM = snippet.match(/class="cs2rating[^"]*"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);
        if (ratingM) {
            const cleaned = ratingM[1].replace(/<[^>]+>/g, '').replace(/[,\s]/g, '');
            const num = parseInt(cleaned, 10);
            return (Number.isFinite(num) && num > 0 && num <= 40000) ? num : 0;
        }
        
        const stripped = snippet.replace(/<small>[,\s]*(\d+)\s*<\/small>/gi, '$1')
            .replace(/<[^>]+>/g, ' ')
            .replace(/,/g, '');
        const m = stripped.match(/\b\d{1,5}\b/);
        if (m) {
            const num = parseInt(m[0], 10);
            return (Number.isFinite(num) && num <= 40000) ? num : 0;
        }
        return 0;
    };

    const parseMedal = (snippet) => {
        const m = snippet.match(/\/(\d+)\.(?:png|svg)/i);
        return m ? parseInt(m[1], 10) : undefined;
    };

    const premierBlockM = pStr.match(/<div class="sec"[^>]*>[\s\S]*?Premier[\s\S]*?<\/div>([\s\S]*?)(?=<div class="sec"|$)/i);
    if (premierBlockM) {
        const pBlock = premierBlockM[0];
        let currentRating = 0;
        let bestRating = 0;
        let seasonNum = 1;
        const history = [];

        const pmNowM = pBlock.match(/class="pm-now"[^>]*>([\s\S]*?)(?=<div class="rk-row"|<div class="rk-head"|$)/i);
        if (pmNowM) {
            const nowBlock = pmNowM[1];
            const seasonTextM = pBlock.match(/class="sec-s"[^>]*>\s*S(?:eason)?\s*(\d+)/i);
            if (seasonTextM) seasonNum = parseInt(seasonTextM[1], 10);

            const currM = nowBlock.match(/class="k"[^>]*>\s*Current\s*<\/(?:span|div)>[\s\S]*?class="v"[^>]*>([\s\S]*?)(?=<div class="pm-c"|<span class="k"|$)/i);
            if (currM) currentRating = parseRating(currM[1]);

            const bestM = nowBlock.match(/class="k"[^>]*>\s*Best\s*<\/(?:span|div)>[\s\S]*?class="v"[^>]*>([\s\S]*?)(?=<div class="pm-c"|<span class="k"|$)/i);
            if (bestM) bestRating = parseRating(bestM[1]);

            const winsM = nowBlock.match(/class="k"[^>]*>\s*Wins\s*<\/(?:span|div)>[\s\S]*?class="num"[^>]*>(\d+)/i)
                || nowBlock.match(/class="k"[^>]*>\s*Wins\s*<\/(?:span|div)>[\s\S]*?class="v"[^>]*>[\s\S]*?(\d+)/i);
            const wins = winsM ? parseInt(winsM[1], 10) : 0;

            history.push({ season: seasonNum, current: currentRating, best: bestRating, wins });
        }

        const rkRowRegex = /<div class="rk-row[^"]*"[^>]*>([\s\S]*?)(?=<div class="rk-row|<div class="sec"|$)/gi;
        let rkMatch;
        while ((rkMatch = rkRowRegex.exec(pBlock)) !== null) {
            const row = rkMatch[1];
            const sMatch = row.match(/class="nm"[^>]*>\s*S(\d+)/i);
            if (!sMatch) continue;
            const sn = parseInt(sMatch[1], 10);
            const wMatch = row.match(/class="rk-w"[^>]*>\s*(\d+)/i);
            const wins = wMatch ? parseInt(wMatch[1], 10) : 0;
            const vMatches = [];
            const rkVRegex = /<(?:span|div) class="rk-v"[^>]*>([\s\S]*?)<\/(?:span|div)>/gi;
            let vm;
            while ((vm = rkVRegex.exec(row)) !== null) vMatches.push(parseRating(vm[1]));
            history.push({ season: sn, current: vMatches[0] || 0, best: vMatches[1] || 0, wins });
        }

        let allTimeBest = Math.max(bestRating, currentRating);
        for (const h of history) {
            if (h.best && h.best > allTimeBest) allTimeBest = h.best;
            if (h.current && h.current > allTimeBest) allTimeBest = h.current;
        }

        premier = {
            current: currentRating,
            best: allTimeBest,
            season: seasonNum,
            history
        };
    }

    const compRegex = /<div class="[^"]*rk-row is-map[^"]*"[^>]*>([\s\S]*?)(?=<div class="[^"]*rk-row|<div class="sec"|$)/gi;
    let cMatch;
    while ((cMatch = compRegex.exec(pStr)) !== null) {
        const row = cMatch[1];
        const mapNameM = row.match(/class="mi"[^>]*alt="([^"]+)"/i);
        if (!mapNameM) continue;
        const rawMap = mapNameM[1].trim();
        const wMatch = row.match(/class="rk-w"[^>]*>\s*(\d+)/i);
        const wins = wMatch ? parseInt(wMatch[1], 10) : 0;

        const medals = [];
        const mRegex = /\/(\d+)\.(?:png|svg)/gi;
        let mm;
        while ((mm = mRegex.exec(row)) !== null) medals.push(parseInt(mm[1], 10));

        competitive.push({
            map: rawMap,
            current: medals[0],
            best: medals[1],
            wins
        });
    }

    const extractRankMode = (html, modePattern, isLegacyCsgo = false) => {
        if (!html) return undefined;
        const re = new RegExp(modePattern, 'i');

        const secBlocks = html.split(/<div class="sec"/i);
        let matchedBlock = '';
        for (const s of secBlocks) {
            const headerM = s.match(/class="sec-h"[^>]*>([\s\S]*?)<\/div>/i);
            if (headerM && re.test(headerM[1])) {
                matchedBlock = s.split(/<\/div>\s*<\/div>/i)[0];
                break;
            }
        }

        if (!matchedBlock) {
            const rows = html.split(/(?=<(?:div|summary)[^>]*\bclass="[^"]*rk-row)/i);
            for (let r of rows) {
                if (!/<(?:div|summary)[^>]*\bclass="[^"]*rk-row/i.test(r)) continue;
                const cutIdx = r.search(/<\/div>\s*<\/div>|<\/section>|<script|<div class="sec"/i);
                if (cutIdx > 0) r = r.substring(0, cutIdx);

                const nameM = r.match(/class="[^"]*rk-n[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span)>/i);
                if (nameM && re.test(nameM[1])) {
                    matchedBlock = r;
                    break;
                }
                const firstChunk = r.substring(0, 150);
                if (re.test(firstChunk)) {
                    matchedBlock = r;
                    break;
                }
            }
        }

        if (!matchedBlock) return undefined;

        const wMatch = matchedBlock.match(/class="[^"]*rk-w[^"]*"[^>]*>\s*(\d+)/i);
        const wins = wMatch ? parseInt(wMatch[1], 10) : 0;

        const extractMedalFromHtml = (str) => {
            if (!str) return undefined;
            const m = str.match(/(?:ranks|medals|wingman)?\/?(?:wingman)?(\d+)\.(?:png|svg)/i);
            if (m) {
                const val = parseInt(m[1], 10);
                return val > 0 ? val : undefined;
            }
            const altM = str.match(/alt="[^"]*?(?:Rank|Lv|Skill Group)\s*(\d+)/i);
            if (altM) {
                const val = parseInt(altM[1], 10);
                return val > 0 ? val : undefined;
            }
            return undefined;
        };

        const vSlots = [];
        const vRegex = /<(?:span|div)[^>]*\bclass="[^"]*rk-v[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)>/gi;
        let vm;
        while ((vm = vRegex.exec(matchedBlock)) !== null) {
            vSlots.push(vm[1]);
        }

        let current = undefined;
        let best = undefined;

        if (vSlots.length >= 2) {
            current = extractMedalFromHtml(vSlots[0]);
            best = extractMedalFromHtml(vSlots[1]);
            if (current !== undefined && best === undefined) {
                best = current;
            }
        } else {
            const medals = [];
            const mRegex = /(?:ranks|medals|wingman)?\/?(?:wingman)?(\d+)\.(?:png|svg)/gi;
            let mm;
            while ((mm = mRegex.exec(matchedBlock)) !== null) {
                const val = parseInt(mm[1], 10);
                if (val > 0) medals.push(val);
            }

            if (!medals.length) {
                const altRegex = /alt="[^"]*?(?:Rank|Lv|Skill Group)\s*(\d+)/gi;
                let am;
                while ((am = altRegex.exec(matchedBlock)) !== null) {
                    const val = parseInt(am[1], 10);
                    if (val > 0) medals.push(val);
                }
            }

            if (medals.length === 1) {
                best = medals[0];
            } else if (medals.length >= 2) {
                current = medals[0];
                best = medals[1];
            }
        }

        if (isLegacyCsgo) {
            best = best || current;
            current = undefined;
        }

        if (current === undefined && best === undefined && wins === 0) return undefined;

        return {
            current,
            best: best !== undefined ? best : current,
            wins
        };
    };

    wingman = extractRankMode(pStr, 'Wingman', false);
    csgo = extractRankMode(pStr, '(?:cs:?go|icon[-_]csgo|\\bgo\\b)', true);

    const isLoginRequiredVisible = (str) => {
        if (!str) return false;
        const m = str.match(/<div[^>]*id="player-login-required"([^>]*)>([\s\S]*?)<\/div>/i);
        if (m) {
            const attrs = m[1];
            if (/style="[^"]*display:\s*none/i.test(attrs)) return false;
            return true;
        }
        if (/login to view player stats/i.test(str) && !str.includes('display:none')) return true;
        return false;
    };
    const auth_gated = isLoginRequiredVisible(sStr) || isLoginRequiredVisible(pStr);

    const recent_rows = parseCSStatsRecentMatches(sStr, pStr);

    return {
        name,
        kd_ratio,
        hltv_rating,
        matches,
        win_rate,
        hs_percentage,
        adr,
        clutch,
        most_played_map,
        recent_results,
        recent_rows,
        premier,
        competitive: competitive.length ? competitive : undefined,
        wingman,
        csgo,
        auth_gated: auth_gated ? true : undefined
    };
}

function mergeCSStatsData(prev, next) {
    if (!next) return prev ||  ({ error: 'UNKNOWN' });
    if (next.error) return next;                       
    if (!prev || prev.error) return next;

    const merged = Object.assign({}, prev, next);
    const isEmpty = (v) => v === undefined || v === null || v === ''
        || (Array.isArray(v) && v.length === 0);
    const keepFields = [
        'name', 'kd_ratio', 'hltv_rating', 'matches', 'win_rate', 'hs_percentage', 'adr', 'clutch',
        'most_played_map', 'recent_results', 'recent_rows', 'premier', 'competitive', 'wingman', 'csgo'
    ];
    for (const key of keepFields) {
        if (isEmpty(next[key]) && !isEmpty(prev[key])) merged[key] = prev[key];
    }

    const nextRows = Array.isArray(next.recent_rows) ? next.recent_rows : [];
    const prevRows = Array.isArray(prev.recent_rows) ? prev.recent_rows : [];

    const nextCount = Math.min(nextRows.length, CSSTATS_RECENT_MAX);
    const prevCount = Math.min(prevRows.length, CSSTATS_RECENT_MAX);
    if (prevCount > nextCount && prevCount >= 8) {
        merged.recent_rows = prevRows;
    }

    if (Array.isArray(merged.recent_rows) && merged.recent_rows.length > CSSTATS_RECENT_MAX) {
        merged.recent_rows = merged.recent_rows.slice(0, CSSTATS_RECENT_MAX);
    }
    if (!next.auth_gated) delete merged.auth_gated;
    return merged;
}

function csstatsRetryAfterMs(res) {
    try {
        const raw = (res && res.headers && typeof res.headers.get === 'function') ? res.headers.get('retry-after') : '';
        if (!raw) return 0;
        const sec = Number(raw);
        if (Number.isFinite(sec) && sec > 0) return Math.min(sec * 1000, 60 * 60 * 1000);
        const at = Date.parse(String(raw));
        if (Number.isFinite(at)) return Math.max(0, Math.min(at - Date.now(), 60 * 60 * 1000));
        return 0;
    } catch (e) { return 0; }
}

function csstatsIsRateLimitedPage(html) {
    const h = String(html || '');
    if (!h) return false;
    return /Error\s*1015/i.test(h) || /You are being rate limited/i.test(h);
}

function csstatsFetchOpts() {
    return  ({
        credentials: 'include',
        headers: {
            'Cache-Control': 'max-age=0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    });
}

async function fetchCSStatsProfile(steamId, opts) {
    const o = opts || {};
    const pUrl = `https://csstats.gg/player/${steamId}`;
    
    const pTimeout = Number(o.timeoutMs) > 0 ? Number(o.timeoutMs) : 7000;
    try {
        
        if (!(await csstatsRateAcquire())) return { data: { error: 'THROTTLED' }, html: '' };
        const pRes = await fetchWithTimeout(pUrl, csstatsFetchOpts(), pTimeout).catch(() => null);
        if (!pRes) return { data: { error: 'NETWORK_ERROR' }, html: '' };
        
        if (pRes.status === 403) return { data: { error: 'CF_CHALLENGE' }, html: '' };
        
        if (pRes.status === 429) {
            return { data: { error: 'RATE_LIMITED', retryAfterMs: csstatsRetryAfterMs(pRes) }, html: '' };
        }
        let pHtml = '';
        try { pHtml = await pRes.text(); } catch (e) { return { data: { error: 'NETWORK_ERROR' }, html: '' }; }
        if (!pHtml) return { data: { error: 'NETWORK_ERROR' }, html: '' };
        
        if (csstatsIsRateLimitedPage(pHtml)) {
            return { data: { error: 'RATE_LIMITED', retryAfterMs: 0 }, html: pHtml };
        }
        if (/<title>Just a moment\.\.\.<\/title>/i.test(pHtml) || /id="cf-challenge/i.test(pHtml)
            || /cf-browser-verification/i.test(pHtml) || /Checking your browser/i.test(pHtml)) {
            return { data: { error: 'CF_CHALLENGE' }, html: pHtml };
        }
        if (/<h1[^>]*>\s*Private Profile\s*<\/h1>/i.test(pHtml) || /id="outer-wrapper"[\s\S]*?Private Profile/i.test(pHtml)) {
            return { data: { error: 'PRIVATE' }, html: pHtml };
        }
        if (!pHtml.includes('rank-panel') && !pHtml.includes('cs2rating') && !pHtml.includes('rk-row') && !pHtml.includes('player-name')) {
            return { data: { error: 'NOT_FOUND' }, html: pHtml };
        }
        return { data: parseCSStatsHtml(pHtml, ''), html: pHtml };
    } catch (e) {
        return { data: { error: 'NETWORK_ERROR' }, html: '' };
    }
}

async function fetchCSStatsDetail(steamId, profileHtml) {
    const sUrl = `https://csstats.gg/player/${steamId}/stats`;
    const mUrl = `https://csstats.gg/player/${steamId}/matches`;
    const fetchOpts = csstatsFetchOpts();
    
    let matchesP = null;
    let hedge = null;
    try {
        
        if (!(await csstatsRateAcquire())) return { error: 'THROTTLED' };
        hedge = setTimeout(() => {
            matchesP = fetchWithTimeout(mUrl, fetchOpts, 4000).catch(() => null);
        }, CSSTATS_HEDGE_MS);
        const sRes = await fetchWithTimeout(sUrl, fetchOpts, 5000).catch(() => null);
        clearTimeout(hedge);
        if (sRes && sRes.status === 429) {
            return { error: 'RATE_LIMITED', retryAfterMs: csstatsRetryAfterMs(sRes) };
        }
        const sHtml = (sRes && sRes.status === 200) ? await sRes.text().catch(() => '') : '';
        if (sHtml && csstatsIsRateLimitedPage(sHtml)) return { error: 'RATE_LIMITED', retryAfterMs: 0 };
        const statsRows = sHtml ? parseCSStatsMatchData(sHtml) : undefined;
        const enough = !!(statsRows && statsRows.length >= CSSTATS_RECENT_MAX);
        let mHtml = '';
        if (!enough) {
            const mRes = await (matchesP || fetchWithTimeout(mUrl, fetchOpts, 4000).catch(() => null));
            if (mRes && mRes.status === 429) return { error: 'RATE_LIMITED', retryAfterMs: csstatsRetryAfterMs(mRes) };
            if (mRes && mRes.status === 200) {
                const t = await mRes.text().catch(() => '');
                if (t && csstatsIsRateLimitedPage(t)) return { error: 'RATE_LIMITED', retryAfterMs: 0 };
                if (t && (t.includes('match-list-outer') || t.includes('match-row'))) mHtml = t;
            }
        }
        const combined = (sHtml || '') + '\n' + (mHtml || '');
        if (!combined.trim()) return { error: 'NETWORK_ERROR' };
        return parseCSStatsHtml(profileHtml || '', combined);
    } catch (e) {
        clearTimeout(hedge);
        return { error: 'NETWORK_ERROR' };
    }
}

async function fetchCSStatsData(steamId, opts) {
    if (!steamId) return { error: 'NOT_FOUND' };
    const o = opts || {};
    const first = await fetchCSStatsProfile(steamId, o);
    if (first.data.error || o.profileOnly) return first.data;
    const detail = await fetchCSStatsDetail(steamId, first.html);
    
    if (!detail || detail.error) return first.data;
    return mergeCSStatsData(first.data, detail);
}
