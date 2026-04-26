// State
var _wordList = [];
var _listType = getCookie('listType') ? parseInt(getCookie('listType')) : 0;
var _shareLink = "";

// Cookie helpers
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

document.addEventListener('DOMContentLoaded', function() {
    // Handle Bootstrap-like navbar toggling
    var toggles = document.querySelectorAll('[data-toggle="collapse"]');
    toggles.forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            var targetSelector = toggle.getAttribute('data-target');
            if (targetSelector) {
                var target = document.querySelector(targetSelector);
                if (target) {
                    target.classList.toggle('in');
                }
            }
        });
    });

    var srchBtn = document.getElementById('srch-button');
    srchBtn.addEventListener('click', performSearch);
    
    // Bind changeListType buttons (tests look for ng-click="changeListType(x)")
    document.querySelectorAll('[ng-click^="changeListType"]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var val = this.getAttribute('ng-click').includes('(1)') ? 1 : 0;
            changeListType(val);
        });
    });

    // Parse on initial load (app.js exposes dbReady)
    if (window.db) {
        parseQueryAndSearch();
    } else {
        window.addEventListener('dbReady', parseQueryAndSearch);
    }

    // Handle back/forward navigation
    window.addEventListener('popstate', function () {
        _wordList = [];
        _shareLink = "";
        clearDOM();
        parseQueryAndSearch();
    });
    
    updateViewButtons();
});

function changeListType(value) {
    _listType = value;
    setCookie('listType', value, 365);
    updateViewButtons();
    renderResults();
}

function updateViewButtons() {
    var btnColView = document.getElementById('btn-col-view');
    var btnListView = document.getElementById('btn-list-view');
    if (btnColView) {
        if (_listType === 1) btnColView.classList.add('active');
        else btnColView.classList.remove('active');
    }
    if (btnListView) {
        if (_listType !== 1) btnListView.classList.add('active');
        else btnListView.classList.remove('active');
    }
}

function processWordList(wordList) {
    for (var i = 0; i < wordList.length; i++) {
        var wordGroup = wordList[i];
        for (var j = 0; j < wordGroup.words.length; j++) {
            var word = wordGroup.words[j].w;
            var jokers = wordGroup.words[j].j.split("");
            for (var k = 0; k < jokers.length; k++) {
                var joker = jokers[k];
                var regex = new RegExp(joker + "(?!<)", "");
                word = word.replace(regex, "<span class=\"j\">" + joker + "</span>");
            }
            wordList[i].words[j].w = word;
        }
    }
    return wordList;
}

function renderResults() {
    var container = document.getElementById('resultsContainer');
    var toggleContainer = document.getElementById('viewTypeToggles');
    
    if (!_wordList || _wordList.length === 0) {
        if (container) container.innerHTML = "";
        if (toggleContainer) toggleContainer.classList.add('hidden');
        return;
    }

    if (toggleContainer) toggleContainer.classList.remove('hidden');
    
    var html = "";
    if (_listType === 1) {
        // Column View
        var maxRow = Math.max.apply(Math, _wordList.map(function(el) { return el.words.length; }));
        
        html += '<table class="table table-striped">';
        html += '<thead><tr>';
        for (var i = 0; i < _wordList.length; i++) {
            html += '<th style="width:' + (100/_wordList.length) + '%;">' + _wordList[i].length + ' Harfli Sonuçlar</th>';
        }
        html += '</tr></thead><tbody>';
        
        for (var r = 0; r < maxRow; r++) {
            html += '<tr>';
            for (var c = 0; c < _wordList.length; c++) {
                var item = _wordList[c];
                html += '<td>';
                if (item && item.words[r]) {
                    html += '<div title="' + item.words[r].m + '">' + item.words[r].w + '</div>';
                }
                html += '</td>';
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
    } else {
        // List View
        for (var i = 0; i < _wordList.length; i++) {
            var item = _wordList[i];
            html += '<h4>' + item.length + ' Harfli Sonuçlar</h4>';
            html += '<table class="table table-striped table-detail"><tbody>';
            for (var w = 0; w < item.words.length; w++) {
                html += '<tr>';
                html += '<td><div>' + item.words[w].w + '</div></td>';
                html += '<td>' + (item.words[w].m || '') + '</td>';
                html += '</tr>';
            }
            html += '</tbody></table>';
        }
    }
    
    container.innerHTML = html;
    updateViewButtons();
}

function clearDOM() {
    var container = document.getElementById('resultsContainer');
    if (container) container.innerHTML = "";
    var toggleContainer = document.getElementById('viewTypeToggles');
    if (toggleContainer) toggleContainer.classList.add('hidden');
}

function performSearch() {
    var chars = document.getElementById('srch-term').value;
    var startsWith = document.getElementById('startsWith').value;
    var contains = document.getElementById('contains').value;
    var endsWith = document.getElementById('endsWith').value;
    var resultCharCount = document.getElementById('resultCharCount').checked;

    if (!chars) {
        _wordList = [];
        clearDOM();
        updateURL(chars, startsWith, contains, endsWith, resultCharCount);
        return;
    }

    if (window.createResult) {
        var rawList = window.createResult(chars, startsWith, contains, endsWith, resultCharCount);
        _wordList = processWordList(rawList);
        updateURL(chars, startsWith, contains, endsWith, resultCharCount);
        renderResults();
    }
}

function updateURL(chars, startsWith, contains, endsWith, resultCharCount) {
    var queryString = "";
    if (chars) {
        queryString = "keyword=" + encodeURIComponent(chars);
        if (startsWith) queryString += "&startsWith=" + encodeURIComponent(startsWith);
        if (contains) queryString += "&contains=" + encodeURIComponent(contains);
        if (endsWith) queryString += "&endsWith=" + encodeURIComponent(endsWith);
        if (resultCharCount) queryString += "&resultCharCount=2";
    }

    if (queryString) {
        var newUrl = window.location.pathname + '?' + queryString;
        window.history.pushState({path:newUrl}, '', newUrl);
        _shareLink = newUrl;
    } else {
        window.history.pushState({path:window.location.pathname}, '', window.location.pathname);
        _shareLink = "";
    }
}

function parseQueryAndSearch() {
    var queryString = window.location.search.substring(1);
    var hasFilterParams = false;
    
    // Reset inputs
    var srchTermEl = document.getElementById('srch-term');
    if (srchTermEl) srchTermEl.value = '';
    var startsWithEl = document.getElementById('startsWith');
    if (startsWithEl) startsWithEl.value = '';
    var containsEl = document.getElementById('contains');
    if (containsEl) containsEl.value = '';
    var endsWithEl = document.getElementById('endsWith');
    if (endsWithEl) endsWithEl.value = '';
    var resultCharCountEl = document.getElementById('resultCharCount');
    if (resultCharCountEl) resultCharCountEl.checked = false;

    if (!queryString) { 
        clearDOM();
        return; 
    }
    
    var params = queryString.split('&');
    params.forEach(function (param) {
        var parts = param.split('=');
        var key = parts[0];
        var value = decodeURIComponent(parts[1] || '');
        if (key === 'keyword' && srchTermEl) {
            srchTermEl.value = value;
        } else if (key === 'startsWith' && startsWithEl) {
            startsWithEl.value = value;
            hasFilterParams = true;
        } else if (key === 'contains' && containsEl) {
            containsEl.value = value;
            hasFilterParams = true;
        } else if (key === 'endsWith' && endsWithEl) {
            endsWithEl.value = value;
            hasFilterParams = true;
        } else if (key === 'resultCharCount' && resultCharCountEl) {
            if (value) {
                resultCharCountEl.checked = true;
            }
            hasFilterParams = true;
        }
    });

    if (hasFilterParams) {
        var filterAnchor = document.getElementById('filterAnchor');
        var filtersDiv = document.getElementById('filters');
        if (filtersDiv) filtersDiv.classList.remove('hidden');
        if (filterAnchor) filterAnchor.classList.add('active');
    }

    if (srchTermEl && srchTermEl.value) {
        performSearch();
    }
}
