/* =========================================================
   BULLSEYE - a colors guessing game (like "Mastermind")
   By Yair Tepper

   THE IDEA:
   There is a secret line of colors (the "code").
   The player has to find it in a limited number of tries.
   After every guess the game answers with marks:
       green  = right color in the right spot
       yellow = right color but in a different spot
       white  = the color is not in the code at all

   HOW THE CODE IS SAVED:
   A color is saved as a NUMBER (1, 2, 3 ...) and not as a hex string.
   The number is the place of the color in the array ALL_COLORS.
   The number 0 means "this spot is still empty".
   Working with numbers makes it very easy to compare two lines of colors.
   ========================================================= */


/* All the colors the game can use. Only the first "numColors" of them
   are used in one game (the player chooses how many in the settings). */
var ALL_COLORS = [
    '#e02020', // 1 red
    '#2563eb', // 2 blue
    '#16a34a', // 3 green
    '#f5c400', // 4 yellow
    '#f97316', // 5 orange
    '#9333ea', // 6 purple
    '#0ea5e9', // 7 light blue
    '#78350f'  // 8 brown
];

/* These colors are dark, so a black number on them is hard to read.
   On these colors the number is written in white. */
var DARK_COLORS = [1, 2, 3, 6, 8];

var MAX_TRIES = 10; // how many guesses the player gets


/* ---------- variables that hold the state of the game ---------- */
var numSpots = 4;        // how many spots in the code
var numColors = 6;       // how many different colors are in this game
var whoMakesCode = 'computer'; // 'computer' or 'friend'

var secretCode = [];     // the code we need to find,  example: [1, 3, 3, 2]
var currentLine = [];    // the line the player is building right now
var pickedColor = 1;     // the color that is selected in the palette
var triesLeft = MAX_TRIES;
var guessNumber = 0;     // how many guesses were already made
var hintUsed = false;

/* The game has two stages:
   'making'  - a friend is putting the secret code on the board
   'guessing'- the player is trying to find the code                  */
var stage = 'guessing';


/* =========================================================
   SETTINGS SCREEN
   ========================================================= */

/* Called by the two buttons "Computer" / "A friend".
   It only remembers the choice and marks the button that was pressed. */
function chooseMode(mode) {
    whoMakesCode = mode;
    document.getElementById('modeComputer').className =
        (mode === 'computer') ? 'modeBtn selected' : 'modeBtn';
    document.getElementById('modeFriend').className =
        (mode === 'friend') ? 'modeBtn selected' : 'modeBtn';
}


/* Called by the "Start the game" button.
   It reads the settings, resets everything and opens the right stage. */
function startGame() {
    // read the two <select> boxes from the HTML.
    // the "+" turns the text ("4") into a real number (4).
    numSpots = +document.getElementById('spotsSelect').value;
    numColors = +document.getElementById('colorsSelect').value;

    // reset the game
    secretCode = [];
    currentLine = [];
    triesLeft = MAX_TRIES;
    guessNumber = 0;
    hintUsed = false;
    pickedColor = 1;

    for (var i = 0; i < numSpots; i++) {
        currentLine[i] = 0;  // 0 = empty spot
        secretCode[i] = 0;
    }

    document.getElementById('historyBox').innerHTML = '';
    showScreen('gameScreen');

    if (whoMakesCode === 'computer') {
        makeRandomCode();   // the computer builds the secret code
        stage = 'guessing';
    } else {
        stage = 'making';   // the friend will build it on the board
    }

    drawEverything();
}


/* The computer picks a random color for every spot.
   Math.random() gives a number between 0 and 1, so
   Math.random() * numColors gives 0 up to numColors,
   Math.floor cuts the digits after the dot, and +1 moves it to 1..numColors. */
function makeRandomCode() {
    for (var i = 0; i < numSpots; i++) {
        secretCode[i] = Math.floor(Math.random() * numColors) + 1;
    }
    console.log('The secret code is: ' + secretCode); // helps while testing
}


/* Returns the color of the number that is written on a color square. */
function numberColor(colorNumber) {
    return (DARK_COLORS.indexOf(colorNumber) !== -1) ? 'white' : 'rgba(0,0,0,0.65)';
}


/* Shows one screen and hides the others. */
function showScreen(name) {
    var screens = ['setupScreen', 'gameScreen', 'endScreen'];
    for (var i = 0; i < screens.length; i++) {
        document.getElementById(screens[i]).className =
            (screens[i] === name) ? 'card' : 'card hidden';
    }
}


/* =========================================================
   DRAWING THE BOARD
   ========================================================= */

/* Draws the board, the palette and all the texts.
   It is called every time something changes, so the screen
   always shows exactly what is saved in the variables. */
function drawEverything() {
    drawBoard();
    drawPalette();
    drawTexts();
}


/* The row of spots the player clicks on. */
function drawBoard() {
    var html = '';
    for (var i = 0; i < numSpots; i++) {
        var color = 'white';
        var text = '';
        if (currentLine[i] !== 0) {              // the spot has a color
            color = ALL_COLORS[currentLine[i] - 1];  // -1 because the array starts at 0
            text = currentLine[i];
        }
        html += '<button class="spot" style="background:' + color +
                '; color:' + numberColor(currentLine[i]) + ';"' +
                ' onclick="clickSpot(' + i + ')">' + text + '</button>';
    }
    document.getElementById('board').innerHTML = html;
}


/* The palette - the colors the player can choose from.
   The number inside every color helps to remember which color is which
   (and also helps players that do not see colors well). */
function drawPalette() {
    var html = '';
    for (var i = 1; i <= numColors; i++) {
        var selected = (i === pickedColor) ? ' selected' : '';
        html += '<button class="colorBtn' + selected + '"' +
                ' style="background:' + ALL_COLORS[i - 1] +
                '; color:' + numberColor(i) + ';"' +
                ' onclick="pickColor(' + i + ')">' + i + '</button>';
    }
    document.getElementById('palette').innerHTML = html;
}


/* Writes the titles and the button text. They are different
   in the "making" stage and in the "guessing" stage. */
function drawTexts() {
    var title = document.getElementById('gameTitle');
    var instruction = document.getElementById('instruction');
    var mainBtn = document.getElementById('mainBtn');
    var hintBtn = document.getElementById('hintBtn');
    var triesText = document.getElementById('triesText');

    if (stage === 'making') {
        title.innerHTML = 'שחקן 1: בנה את הקוד הסודי';
        instruction.innerHTML = 'בחר צבע ולחץ על משבצת. ' +
            'כשתסיים, לחץ על הכפתור והקוד יוסתר משחקן 2.';
        mainBtn.innerHTML = 'הסתר את הקוד והתחילו לנחש';
        hintBtn.className = 'smallBtn hidden';   // no hints while building
        triesText.innerHTML = '';
    } else {
        title.innerHTML = 'מצא את הקוד הסודי';
        instruction.innerHTML = 'בחר צבע ולחץ על משבצת. ' +
            'לחיצה נוספת על משבצת מלאה מרוקנת אותה.';
        mainBtn.innerHTML = 'בדוק את הניחוש';
        hintBtn.className = hintUsed ? 'smallBtn hidden' : 'smallBtn';
        triesText.innerHTML = 'ניחושים שנשארו: ' + triesLeft;
    }

    // the "Your old guesses" title is shown only after the first guess
    document.getElementById('historyLabel').className =
        (guessNumber > 0) ? 'label' : 'label hidden';

    // the button works only when all the spots are full
    mainBtn.disabled = !lineIsFull();
}


/* true only if there is no empty (0) spot in the line. */
function lineIsFull() {
    for (var i = 0; i < currentLine.length; i++) {
        if (currentLine[i] === 0) {
            return false;
        }
    }
    return true;
}


/* =========================================================
   CLICKS OF THE PLAYER
   ========================================================= */

/* A color in the palette was clicked - remember it. */
function pickColor(colorNumber) {
    pickedColor = colorNumber;
    drawPalette();
}


/* A spot on the board was clicked.
   If the spot already has the selected color -> empty it (like an "undo").
   If not -> put the selected color in it. */
function clickSpot(spotIndex) {
    if (currentLine[spotIndex] === pickedColor) {
        currentLine[spotIndex] = 0;
    } else {
        currentLine[spotIndex] = pickedColor;
    }
    drawBoard();
    drawTexts();   // the "Check" button turns on/off when the line is full
}


/* The big blue button. It does a different thing in every stage. */
function mainButtonClick() {
    if (stage === 'making') {
        finishMakingCode();
    } else {
        checkGuess();
    }
}


/* Player 1 finished building the code:
   copy the board into secretCode and clean the board for player 2. */
function finishMakingCode() {
    for (var i = 0; i < numSpots; i++) {
        secretCode[i] = currentLine[i];
        currentLine[i] = 0;   // clean the board so player 2 will not see the code
    }
    stage = 'guessing';
    drawEverything();
}


/* =========================================================
   CHECKING A GUESS
   ========================================================= */

/* Compares the guess with the secret code and returns how many
   colors are in the right spot and how many are only the right color.

   IMPORTANT (this is the tricky part of the game):
   a color of the code can be "used" only one time.
   So first we count the exact matches and take them out,
   and only after that we look for colors that are in a wrong spot. */
function getFeedback(guess, code) {
    var exact = 0;      // green marks
    var colorOnly = 0;  // yellow marks
    var codeLeft = [];  // the colors of the code that were not matched yet
    var guessLeft = []; // the colors of the guess that were not matched yet

    for (var i = 0; i < code.length; i++) {
        if (guess[i] === code[i]) {
            exact++;                    // same color AND same place
        } else {
            codeLeft.push(code[i]);     // keep them for the second check
            guessLeft.push(guess[i]);
        }
    }

    for (var g = 0; g < guessLeft.length; g++) {
        var place = codeLeft.indexOf(guessLeft[g]); // is this color left in the code?
        if (place !== -1) {
            colorOnly++;
            codeLeft[place] = 0;  // 0 = this color of the code is already used
        }
    }

    return { exact: exact, colorOnly: colorOnly };
}


/* The "Check my guess" button. */
function checkGuess() {
    if (!lineIsFull()) {
        return; // should not happen, the button is disabled - but it is safer
    }

    guessNumber++;
    var feedback = getFeedback(currentLine, secretCode);
    addGuessToHistory(currentLine, feedback);

    if (feedback.exact === numSpots) {   // every spot is correct -> win
        endGame(true);
        return;
    }

    triesLeft--;
    if (triesLeft === 0) {               // no more guesses -> lose
        endGame(false);
        return;
    }

    // not correct and there are still tries: clean the board for the next guess
    for (var i = 0; i < numSpots; i++) {
        currentLine[i] = 0;
    }
    drawEverything();
}


/* Adds one line to the list of the old guesses, so the player can
   look at everything he already tried. */
function addGuessToHistory(guess, feedback) {
    var html = '<div class="guessRow"><span class="guessNum">' + guessNumber + '.</span>';

    for (var i = 0; i < guess.length; i++) {
        html += '<span class="oldSpot" style="background:' + ALL_COLORS[guess[i] - 1] +
                '; color:' + numberColor(guess[i]) + ';">' + guess[i] + '</span>';
    }

    // the marks. they are NOT in the order of the spots on purpose -
    // that is what makes the game a puzzle.
    var pegs = '';
    for (var g = 0; g < feedback.exact; g++) { pegs += '🟢'; }      // green
    for (var y = 0; y < feedback.colorOnly; y++) { pegs += '🟡'; }  // yellow
    var rest = guess.length - feedback.exact - feedback.colorOnly;
    for (var w = 0; w < rest; w++) { pegs += '⚪'; }                   // white

    html += '<span class="pegs">' + pegs + '</span></div>';

    // the newest guess goes on top of the list
    var box = document.getElementById('historyBox');
    box.innerHTML = html + box.innerHTML;
}


/* A hint: puts one correct color in a spot that is not correct yet.
   It can be used only one time in a game. */
function useHint() {
    var wrongSpots = [];
    for (var i = 0; i < numSpots; i++) {
        if (currentLine[i] !== secretCode[i]) {
            wrongSpots.push(i);
        }
    }
    if (wrongSpots.length === 0) {
        return; // the line is already the code, no hint is needed
    }

    var spot = wrongSpots[Math.floor(Math.random() * wrongSpots.length)];
    currentLine[spot] = secretCode[spot];
    hintUsed = true;
    drawEverything();
}


/* =========================================================
   END OF THE GAME
   ========================================================= */

function endGame(playerWon) {
    var title = document.getElementById('endTitle');
    var text = document.getElementById('endText');

    if (playerWon) {
        title.innerHTML = 'ניצחת!';
        title.className = 'won';
        text.innerHTML = (guessNumber === 1)
            ? 'מצאת את הקוד בניחוש אחד!'
            : 'מצאת את הקוד ב-' + guessNumber + ' ניחושים.';
    } else {
        title.innerHTML = 'הפסדת';
        title.className = 'lost';
        text.innerHTML = 'נגמרו לך כל ' + MAX_TRIES + ' הניחושים. נסה שוב!';
    }

    // show the secret code so the player can see what it was
    var html = '';
    for (var i = 0; i < numSpots; i++) {
        html += '<span class="oldSpot" style="background:' + ALL_COLORS[secretCode[i] - 1] +
                '; color:' + numberColor(secretCode[i]) +
                '; width:44px; height:44px; line-height:44px;">' + secretCode[i] + '</span>';
    }
    document.getElementById('revealRow').innerHTML = html;

    showScreen('endScreen');
}


/* The "Play again" button - go back to the settings screen. */
function newGame() {
    showScreen('setupScreen');
}
