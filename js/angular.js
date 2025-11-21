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
            returnValue.queryString = chars;

            var filter = "";
            if (startsWith != null && startsWith != "") {
                filter += "&startsWith=" + startsWith;
            }

            if (contains != null && contains != "") {
                filter += "&contains=" + contains;
            }

            if (endsWith != null && endsWith != "") {
                filter += "&endsWith=" + endsWith;
            }

            if (resultCharCount != null && resultCharCount != "") {
                filter += "&resultCharCount=2";
            }

            if (filter != "") {
                returnValue.queryString += "?" + filter.substring(1, filter.length);
            }
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
                console.log(word);
                $scope.wordList[i].words[j].w = $sce.trustAsHtml(word);
            }
        }

        $scope.share = Share.createLink($scope.chars, $scope.startsWith, $scope.contains, $scope.endsWith, $scope.resultCharCount);
    }

    // Kullanıcının tercihini kaydedelim
    $scope.changeListType = function (value) {
        $cookies.listType = value;
        $scope.listType = value;
    }
}]);