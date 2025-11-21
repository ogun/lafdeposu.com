
const sqlPromise = initSqlJs({
    locateFile: file => `dist/${file}`
});
const dataPromise = fetch("data/dict.db").then(res => res.arrayBuffer());
const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
const db = new SQL.Database(new Uint8Array(buf));

function listJokerChars(input, dbWord) {
    let result = dbWord;

    // Iterate over each character in input
    for (const oldChar of input) {
        // Create a regex to match the current character literally
        const regex = new RegExp(oldChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

        // Replace only the first occurrence of this character from result
        result = result.replace(regex, '');
    }

    return result;
}

function controlDbWord(input, dbWord) {
    let returnValue = false;
    let hasAsterix = input.indexOf("*") > -1;
    let charPos = -1;
    let inputChars = [...input]
    for (let i = 0; i < dbWord.length; i++) {
        charPos = inputChars.indexOf(dbWord[i]);

        if (charPos > -1) {
            inputChars.splice(charPos, 1); // Remove character from inputChars
            returnValue = true;
        } else {
            if (!hasAsterix) {
                returnValue = false;
                break;
            }

            charPos = inputChars.indexOf('*');
            if (charPos > -1) {
                inputChars.splice(charPos, 1);
                returnValue = true;
            } else {
                returnValue = false;
                break;
            }
        }
    }

    return returnValue;
}

function createCommandText(input, resultCharCount) {
    let commandText = [];

    const inputChars = [...input];
    const alphabet = [..."abcçdefgğhıijklmnoöprsştuüvyz"];

    const inputLength = input.length;
    const hasAsterix = input.indexOf("*") > -1;

    commandText.push("SELECT word, meaning FROM dictionary WHERE ");

    if (!hasAsterix) {
        alphabet.forEach(letter => {
            if (!inputChars.includes(letter)) {
                commandText.push(`word NOT LIKE('%${letter}%') AND `);
            }
        });
    }

    // If resultCharCount is undefined or null, apply this condition
    if (resultCharCount == null) {
        commandText.push(`length <= ${inputLength} AND length > 2 ORDER BY length DESC, word`);
    } else {
        commandText.push(`length = 2 ORDER BY length DESC, word`);
    }

    return commandText.join('');
}

function createResult(input, startsWith, contains, endsWith, resultCharCount) {
    if (!input) {
        return [];
    }

    // Only process lowercase Turkish locale strings
    input = input.toLocaleLowerCase('tr-TR').trim();
    if (startsWith) {
        startsWith = startsWith.toLocaleLowerCase('tr-TR').trim();
    }
    if (contains) {
        contains = contains.toLocaleLowerCase('tr-TR').trim();
    }
    if (endsWith) {
        endsWith = endsWith.toLocaleLowerCase('tr-TR').trim();
    }

    let returnValue = [];

    // Create SQL command text (assumes CreateCommandText is defined)
    let commandText = createCommandText(input, resultCharCount);
    // Assume getDataTable executes SQL and returns rows array
    let dataTable = db.exec(commandText)[0]?.values;

    if (dataTable && dataTable.length > 0) {
        let dbWordLength = -1;
        let wg = {};
        wg["words"] = [];

        for (const dbRow of dataTable) {
            let dbWord = dbRow[0].toLocaleLowerCase('tr-TR').trim();
            let dbMeaning = dbRow[1];

            let isWordOK = controlDbWord(input, dbWord);
            let isFilterOK = false;

            if (isWordOK) {
                isFilterOK = controlFilter(dbWord, startsWith, contains, endsWith);
            }

            if (isFilterOK) {
                if (dbWordLength !== dbWord.length) {
                    if (dbWordLength !== -1) {
                        returnValue.push(wg);
                        wg = {};
                        wg["words"] = [];
                    }

                    wg["length"] = dbWord.length;
                    dbWordLength = dbWord.length;
                }

                let w = {};
                w["w"] = dbWord.toLocaleUpperCase('tr-TR');
                w["m"] = dbMeaning;
                w["j"] = listJokerChars(input, dbWord).toLocaleUpperCase('tr-TR');

                wg["words"].push(w);
            }
        }

        if (wg["words"].length > 0) {
            returnValue.push(wg);
        }
    }

    return returnValue;
}

function controlInput(input) {
    // Convert input to lowercase using Turkish locale and trim spaces
    input = input.toLocaleLowerCase('tr-TR').trim();

    if (!input) {
        return false;
    }

    // Check if input without '*' is empty
    if (input.replace(/\*/g, '') === '') {
        return false;
    }

    // Regex to match any character not in the allowed set (letters and '*')
    const regexPattern = /[^A-Za-zışğüçöİĞÜŞÇÖ*]/;

    if (regexPattern.test(input)) {
        return false;
    }

    return true;
}

function controlFilter(dbWord, startsWith, contains, endsWith) {
    if (startsWith && startsWith.trim() !== '') {
        const startsWithList = startsWith.split(',').filter(s => s);
        let returnValue = false;
        for (const word of startsWithList) {
            if (dbWord.startsWith(word.toLocaleLowerCase('tr-TR'))) {
                returnValue = true;
                break;
            }
        }
        if (!returnValue) return false;
    }

    if (contains && contains.trim() !== '') {
        const containsList = contains.split(',').filter(s => s);
        let returnValue = false;
        for (const word of containsList) {
            if (dbWord.includes(word)) { // contains check is case-sensitive; change if needed
                returnValue = true;
                break;
            }
        }
        if (!returnValue) return false;
    }

    if (endsWith && endsWith.trim() !== '') {
        const endsWithList = endsWith.split(',').filter(s => s);
        let returnValue = false;
        for (const word of endsWithList) {
            if (dbWord.endsWith(word.toLocaleLowerCase('tr-TR'))) {
                returnValue = true;
                break;
            }
        }
        if (!returnValue) return false;
    }

    return true;
}
window.createResult = createResult;
