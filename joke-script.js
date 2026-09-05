// API endpoint for jokes
const JOKE_API = 'https://v2.jokeapi.dev/joke/';

let currentJoke = null;
let jokeHistory = [];
let selectedCategory = 'any';

// Load joke history from localStorage
function loadHistory() {
    const saved = localStorage.getItem('jokeHistory');
    if (saved) {
        jokeHistory = JSON.parse(saved);
        updateHistoryDisplay();
    }
}

// Save joke history to localStorage
function saveHistory() {
    localStorage.setItem('jokeHistory', JSON.stringify(jokeHistory));
}

// Display loading state
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
    document.getElementById('errorMessage').style.display = 'none';
    document.querySelector('.joke-card').style.opacity = '0.5';
}

// Hide loading state
function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.querySelector('.joke-card').style.opacity = '1';
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    hideLoading();
}

// Fetch joke from API
async function fetchJoke() {
    showLoading();
    
    try {
        // Build URL based on category
        let url = JOKE_API;
        if (selectedCategory === 'any') {
            url += 'Any';
        } else {
            url += selectedCategory;
        }

        // Add range parameter to exclude explicit jokes
        url += '?range=0-2';

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.message || 'Failed to fetch joke');
        }

        currentJoke = data;
        displayJoke(data);
        hideLoading();
        document.getElementById('errorMessage').style.display = 'none';
        
        // Add to history
        addToHistory(data);
    } catch (error) {
        console.error('Error fetching joke:', error);
        showError(`Oops! ${error.message}. Please try again.`);
    }
}

// Display joke on the page
function displayJoke(joke) {
    const jokeIcon = document.querySelector('.joke-icon');
    const jokeContent = document.querySelector('.joke-content');
    const jokeType = document.getElementById('jokeType');
    const jokeText = document.getElementById('jokeText');
    const jokeSetup = document.getElementById('jokeSetup');
    const jokeDelivery = document.getElementById('jokeDelivery');

    // Rotate emoji
    jokeIcon.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;

    // Set joke type
    jokeType.textContent = `${joke.category} • ${joke.type}`;

    // Display joke content
    if (joke.type === 'single') {
        jokeText.textContent = joke.joke;
        jokeSetup.style.display = 'none';
        jokeDelivery.style.display = 'none';
    } else {
        jokeText.style.display = 'none';
        jokeSetup.textContent = joke.setup;
        jokeDelivery.textContent = joke.delivery;
        jokeSetup.style.display = 'block';
        jokeDelivery.style.display = 'block';
        jokeText.style.display = 'none';
    }

    // Add animation
    jokeContent.style.animation = 'none';
    setTimeout(() => {
        jokeContent.style.animation = 'slideUp 0.6s ease';
    }, 10);
}

// Add joke to history
function addToHistory(joke) {
    let jokeText = '';
    if (joke.type === 'single') {
        jokeText = joke.joke;
    } else {
        jokeText = `${joke.setup} ... ${joke.delivery}`;
    }

    const historyEntry = {
        text: jokeText,
        category: joke.category,
        type: joke.type,
        timestamp: new Date().toLocaleTimeString()
    };

    // Add to beginning of array (most recent first)
    jokeHistory.unshift(historyEntry);

    // Keep only last 20 jokes
    if (jokeHistory.length > 20) {
        jokeHistory.pop();
    }

    saveHistory();
    updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    const historyCount = document.getElementById('historyCount');

    historyCount.textContent = `${jokeHistory.length} ${jokeHistory.length === 1 ? 'joke' : 'jokes'} saved`;

    if (jokeHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-history">No jokes saved yet. Get some jokes and they\'ll appear here!</p>';
        return;
    }

    historyList.innerHTML = jokeHistory.map((entry, index) => `
        <div class="history-item">
            <div class="history-item-text">${escapeHtml(entry.text)}</div>
            <div class="history-item-type">${entry.category} • ${entry.timestamp}</div>
        </div>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy current joke to clipboard
function copyJoke() {
    if (!currentJoke) {
        alert('Get a joke first!');
        return;
    }

    let jokeText = '';
    if (currentJoke.type === 'single') {
        jokeText = currentJoke.joke;
    } else {
        jokeText = `${currentJoke.setup}\n\n${currentJoke.delivery}`;
    }

    navigator.clipboard.writeText(jokeText).then(() => {
        const btn = document.getElementById('copyJokeBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        alert('Failed to copy joke');
    });
}

// Clear history
function clearHistory() {
    if (confirm('Are you sure you want to clear all joke history?')) {
        jokeHistory = [];
        saveHistory();
        updateHistoryDisplay();
    }
}

// Event listeners
function initializeEventListeners() {
    // Get joke button
    document.getElementById('getJokeBtn').addEventListener('click', fetchJoke);

    // Next joke button (same as get joke)
    document.getElementById('nextJokeBtn').addEventListener('click', fetchJoke);

    // Copy joke button
    document.getElementById('copyJokeBtn').addEventListener('click', copyJoke);

    // Clear history button
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedCategory = this.getAttribute('data-category');
        });
    });

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
        });
    });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    initializeEventListeners();
    console.log('Joke Generator loaded successfully!');
});
