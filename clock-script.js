// Format time with leading zeros
function formatTime(hours, minutes, seconds) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Get AM/PM
function getAMPM(hours) {
    return hours >= 12 ? 'PM' : 'AM';
}

// Update all clocks
function updateClocks() {
    const now = new Date();

    // Update local time
    updateLocalTime(now);

    // Update all timezone clocks
    document.querySelectorAll('[data-timezone]').forEach(element => {
        const timezone = element.getAttribute('data-timezone');
        updateTimezone(timezone, element);
    });

    // Update custom clocks
    document.querySelectorAll('[data-custom-timezone]').forEach(element => {
        const timezone = element.getAttribute('data-custom-timezone');
        updateTimezone(timezone, element);
    });
}

// Update local time
function updateLocalTime(now) {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Display in 12-hour format
    const displayHours = hours % 12 || 12;
    const timeString = formatTime(displayHours, minutes, seconds);
    const period = getAMPM(hours);

    const localTimeEl = document.getElementById('localTime');
    const localPeriodEl = document.getElementById('localPeriod');

    if (localTimeEl) localTimeEl.textContent = timeString;
    if (localPeriodEl) localPeriodEl.textContent = period;

    // Update date
    const dateEl = document.getElementById('localDate');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Update timezone clock
function updateTimezone(timezone, element) {
    const now = new Date();
    
    try {
        // Create formatter for the specific timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).formatToParts(now);

        let hours = 0, minutes = 0, seconds = 0, period = 'AM';

        parts.forEach(part => {
            if (part.type === 'hour') hours = parseInt(part.value);
            if (part.type === 'minute') minutes = parseInt(part.value);
            if (part.type === 'second') seconds = parseInt(part.value);
            if (part.type === 'dayPeriod') period = part.value;
        });

        const timeString = formatTime(hours, minutes, seconds);
        
        // Update time display
        if (element.getAttribute('data-timezone')) {
            element.textContent = timeString;
            
            // Update period
            const periodElement = document.querySelector(`[data-timezone-period="${element.getAttribute('data-timezone')}"]`);
            if (periodElement) {
                periodElement.textContent = period;
            }
        } else if (element.getAttribute('data-custom-timezone')) {
            element.textContent = timeString;
            
            // Update period for custom
            const periodElement = element.parentElement.querySelector('[data-custom-period]');
            if (periodElement) {
                periodElement.textContent = period;
            }
        }
    } catch (error) {
        console.error(`Error updating timezone ${timezone}:`, error);
        element.textContent = 'Error';
    }
}

// Calculate UTC offset for a timezone
function getUTCOffset(timezone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
    });

    const now = new Date();
    const tzTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (now - tzTime) / (1000 * 60 * 60);
    
    const sign = offset > 0 ? '-' : '+';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset);
    const minutes = (absOffset % 1) * 60;

    if (minutes === 0) {
        return `UTC${sign}${hours}`;
    } else {
        return `UTC${sign}${hours}:${Math.round(minutes)}`;
    }
}

// Add custom timezone clock
function addCustomTimezone() {
    const nameInput = document.getElementById('customTzName');
    const timezoneInput = document.getElementById('customTzTimezone');
    const container = document.getElementById('customClocks');

    const name = nameInput.value.trim();
    const timezone = timezoneInput.value.trim();

    if (!name || !timezone) {
        alert('Please enter both city name and timezone');
        return;
    }

    // Validate timezone by trying to use it
    try {
        const now = new Date();
        new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit'
        }).format(now);
    } catch (error) {
        alert(`Invalid timezone: ${timezone}\nPlease use a valid IANA timezone (e.g., Europe/Berlin)`);
        return;
    }

    // Create custom clock card
    const card = document.createElement('div');
    card.className = 'custom-clock-card';
    card.innerHTML = `
        <button class="remove-custom-btn" onclick="this.parentElement.remove(); updateClocks();">×</button>
        <div class="clock-header-title">
            <span class="timezone-name">${name}</span>
            <span class="timezone-code">${timezone.split('/')[1] || timezone}</span>
        </div>
        <div class="clock-display">
            <div class="time-digits" data-custom-timezone="${timezone}">00:00:00</div>
            <div class="time-period" data-custom-period="${timezone}">AM</div>
        </div>
        <div class="timezone-offset" id="offset-${timezone}">${getUTCOffset(timezone)}</div>
    `;

    container.appendChild(card);

    // Clear inputs
    nameInput.value = '';
    timezoneInput.value = '';

    // Update the clock immediately
    updateClocks();
}

// Event listeners
if (document.getElementById('addCustomTz')) {
    document.getElementById('addCustomTz').addEventListener('click', addCustomTimezone);
}

// Allow Enter key to add timezone
const timezoneInput = document.getElementById('customTzTimezone');
if (timezoneInput) {
    timezoneInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCustomTimezone();
        }
    });
}

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
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Initial update
updateClocks();

// Update every second
setInterval(updateClocks, 1000);

console.log('Clock app loaded successfully!');