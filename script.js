// Declare a variable to store the IP address globally
//let ip_address = '';
let ip = '';
port = 5000;
let ip_address = '';  // Declare a global variable for the IP address

(async () => {
    try {
        const response = await fetch('ip_address.json');  // Fetch the IP address from the JSON file
        if (!response.ok) throw new Error('Failed to fetch IP');
        
        const data = await response.json();
        ip_address = data.ip;  // Store the IP address in the ip_address variable
        console.log('Loaded IP address:', ip_address);  // Log the IP for verification
    } catch (error) {
        console.error('Error loading IP address:', error);
        ip_address = null;  // Set to null if there's an error
    }
})();

// Global variables
let currentMode = null;
let currentOptions = [];
let cards = [];  // Global variable for storing loaded cards
const cardStates = {
    classic: {
      currentIndex: -1,
      visitedIndices: [],
      cards: [],
      wrongAnswerQueue: [], // Add queue for wrong answers
      cardsSinceLastWrong: 0 // Counter for cards since last wrong answer
    },
    difficult: {
      currentIndex: -1, 
      visitedIndices: [],
      cards: [],
      wrongAnswerQueue: [],
      cardsSinceLastWrong: 0
    },
    ignored: {
        currentIndex: -1,
        visitedIndices: [],
        cards: [],
        wrongAnswerQueue: [],
        cardsSinceLastWrong: 0
    }
  };
  
(async () => {
    try {
        const response = await fetch('cards.json');  // Fetch the cards from the JSON file
        if (!response.ok) throw new Error('Failed to fetch cards');
        
        const data = await response.json();
        cards = data.map(card => ({
            ...card,
            level: parseInt(card.level),
            difficulty: parseInt(card.difficulty),
            lastReviewed: new Date(card.lastReviewed),
            nextReview: new Date(card.nextReview),
            ignored: card.ignored || false // Default to false if not specified
        }));

        console.log('Loaded cards:', cards.length);  // Log the loaded cards for verification
        showMenu();  // Call showMenu() after loading the cards
    } catch (error) {
        console.error('Error loading cards:', error);
    }
})();


async function saveData(data) {
    try {
        console.log('entering saveData');
        console.trace('saveData was called from:'); // Prints the call stack
        console.log(ip_address, port);
        const response = await fetch(`http://${ip_address}:${port}/save-json`, {
        //const response = await fetch(`http://127.0.0.1:5000/save-json}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    // updateDisplay();
    //showMenu();	
    return response.json();
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

async function showMode(mode) {
    console.log(`Entering showMode with mode: ${mode}`);
    console.trace('showMode was called from:'); // Prints the call stack
    currentMode = mode; // Set the current mode globally
    try {
        if (cards.length === 0) {
            console.log('No cards available!');
            alert('No cards available!');
            return;
        }

        const cardState = cardStates[mode];
        cardState.visitedIndices = [];

        // Filter cards based on the selected mode
        if (mode === 'difficult') {
            cardState.cards = cards.filter(card => card.difficulty === 1 && !card.ignored);
            document.querySelector('.ignore-button').textContent = 'Ignore';
        } else if (mode === 'ignored') {
            cardState.cards = cards.filter(card => card.ignored); // Show only ignored cards
            // change ignore button query selector instead of id to show unignore 
            document.querySelector('.ignore-button').textContent = 'Unignore';
            ('ignore-button').textContent = 'Unignore';
        } else {
            cardState.cards = cards.filter(card => card.level > 0 && !card.ignored);
            document.querySelector('.ignore-button').textContent = 'Ignore';
        }

        if (cardState.cards.length === 0) {
            console.log('No cards available for this mode:', mode);
            alert('No cards available for this mode');
            showMenu();
            return;
        }

        document.getElementById('menu').style.display = 'none';
        document.getElementById('reviewContainer').style.display = 'block';

        //console.log('Calling showNextCard for mode:', mode);
        showNextCard(mode);
    } catch (error) {
        console.error('Error in showMode:', error);
        alert('An error occurred. Please try again.');
        showMenu();
    }
}

function showNextCard(mode) {
    console.log('Entering showNextCard with mode:', mode);
    console.trace('showNextCard was called from:'); // Prints the call stack

    const state = cardStates[mode];
    let nextIndex;
    let attempts = 0;
    let currentCard;

    // Check if it's time to retest a wrong answer (after 4 cards)
    if (state.wrongAnswerQueue.length > 0 && state.cardsSinceLastWrong >= 4) {
        currentCard = state.wrongAnswerQueue.shift(); // Get the first wrong card from queue
        nextIndex = state.cards.findIndex(card => card.term === currentCard.term);
        state.cardsSinceLastWrong = 0; // Reset counter
    } else {

        // Regular card selection logic
        if (state.visitedIndices.length === state.cards.length) {
            console.log('All cards reviewed. Saving data and returning to menu.');
            saveData(cards);
            showMenu();
            return;
        }



        // here was the do while loop
        
    let availableCards = state.cards
        .map((card, index) => ({ 
            index, 
            lastReviewed: new Date(card.lastReviewed) 
        }))
        .filter(card => !state.visitedIndices.includes(card.index))
        .sort((a, b) => a.lastReviewed - b.lastReviewed);
    
    if (availableCards.length > 0) {
        nextIndex = availableCards[0].index;
    } else {
        console.error('No available cards found');
        showMenu();
        return;
    }

        // end of do while loop








        currentCard = state.cards[nextIndex];
        state.cardsSinceLastWrong++; // Increment counter for regular cards
    }

    
    state.currentIndex = nextIndex;
    if(!state.visitedIndices.includes(nextIndex)){
        state.visitedIndices.push(nextIndex);
    }


    const wordDisplay = document.getElementById('currentWord');
    
    
    // Calculate progress percentage
    let progress = 0;
    if (currentCard.level > 0) {
        progress = Math.min((currentCard.level / 9) * 100, 100);
    }
    
    // Determine color based on progress
    let color = '#e74c3c'; // Red for fresh words (level 0-3)
    if (progress >= 33 && progress < 66) {
        color = '#f39c12'; // Orange for medium learning (level 4-6)
    } else if (progress >= 66) {
        color = '#2ecc71'; // Green for almost learned (level 7-9)
    }
    
    // First, clone the element to remove all event listeners
    const newWordDisplay = wordDisplay.cloneNode(true);
    
    
    // Create the new structure with word and progress circle
    newWordDisplay.innerHTML = `
        <div class="word-display-content">
            <div class="word-term">
                ${currentCard.term}
                <span class="audio-icon">🔊</span>
            </div>
            <div class="progress-circle" style="--progress: ${progress}%; --color: ${color}">
                <span>${Math.round(progress)}%</span>
            </div>
        </div>
    `;






    
    
    // Add click event listener to the new element
    newWordDisplay.onclick = () => playAudio(currentCard.term);
    
    // Replace old element with the new one
    wordDisplay.parentNode.replaceChild(newWordDisplay, wordDisplay);

    // Play audio automatically when card is shown
    playAudio(currentCard.term);

    // Generate options
    const options = [state.cards[nextIndex].definition]; // Start with the correct answer
    const usedIndices = new Set([nextIndex]); // Track used indices
    const maxIncorrectOptions = Math.min(3, state.cards.length - 1); // Maximum incorrect options

    let optionAttempts = 0;
    while (options.length < maxIncorrectOptions + 1 && optionAttempts < 100) {
        const randomIndex = Math.floor(Math.random() * state.cards.length);
        if (!usedIndices.has(randomIndex)) {
            options.push(state.cards[randomIndex].definition); // Add a wrong option
            usedIndices.add(randomIndex);
        }
        optionAttempts++;
    }
    if (options.length < maxIncorrectOptions + 1) {
        console.error('Failed to generate enough options after 100 attempts');
    }

    // Shuffle options
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    currentOptions = shuffledOptions;
    
    // Display options directly
    const optionsContainer = document.getElementById('optionsBigContainer');
    if (!optionsContainer) {
        console.error('Options container not found!');
        return;
    }

    optionsContainer.innerHTML = ''; // Clear previous options
    currentOptions.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.onclick = () => checkAnswer(index, mode);
        optionsContainer.appendChild(optionElement); // Add the option to the container
    });
}

function checkAnswer(selectedIndex, mode) {
    console.log('Checking Answer with mode:', mode);
    console.trace('checkAnswer was called from:'); // Prints the call stack
    const state = cardStates[mode];
    const currentCard = state.cards[state.currentIndex];
    const mainCardIndex = cards.findIndex(card => card.term === currentCard.term);
    const correctAnswer = currentCard.definition;
    const options = document.querySelectorAll('.option');
    const isCorrect = currentOptions[selectedIndex] === correctAnswer;
    
    options.forEach((option, index) => {
        if (currentOptions[index] === correctAnswer) {
            option.classList.add('correct');
        } else if (index === selectedIndex) {
            option.classList.add('incorrect');
        }
    });

    // Update card stats and handle wrong answers
    const mainCard = cards[mainCardIndex];
    if (!isCorrect) {
        mainCard.level = mainCard.level > 1 ? mainCard.level - 1 : 1;
        mainCard.difficulty = 1;

        // Add card to wrong answer queue if not already there
        if (!state.wrongAnswerQueue.some(card => card.term === currentCard.term)) {
            state.wrongAnswerQueue.push(currentCard);
        }
    } else {
        mainCard.level = mainCard.level < 9 ? mainCard.level + 1 : 9;
        mainCard.difficulty = 0;

    
    // If this was a retested card and now correct, remove it from wrong queue
    const wrongIndex = state.wrongAnswerQueue.findIndex(card => card.term === currentCard.term);
    if (wrongIndex !== -1) {
        state.wrongAnswerQueue.splice(wrongIndex, 1);
    }
}

    // Update progress bar immediately after answer
    const wordDisplay = document.getElementById('currentWord');
    const progressCircle = wordDisplay.querySelector('.progress-circle');
    if (progressCircle) {
        // Calculate new progress
        const newProgress = Math.min((mainCard.level / 9) * 100, 100);
        
        // Determine new color based on progress
        let newColor = '#e74c3c'; // Red for fresh words (level 0-3)
        if (newProgress >= 33 && newProgress < 66) {
            newColor = '#f39c12'; // Orange for medium learning (level 4-6)
        } else if (newProgress >= 66) {
            newColor = '#2ecc71'; // Green for almost learned (level 7-9)
        }

        // Update progress circle styles with animation
        progressCircle.style.setProperty('--progress', newProgress);
        progressCircle.style.setProperty('--color', newColor);
        
        // Update percentage text with animation
        const percentageSpan = progressCircle.querySelector('span');
        if (percentageSpan) {
            // Animate the percentage number
            const startProgress = parseInt(percentageSpan.textContent);
            const endProgress = Math.round(newProgress);
            
            if (startProgress !== endProgress) {
                animateNumber(percentageSpan, startProgress, endProgress, 1000); // 1000ms animation duration
            }
        }
    }


    // update last reviewed date
    mainCard.lastReviewed = new Date();
    
    // update next review date based on level
    const hours = {
        0:0,
        1:3,
        2:6,
        3:12,
        4:24,
        5:48,
        6:96,
        7:168,
        8:336,
        9:672
    }
    mainCard.nextReview = new Date(mainCard.lastReviewed.getTime() + hours[mainCard.level] * 60 * 60 * 1000);

    // Wait before showing next card
    setTimeout(() => {
        options.forEach(option => option.classList.remove('correct', 'incorrect'));
        asyncSaveData(cards);
        showNextCard(mode);
    }, 1500);
}


async function asyncSaveData(dataToBeSaved) {
    //options.forEach(option => option.classList.remove('correct', 'incorrect'));

    // Save data but don't refresh
    await saveData(dataToBeSaved);
    
    // Continue to next card
    //showNextCard(mode);
}










// Helper function to animate number changes
function animateNumber(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easedProgress = progress < .5 ? 
            4 * progress * progress * progress : 
            1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const current = Math.round(start + (range * easedProgress));
        element.textContent = `${current}%`;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Ignore card
function toggleIgnore() {
    console.trace('toggleIgnore was called from:'); // Prints the call stack
    const state = cardStates[currentMode]; // currentMode should be set when entering a mode
    const currentCard = state.cards[state.currentIndex];
    const mainCardIndex = cards.findIndex(card => card.term === currentCard.term);

    // Toggle the ignored status
    cards[mainCardIndex].ignored = !cards[mainCardIndex].ignored;
    
        // Update the current mode's cards array
        if (currentMode === 'difficult') {
            state.cards = cards.filter(card => card.difficulty === 1 && !card.ignored);
        } else if (currentMode === 'ignored') {
            state.cards = cards.filter(card => card.ignored);
        } else {
            state.cards = cards.filter(card => card.level > 0 && !card.ignored);
        }
    
    // Save data and show next card
    asyncSaveData(cards);
    showNextCard(currentMode);
}

// Add badges to all menu items initially
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        if (!item.querySelector('.badge')) {
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = '0';
            item.appendChild(badge);
        }
    });
});


// UI 
function showMenu() {
    console.log('Entering showMenu');
    console.trace('showMenu was called from:'); // Prints the call stack
    currentMode = null; // Reset current mode when returning to menu

    // Hide all containers
    document.getElementById('menu').style.display = 'grid';
    document.getElementById('reviewContainer').style.display = 'none';
    document.getElementById('niveauContainer').style.display = 'none';
    document.getElementById('niveauWordsContainer').style.display = 'none';

    const newWords = cards.filter(card => card.level === 0 && !card.ignored).length;
    const totalWords = cards.length;
    const reviewWords = cards.filter(card => card.level > 0 && card.nextReview <= new Date() && !card.ignored).length;
    const difficultWords = cards.filter(card => card.difficulty == 1 && !card.ignored).length;
    const ignoredWords = cards.filter(card => card.ignored).length;

    // Update badges
    document.querySelector('.learn-new .badge').textContent = newWords;
    document.querySelector('.classic-review .badge').textContent = `${reviewWords}/${totalWords}`;
    document.querySelector('.difficult-words .badge').textContent = `${difficultWords}/${totalWords}`;
    document.querySelector('.ignored-words .badge').textContent = `${ignoredWords}/${totalWords}`;    
}


function showNiveau() {
    //document.getElementById('niveauGrid').style.display = 'none';
    document.getElementById('menu').style.display = 'none';
    document.getElementById('reviewContainer').style.display = 'none';
    document.getElementById('niveauGrid').style.display = 'block';
    document.getElementById('niveauContainer').style.display = 'block';
    document.getElementById('niveauWordsContainer').style.display = 'none';
    
    const niveauGrid = document.getElementById('niveauGrid');
    niveauGrid.innerHTML = '';

    // Get unique niveaus from cards
    const niveaus = [...new Set(cards.map(card => card.niveau))].sort();

    niveaus.forEach(niveau => {
        const niveauCards = cards.filter(card => card.niveau === niveau);
        const completedCards = niveauCards.filter(card => card.level > 0).length;
        const totalCards = niveauCards.length;
        
        const niveauElement = document.createElement('div');
        niveauElement.className = 'niveau-item';
        if (completedCards === totalCards) {
            niveauElement.classList.add('completed');
        } else if (completedCards > 0) {
            niveauElement.classList.add('in-progress');
        }
        
        niveauElement.innerHTML = `
            <div class="niveau-title">${niveau}</div>
            <div class="niveau-progress">${completedCards}/${totalCards} words</div>
        `;
        
        niveauElement.onclick = () => startNiveauLearning(niveau);
        niveauGrid.appendChild(niveauElement);
    });
}




    // Create an audio element

function playAudio(term) {
    const audio = new Audio(`audio/${term}.mp3`);

    
    // Play the audio
    audio.play().catch(error => console.error(`Error playing audio for: ${term}\n`, error));
}
















function startNiveauLearning(niveau) {
    // Hide niveau grid and show words container
    document.getElementById('niveauGrid').style.display = 'none';
    document.getElementById('menu').style.display = 'none';
    document.getElementById('reviewContainer').style.display = 'none';
    document.getElementById('niveauContainer').style.display = 'none';
    document.getElementById('niveauWordsContainer').style.display = 'block';


    const wordsContainer = document.getElementById('niveauWordsContainer');
    wordsContainer.style.display = 'block';
    
    // Set niveau title
    document.getElementById('niveauTitle').textContent = niveau;
    
    // Get words for this niveau
    const niveauWords = cards.filter(card => card.niveau === niveau);
    
    // Create word list
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';
    
    niveauWords.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-card';
        
        // Add cursor pointer style to indicate clickability
        wordElement.style.cursor = 'pointer';

        // calculate progress 
        let progress = 0;        
        if (word.level > 0) {
            progress = Math.min((word.level / 9) * 100, 100); // Calculate progress percentage
        }

        // Determine color based on progress
        let color = '#e74c3c'; // Red for fresh words (level 0-3)
        if (progress >= 33 && progress < 66) {
            color = '#f39c12'; // Orange for medium learning (level 4-6)
        } else if (progress >= 66) {
            color = '#2ecc71'; // Green for almost learned (level 7-9)
        }
        
        wordElement.innerHTML = `
            <div class="word-info">
                <div class="word-term">
                    ${word.term}
                    <span class="audio-icon">🔊</span>
                </div>
                <div class="word-definition">${word.definition}</div>
            </div>

            <div class="progress-circle" style="--progress: ${progress}%; --color: ${color}">
                            <span>${Math.round(progress)}%</span>        `;
        
        
        // Add click event listener for audio playback
        wordElement.addEventListener('click', () => {
            playAudio(word.term);
        });

        wordList.appendChild(wordElement);
    });
}
