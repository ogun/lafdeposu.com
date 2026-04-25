var findWordsApp = angular.module("findWordsApp", ["ngResource", "ngCookies"]);

findWordsApp.factory("FindWord", ["$resource", function ($resource) {
    return {
        database: $resource("Kelime/Getir/:chars?startsWith=:startsWith&contains=:contains&endsWith=:endsWith&resultCharCount=:resultCharCount")
    }
}]);

findWordsApp.factory("Share", function () {
    var createLink = function (chars, startsWith, contains, endsWith, resultCharCount) {
        var returnValue = {};
        returnValue.queryString = "";

        if (chars != null && chars != "") {
            returnValue.queryString = "keyword=" + encodeURIComponent(chars);

            var filter = "";
            if (startsWith != null && startsWith != "") {
                filter += "&startsWith=" + encodeURIComponent(startsWith);
            }

            if (contains != null && contains != "") {
                filter += "&contains=" + encodeURIComponent(contains);
            }

            if (endsWith != null && endsWith != "") {
                filter += "&endsWith=" + encodeURIComponent(endsWith);
            }

            if (resultCharCount != null && resultCharCount != "") {
                filter += "&resultCharCount=2";
            }

            if (filter != "") {
                returnValue.queryString += filter;
            }
        }

        if (returnValue.queryString) {
            const newUrl = window.location.pathname + '?' + returnValue.queryString;
            window.history.pushState(null, '', newUrl);
        }
        return returnValue;
    }

    return {
        createLink: createLink
    }
});

findWordsApp.controller("wordListCtrl", ["$scope", "$sce", "FindWord", "Share", "$cookies", function ($scope, $sce, FindWord, Share, $cookies) {
    $scope.listType = $cookies.listType;

    $scope.findWordsClick = function () {
        $scope.wordList = createResult($scope.chars, $scope.startsWith, $scope.contains, $scope.endsWith, $scope.resultCharCount);

        $scope.wordList.maxRowCount = function () {
            var maxRow = Math.max.apply(Math, $.map($scope.wordList, function (el) { return el.words.length; }));
            var arr = new Array(maxRow);
            for (var i = 0; i < maxRow; i++) {
                arr[i] = i;
            }
            return arr;
        }

        for (var i = 0; i < $scope.wordList.length; i++) {
            var wordGroup = $scope.wordList[i];

            for (var j = 0; j < wordGroup.words.length; j++) {
                var word = wordGroup.words[j].w;
                var jokers = wordGroup.words[j].j.split("");

                for (var k = 0; k < jokers.length; k++) {
                    var joker = jokers[k];

                    var regex = new RegExp(joker + "(?!<)", "");
                    word = word.replace(regex, "<span class=\"j\">" + joker + "</span>");
                }
                $scope.wordList[i].words[j].w = $sce.trustAsHtml(word);
            }
        }

        $scope.share = Share.createLink($scope.chars, $scope.startsWith, $scope.contains, $scope.endsWith, $scope.resultCharCount);
    }

    // Parse querystring on page load
    var queryString = window.location.search.substring(1);
    if (queryString) {
        var params = queryString.split('&');
        var hasFilterParams = false;

        params.forEach(function (param) {
            var parts = param.split('=');
            var key = parts[0];
            var value = decodeURIComponent(parts[1] || '');
            if (key === 'keyword') {
                $scope.chars = value;
            } else if (key === 'startsWith' || key === 'contains' || key === 'endsWith' || key === 'resultCharCount') {
                $scope[key] = value;
                hasFilterParams = true;
            }
        });
        // Ensure Angular updates the view with the parsed keyword (e.g., '*')
        if (typeof $scope.$applyAsync === 'function') {
            $scope.$applyAsync();
        } else if (typeof $scope.$apply === 'function') {
            $scope.$apply();
        }

        // Show filter panel if any filter params present
        if (hasFilterParams) {
            setTimeout(function () {
                var filtersDiv = document.getElementById('filters');
                if (filtersDiv) {
                    filtersDiv.classList.remove('hidden');
                }
            }, 0);
        }

        // Trigger search if search term found
        if ($scope.chars) {
            // Ensure DB loaded before search
            if (window.db) {
                if (typeof $scope.$applyAsync === 'function') {
                    $scope.$applyAsync($scope.findWordsClick);
                } else {
                    $scope.$apply($scope.findWordsClick);
                }
            } else {
                // Wait for DB ready event
                window.addEventListener('dbReady', function onDbReady() {
                    window.removeEventListener('dbReady', onDbReady);
                    if (typeof $scope.$applyAsync === 'function') {
                        $scope.$applyAsync($scope.findWordsClick);
                    } else {
                        $scope.$apply($scope.findWordsClick);
                    }
                });
            }
        }
    }

    // Kullanıcının tercihini kaydedelim
    $scope.changeListType = function (value) {
        $cookies.listType = value;
        $scope.listType = value;
    }
}]);