// Tower data loaded from files
const towerData = {
    effortless: [],
    easy: [],
    medium: [],
    hard: [],
    difficult: [],
    challenging: [],
    intense: [],
    remorseless: [],
    insane: [],
    extreme: [],
    terrifying: [],
    catastrophic: [],
    horrific: [],
    unreal: [],
    nil: [],
    error: [],
    toohard: []
};

const difficultyOrder = [
    'effortless',
    'easy',
    'medium',
    'hard',
    'difficult',
    'challenging',
    'intense',
    'remorseless',
    'insane',
    'extreme',
    'terrifying',
    'catastrophic',
    'horrific',
    'unreal',
    'nil',
    'error',
    'toohard'
];

const difficultyDisplayNames = {
    effortless: 'Effortless',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    difficult: 'Difficult',
    challenging: 'Challenging',
    intense: 'Intense',
    remorseless: 'Remorseless',
    insane: 'Insane',
    extreme: 'Extreme',
    terrifying: 'Terrifying',
    catastrophic: 'Catastrophic',
    horrific: 'Horrific',
    unreal: 'Unreal',
    nil: 'nil',
    error: 'eRRoR',
    toohard: 'TooHard'
};

let towerDifficultyLookup = new Map();

// Current game state
let currentTimer = null;
let gameTimer = null; // Timer for the 60 second countdown after tower appears
let currentDifficulty = null;
let currentTower = null;
let caughtTowers = new Map(); // Map<towerName, count>
let badges = new Set(); // Set of difficulty names that have been unlocked
let currentMusic = null; // Current music audio object
let gems = 0; // Player's gem count
let isIntentionallySpawned = false; // Flag to track if tower was spawned from shop
let towerStartTime = null; // Start time of the current tower

const profileDefaults = {
    username: '',
    favoriteTower: '',
    leastFavoriteTower: '',
    quote: '',
    playtimeSeconds: 0
};

let profileData = { ...profileDefaults };
let playtimeInterval = null;
let lastPlaytimeTimestamp = null;

let takenUsernames = new Set();

const ACCOUNT_STORAGE_KEY = 'accounts';
const CURRENT_USER_STORAGE_KEY = 'currentUsername';

let accounts = {};
let currentUsername = null;
let currentAccount = null;

const DEFAULT_OWNER_USERNAME = 'I_Am_Grassy';
const DEFAULT_OWNER_PASSWORD = 'towerofqwertyuiopcompleted';

const LEGACY_OWNER_USERNAMES = ['livingmy9lifes', 'IAmGrassy'];

const rankConfigDefaults = {
    ownerUsers: ['I_Am_Grassy'],
    coOwnerUsers: [],
    testerUsers: [],
    labels: {
        owner: 'Owner',
        coOwner: 'Co-Owner',
        tester: 'Tester',
        player: 'Player'
    }
};

const rankClassMap = {
    player: 'rank-player',
    owner: 'rank-owner',
    coOwner: 'rank-co-owner',
    tester: 'rank-tester'
};

let rankConfig = createDefaultRankConfig();

const GLOBAL_STATS_KEY = 'globalStats';
let globalStats = {
    totalPlaytimeSeconds: 0,
    totalTowerCatches: 0
};

function loadGlobalStats() {
    try {
        const stored = localStorage.getItem(GLOBAL_STATS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                globalStats.totalPlaytimeSeconds = parseInt(parsed.totalPlaytimeSeconds, 10) || 0;
                globalStats.totalTowerCatches = parseInt(parsed.totalTowerCatches, 10) || 0;
            }
        }
    } catch (error) {
        console.warn('Failed to load global stats, resetting.', error);
        globalStats.totalPlaytimeSeconds = 0;
        globalStats.totalTowerCatches = 0;
    }
}

function saveGlobalStats() {
    try {
        localStorage.setItem(GLOBAL_STATS_KEY, JSON.stringify(globalStats));
    } catch (error) {
        console.error('Failed to save global stats:', error);
    }
}

function incrementGlobalPlaytime(seconds) {
    const amount = Math.max(0, parseInt(seconds, 10) || 0);
    if (!amount) return;
    globalStats.totalPlaytimeSeconds += amount;
    saveGlobalStats();
}

function incrementGlobalTowerCatches(count) {
    const amount = Math.max(0, parseInt(count, 10) || 0);
    if (!amount) return;
    globalStats.totalTowerCatches += amount;
    saveGlobalStats();
}

const announcementQueue = [];
let announcementActive = false;
const announcementDifficulties = new Set(['insane', 'extreme', 'terrifying', 'catastrophic', 'horrific', 'unreal', 'nil', 'error', 'toohard']);
const amplifiedAnnouncementDifficulties = new Set(['horrific', 'unreal', 'nil', 'error', 'toohard']);

function enqueueAnnouncement(text, difficulty) {
    if (!announcementDifficulties.has(difficulty)) {
        return;
    }
    announcementQueue.push({ text, difficulty });
    if (!announcementActive) {
        displayNextAnnouncement();
    }
}

function displayNextAnnouncement() {
    if (!announcementQueue.length) {
        announcementActive = false;
        const bar = document.getElementById('announcementBar');
        const overlay = document.getElementById('announcementOverlayInner');
        if (bar) {
            bar.style.display = 'none';
        }
        if (overlay) {
            overlay.style.display = 'none';
        }
        return;
    }

    announcementActive = true;
    const { text, difficulty } = announcementQueue.shift();
    const color = getDifficultyColor(difficulty) || '#ffffff';
    const bar = document.getElementById('announcementBar');
    const overlay = document.getElementById('announcementOverlayInner');

    if (bar) {
        bar.style.display = 'block';
        bar.style.backgroundColor = color;
        bar.textContent = text;
        bar.style.textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';
    }

    if (overlay) {
        overlay.style.display = 'inline-flex';
        overlay.style.backgroundColor = color;
        overlay.textContent = text;
        overlay.style.textShadow = '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000';
        overlay.style.fontStyle = amplifiedAnnouncementDifficulties.has(difficulty) ? 'italic' : 'normal';
        overlay.style.fontWeight = amplifiedAnnouncementDifficulties.has(difficulty) ? '800' : '700';
        overlay.style.fontSize = amplifiedAnnouncementDifficulties.has(difficulty) ? '26px' : '22px';
    }

    setTimeout(() => {
        if (bar) {
            bar.style.display = 'none';
        }
        if (overlay) {
            overlay.style.display = 'none';
        }
        announcementActive = false;
        displayNextAnnouncement();
    }, 5000);
}

function announceCatch(username, towerName, difficulty) {
    if (!announcementDifficulties.has(difficulty)) {
        return;
    }
    const displayName = difficultyDisplayNames[difficulty] || difficulty;
    const message = `${username} caught ${towerName} (${displayName})!`;
    enqueueAnnouncement(message, difficulty);
}

function setGameMessage(text, { type = 'default', difficulty = null } = {}) {
    const element = document.getElementById('message');
    if (!element) return;

    element.textContent = text || '';

    let className = 'message';
    if (type === 'success') {
        className += ' success';
    } else if (type === 'error') {
        className += ' error';
    }
    element.className = className;

    let color = '#ffffff';
    if (type === 'error') {
        color = '#f44336';
    }
    if (difficulty) {
        color = getDifficultyColor(difficulty) || color;
    }
    element.style.color = color;
    element.style.textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';

    if (difficulty && amplifiedAnnouncementDifficulties.has(difficulty)) {
        element.style.fontSize = '22px';
        element.style.fontStyle = 'italic';
        element.style.fontWeight = '800';
    } else if (difficulty && announcementDifficulties.has(difficulty)) {
        element.style.fontSize = '20px';
        element.style.fontStyle = 'italic';
        element.style.fontWeight = '700';
    } else {
        element.style.fontSize = '18px';
        element.style.fontStyle = 'normal';
        element.style.fontWeight = type === 'error' ? '700' : 'bold';
    }
}

async function loadTowerListFile(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
    } catch (error) {
        console.warn(`Failed to load ${filename}:`, error);
        return null;
    }
}

function clearGameMessage() {
    setGameMessage('', { type: 'default' });
}

// Load tower data from files
async function loadTowerData() {
    const mappings = [
        { key: 'effortless', file: 'Effortless.txt' },
        { key: 'easy', file: 'Easy.txt' },
        { key: 'medium', file: 'Medium.txt' },
        { key: 'hard', file: 'Hard.txt' },
        { key: 'difficult', file: 'Difficult.txt' },
        { key: 'challenging', file: 'Challenging.txt' },
        { key: 'intense', file: 'Intense.txt' },
        { key: 'remorseless', file: 'Remorseless.txt' },
        { key: 'insane', file: 'Insane.txt' },
        { key: 'extreme', file: 'Extreme.txt' },
        { key: 'terrifying', file: 'Terrifying.txt' },
        { key: 'catastrophic', file: 'Catastrophic.txt' },
        { key: 'horrific', file: 'Horrific.txt' },
        { key: 'unreal', file: 'Unreal.txt' },
        { key: 'nil', file: 'nil.txt' },
        { key: 'error', file: 'eRRoR.txt' },
        { key: 'toohard', file: 'TooHard.txt' }
    ];

    const missingFiles = [];

    for (const { key, file } of mappings) {
        const entries = await loadTowerListFile(file);
        if (entries === null) {
            missingFiles.push(file);
            towerData[key] = [];
        } else {
            towerData[key] = entries;
        }
    }

    const totalTowers = difficultyOrder.reduce((sum, diff) => {
        const list = towerData[diff];
        return sum + (Array.isArray(list) ? list.length : 0);
    }, 0);

    if (totalTowers === 0) {
        console.error('No tower data could be loaded. Check that the difficulty .txt files are present.');
        setGameMessage('Error: No tower data found. Please ensure the difficulty .txt files exist.', { type: 'error' });
        return;
    }

    if (missingFiles.length) {
        console.warn(`Loaded tower data with missing files: ${missingFiles.join(', ')}`);
    }
}

function buildTowerDifficultyLookup() {
    towerDifficultyLookup = new Map();
    difficultyOrder.forEach(difficulty => {
        const towers = towerData[difficulty] || [];
        towers.forEach(towerName => {
            const trimmed = towerName.trim();
            if (trimmed) {
                towerDifficultyLookup.set(trimmed, difficulty);
            }
        });
    });
}

function updateTowersDatalist() {
    const datalist = document.getElementById('towersDatalist');
    if (!datalist) return;
    datalist.innerHTML = '';
    difficultyOrder.forEach(difficulty => {
        const towers = towerData[difficulty] || [];
        towers.forEach(towerName => {
            const option = document.createElement('option');
            option.value = towerName.trim();
            datalist.appendChild(option);
        });
    });
}

function loadTakenUsernames() {
    try {
        const stored = localStorage.getItem('takenUsernames');
        if (!stored) {
            takenUsernames = new Set();
            return;
        }
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            takenUsernames = new Set(parsed);
        } else {
            takenUsernames = new Set();
        }
    } catch (error) {
        console.warn('Failed to load taken usernames, resetting list.', error);
        takenUsernames = new Set();
    }
}

function saveTakenUsernames() {
    const usernamesArray = Array.from(takenUsernames);
    localStorage.setItem('takenUsernames', JSON.stringify(usernamesArray));
}

function generateDefaultUsername() {
    loadTakenUsernames();
    let attempt = 0;
    let candidate = '';
    do {
        const randomNumber = Math.floor(Math.random() * 100000000);
        candidate = `Player${randomNumber.toString().padStart(8, '0')}`;
        attempt++;
    } while (takenUsernames.has(candidate) && attempt < 1000);
    takenUsernames.add(candidate);
    saveTakenUsernames();
    return candidate;
}

function registerUsername(username) {
    loadTakenUsernames();
    takenUsernames.add(username);
    saveTakenUsernames();
}

function updateRegisteredUsername(oldUsername, newUsername) {
    loadTakenUsernames();
    if (oldUsername) {
        takenUsernames.delete(oldUsername);
    }
    takenUsernames.add(newUsername);
    saveTakenUsernames();
}

function isUsernameTaken(username) {
    loadTakenUsernames();
    return takenUsernames.has(username);
}

function createDefaultRankConfig() {
    return {
        ownerUsers: [...rankConfigDefaults.ownerUsers],
        coOwnerUsers: [...rankConfigDefaults.coOwnerUsers],
        testerUsers: [...rankConfigDefaults.testerUsers],
        labels: { ...rankConfigDefaults.labels }
    };
}

function normalizeUsernameValue(name) {
    if (typeof name !== 'string') {
        return '';
    }
    return name.trim().toLowerCase();
}

function dedupeUserList(list) {
    const seen = new Set();
    const result = [];
    list.forEach(name => {
        if (typeof name !== 'string') {
            return;
        }
        const trimmed = name.trim();
        if (!trimmed) return;
        const normalized = normalizeUsernameValue(trimmed);
        if (!seen.has(normalized)) {
            seen.add(normalized);
            result.push(trimmed);
        }
    });
    return result;
}

function accountStorageKey(base, username = currentUsername) {
    if (!username) return null;
    return `${base}__${username}`;
}

function loadAccounts() {
    try {
        const stored = localStorage.getItem(ACCOUNT_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                accounts = parsed;
            } else {
                accounts = {};
            }
        } else {
            accounts = {};
        }
    } catch (error) {
        console.warn('Failed to load accounts, starting fresh.', error);
        accounts = {};
    }
}

function saveAccounts() {
    try {
        localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
        console.error('Failed to save accounts:', error);
    }
}

function restoreCurrentUser() {
    const storedUsername = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (storedUsername && accounts[storedUsername]) {
        currentUsername = storedUsername;
        currentAccount = accounts[storedUsername];
        registerUsername(currentUsername);
        return true;
    }
    currentUsername = null;
    currentAccount = null;
    return false;
}

function setCurrentUser(username) {
    if (username && accounts[username]) {
        currentUsername = username;
        currentAccount = accounts[username];
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, username);
        registerUsername(username);
        return true;
    }
    currentUsername = null;
    currentAccount = null;
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    return false;
}

function refreshTakenUsernames() {
    loadTakenUsernames();
    Object.keys(accounts).forEach(name => {
        takenUsernames.add(name);
    });
    saveTakenUsernames();
}

function migrateLegacyDataIfNeeded() {
    const accountNames = Object.keys(accounts || {});
    if (accountNames.length > 0) {
        return;
    }
    
    const legacyProfile = localStorage.getItem('profileData');
    if (!legacyProfile) {
        return;
    }
    
    let parsedProfile = null;
    try {
        parsedProfile = JSON.parse(legacyProfile);
    } catch (error) {
        console.warn('Failed to parse legacy profile data during migration.', error);
    }
    
    let username = parsedProfile?.username;
    if (typeof username !== 'string' || !username.trim()) {
        username = generateDefaultUsername();
    }
    username = username.trim();
    if (accounts[username]) {
        username = generateDefaultUsername();
    }
    
    accounts[username] = {
        passwordHash: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    saveAccounts();
    
    const migrateKey = (baseKey) => {
        const legacyValue = localStorage.getItem(baseKey);
        if (legacyValue !== null) {
            const newKey = accountStorageKey(baseKey, username);
            if (newKey) {
                localStorage.setItem(newKey, legacyValue);
            }
        }
    };
    
    ['profileData', 'caughtTowers', 'badges', 'gems', 'activeTower'].forEach(migrateKey);
    
    setCurrentUser(username);
    refreshTakenUsernames();
}

function hashPassword(password) {
    const text = `${password}|tower-index`;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(36);
}

function createAccount(username, password) {
    const trimmed = username.trim();
    const passwordHash = password ? hashPassword(password) : '';
    accounts[trimmed] = {
        passwordHash,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    saveAccounts();
    registerUsername(trimmed);
    refreshTakenUsernames();
}

function createAccountWithProfile(username, password) {
    createAccount(username, password);
    const profileKey = accountStorageKey('profileData', username);
    if (profileKey) {
        const profile = {
            ...profileDefaults,
            username,
            quote: 'No quote yet.'
        };
        localStorage.setItem(profileKey, JSON.stringify(profile));
    }
}

function verifyCredentials(username, password) {
    const account = accounts[username];
    if (!account) return false;
    const storedHash = account.passwordHash || '';
    if (!storedHash) {
        // No password set; treat empty password as valid
        return password === '';
    }
    return hashPassword(password) === storedHash;
}

function renameAccount(oldUsername, newUsername) {
    if (!oldUsername || !newUsername) {
        return false;
    }
    const trimmedOld = oldUsername.trim();
    const trimmedNew = newUsername.trim();
    if (!accounts[trimmedOld]) {
        return false;
    }
    if (accounts[trimmedNew]) {
        return false;
    }
    
    const bases = ['profileData', 'caughtTowers', 'badges', 'gems', 'activeTower'];
    bases.forEach(base => {
        const oldKey = accountStorageKey(base, trimmedOld);
        const newKey = accountStorageKey(base, trimmedNew);
        if (!oldKey || !newKey || oldKey === newKey) return;
        const value = localStorage.getItem(oldKey);
        if (value !== null) {
            localStorage.setItem(newKey, value);
            localStorage.removeItem(oldKey);
        }
    });
    
    const accountClone = { ...accounts[trimmedOld] };
    accounts[trimmedNew] = { ...accountClone, updatedAt: Date.now() };
    delete accounts[trimmedOld];
    saveAccounts();
    
    updateRegisteredUsername(trimmedOld, trimmedNew);
    refreshTakenUsernames();
    
    if (currentUsername === trimmedOld) {
        setCurrentUser(trimmedNew);
    }
    return true;
}

function teardownActiveSession() {
    stopPlaytimeTracking();
    if (currentTimer) {
        clearInterval(currentTimer);
        currentTimer = null;
    }
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    currentTower = null;
    currentDifficulty = null;
    isIntentionallySpawned = false;
    towerStartTime = null;
    
    const towerInput = document.getElementById('towerInput');
    const submitBtn = document.getElementById('submitBtn');
    const timerZone = document.getElementById('timerZone');
    const towerImage = document.getElementById('towerImage');

    if (towerInput) {
        towerInput.value = '';
        towerInput.disabled = true;
    }
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    if (timerZone) {
        timerZone.textContent = '--';
        timerZone.style.cursor = 'default';
        timerZone.title = '';
        timerZone.onclick = null;
    }
    if (towerImage) {
        towerImage.style.display = 'none';
        towerImage.src = '';
    }
    clearGameMessage();

    resetBackground();
    clearTowerOutline();
    stopMusic();
}

function ensureDefaultOwnerAccount() {
    if (!accounts[DEFAULT_OWNER_USERNAME]) {
        createAccountWithProfile(DEFAULT_OWNER_USERNAME, DEFAULT_OWNER_PASSWORD);
    }
}

function cleanupLegacyOwnerAccounts() {
    LEGACY_OWNER_USERNAMES.forEach(legacyName => {
        if (normalizeUsernameValue(legacyName) === normalizeUsernameValue(DEFAULT_OWNER_USERNAME)) {
            return;
        }
        const exists = Object.keys(accounts || {}).some(name => normalizeUsernameValue(name) === normalizeUsernameValue(legacyName));
        if (exists) {
            removeAccount(legacyName);
        } else {
            const lists = ['ownerUsers', 'coOwnerUsers', 'testerUsers'];
            lists.forEach(listKey => {
                const list = rankConfig[listKey];
                if (!Array.isArray(list)) return;
                rankConfig[listKey] = list.filter(name => normalizeUsernameValue(name) !== normalizeUsernameValue(legacyName));
            });
        }
    });
}

function initializeUserSession(username) {
    if (!username) return;
    setCurrentUser(username);
    profileData = loadProfileDataForUser(username);
    if (!profileData.username) {
        profileData.username = username;
        saveProfileData();
    }
    loadCaughtTowers();
    loadBadges();
    loadGems();
    updateProfileStatsDisplay();
    updateCollection();
    updateBadgesDisplay();
    startPlaytimeTracking();
    
    playMusic('Default.mp3');
    if (!restoreActiveTower()) {
        startGame();
    }
    hideAuthOverlay();
}

function showAuthOverlay(mode = 'login') {
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    setAuthMode(mode);
}

function hideAuthOverlay() {
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
}

function setAuthMode(mode) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    tabs.forEach(tab => {
        if (tab.dataset.authTab === mode) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    forms.forEach(form => {
        if (form.id === `${mode}Form`) {
            form.classList.add('auth-form-active');
        } else {
            form.classList.remove('auth-form-active');
        }
    });
    const errorElement = document.getElementById('authError');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

function setAuthError(message) {
    const errorElement = document.getElementById('authError');
    if (errorElement) {
        errorElement.textContent = message || '';
    }
}

function setupAuthUI() {
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetMode = tab.dataset.authTab || 'login';
            setAuthMode(targetMode);
        });
    });
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const usernameInput = document.getElementById('loginUsername');
            const passwordInput = document.getElementById('loginPassword');
            const username = usernameInput ? usernameInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';
            
            if (!username) {
                setAuthError('Please enter your username.');
                return;
            }
            if (!accounts[username]) {
                setAuthError('Account not found.');
                return;
            }
            if (!verifyCredentials(username, password)) {
                setAuthError('Incorrect password.');
                return;
            }
            
            setAuthError('');
            loginForm.reset();
            if (registerForm) {
                registerForm.reset();
            }
            teardownActiveSession();
            initializeUserSession(username);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const usernameInput = document.getElementById('registerUsername');
            const passwordInput = document.getElementById('registerPassword');
            const confirmInput = document.getElementById('registerPasswordConfirm');
            
            const username = usernameInput ? usernameInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';
            const confirmPassword = confirmInput ? confirmInput.value : '';
            
            const allowed = /^[A-Za-z0-9 _-]+$/;
            if (!username) {
                setAuthError('Choose a username.');
                return;
            }
            if (username.length > 32) {
                setAuthError('Username must be 32 characters or fewer.');
                return;
            }
            if (!allowed.test(username)) {
                setAuthError('Username can only contain letters, numbers, spaces, underscores, and hyphens.');
                return;
            }
            if (accounts[username] || isUsernameTaken(username)) {
                setAuthError('That username is already taken. Pick another.');
                return;
            }
            if (!password) {
                setAuthError('Please choose a password.');
                return;
            }
            if (password.length < 4) {
                setAuthError('Password must be at least 4 characters.');
                return;
            }
            if (password !== confirmPassword) {
                setAuthError('Passwords do not match.');
                return;
            }
            
            setAuthError('');
            createAccount(username, password);
            const profileKey = accountStorageKey('profileData', username);
            const newProfile = {
                ...profileDefaults,
                username,
                quote: 'No quote yet.'
            };
            if (profileKey) {
                localStorage.setItem(profileKey, JSON.stringify(newProfile));
            }
            registerForm.reset();
            if (loginForm) {
                loginForm.reset();
            }
            teardownActiveSession();
            initializeUserSession(username);
        });
    }

    setAuthMode('login');
}

function getSearchSuggestions(query) {
    const names = Object.keys(accounts);
    if (!query) {
        return names.slice(0, 5);
    }
    const lower = query.toLowerCase();
    return names
        .filter(name => name.toLowerCase().includes(lower))
        .sort((a, b) => {
            const aIndex = a.toLowerCase().indexOf(lower);
            const bIndex = b.toLowerCase().indexOf(lower);
            if (aIndex === bIndex) {
                return a.localeCompare(b);
            }
            return aIndex - bIndex;
        })
        .slice(0, 5);
}

function setupProfileSearch() {
    const input = document.getElementById('profileSearchInput');
    const suggestionsContainer = document.getElementById('profileSearchSuggestions');
    if (!input || !suggestionsContainer) return;
    
    let currentSuggestions = [];
    let activeIndex = -1;
    let blurTimeout = null;
    
    const clearSuggestions = () => {
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
        currentSuggestions = [];
        activeIndex = -1;
    };
    
    const applyActiveSuggestion = () => {
        const items = suggestionsContainer.querySelectorAll('.profile-search-suggestion');
        items.forEach((item, index) => {
            if (index === activeIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };
    
    const selectSuggestion = (username) => {
        if (!username) return;
        input.value = username;
        clearSuggestions();
        openProfileViewer(username);
    };
    
    const renderSuggestions = (list) => {
        suggestionsContainer.innerHTML = '';
        if (list.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        list.forEach((name, index) => {
            const item = document.createElement('div');
            item.className = 'profile-search-suggestion';
            item.textContent = name;
            item.addEventListener('mousedown', (event) => {
                event.preventDefault();
                selectSuggestion(name);
            });
            suggestionsContainer.appendChild(item);
        });
        suggestionsContainer.style.display = 'block';
        activeIndex = -1;
    };
    
    input.addEventListener('input', () => {
        if (!currentUsername) {
            showAuthOverlay('login');
            input.value = '';
            clearSuggestions();
            return;
        }
        
        const query = input.value.trim();
        currentSuggestions = getSearchSuggestions(query);
        renderSuggestions(currentSuggestions);
    });
    
    input.addEventListener('focus', () => {
        if (!currentUsername) {
            showAuthOverlay('login');
            return;
        }
        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }
        const query = input.value.trim();
        currentSuggestions = getSearchSuggestions(query);
        renderSuggestions(currentSuggestions);
    });
    
    input.addEventListener('keydown', (event) => {
        if (currentSuggestions.length === 0) {
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            activeIndex = (activeIndex + 1) % currentSuggestions.length;
            applyActiveSuggestion();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            activeIndex = (activeIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
            applyActiveSuggestion();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (activeIndex >= 0 && activeIndex < currentSuggestions.length) {
                selectSuggestion(currentSuggestions[activeIndex]);
            } else if (currentSuggestions.length > 0) {
                selectSuggestion(currentSuggestions[0]);
            }
        } else if (event.key === 'Escape') {
            clearSuggestions();
        }
    });
    
    input.addEventListener('blur', () => {
        blurTimeout = setTimeout(() => {
            clearSuggestions();
        }, 150);
    });
    
    suggestionsContainer.addEventListener('mousedown', () => {
        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }
    });
}

function setupProfileViewerModal() {
    const modal = document.getElementById('profileViewerModal');
    const closeBtn = document.getElementById('closeProfileViewer');
    if (!modal) return;
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function openProfileViewer(username) {
    if (!accounts[username]) {
        alert('That player does not exist.');
        return;
    }
    const modal = document.getElementById('profileViewerModal');
    if (!modal) return;
    
    const profile = loadProfileDataForUser(username);
    const caughtMap = loadCaughtTowersForUser(username);
    
    const title = document.getElementById('profileViewerTitle');
    const usernameElement = document.getElementById('profileViewerUsername');
    const rankElement = document.getElementById('profileViewerRank');
    const playtimeElement = document.getElementById('profileViewerPlaytime');
    const hardestElement = document.getElementById('profileViewerHardestDifficulty');
    const uniqueElement = document.getElementById('profileViewerUniqueCount');
    const totalElement = document.getElementById('profileViewerTotalCount');
    const favoriteElement = document.getElementById('profileViewerFavorite');
    const leastFavoriteElement = document.getElementById('profileViewerLeastFavorite');
    const quoteElement = document.getElementById('profileViewerQuote');

    if (title) {
        title.textContent = `${username}'s Profile`;
    }
    if (usernameElement) {
        usernameElement.textContent = profile.username || username;
    }
    updateRankBadge(rankElement, username);
    if (playtimeElement) {
        playtimeElement.textContent = formatPlaytime(profile.playtimeSeconds || 0);
    }
    if (hardestElement) {
        hardestElement.textContent = getHardestDifficultyCaught(caughtMap);
    }
    if (uniqueElement) {
        uniqueElement.textContent = getUniqueTowersCaught(caughtMap);
    }
    if (totalElement) {
        totalElement.textContent = getTotalTowerCatchCount(caughtMap);
    }
    if (favoriteElement) {
        favoriteElement.textContent = profile.favoriteTower || 'None';
    }
    if (leastFavoriteElement) {
        leastFavoriteElement.textContent = profile.leastFavoriteTower || 'None';
    }
    if (quoteElement) {
        const quote = profile.quote && profile.quote.trim() ? profile.quote : 'No quote yet.';
        quoteElement.textContent = quote;
    }
    
    modal.style.display = 'block';
}

function setupProfilePasswordControls() {
    const changeBtn = document.getElementById('profilePasswordChangeBtn');
    const form = document.getElementById('profilePasswordForm');
    const passwordInput = document.getElementById('profilePasswordInput');
    const confirmInput = document.getElementById('profilePasswordConfirmInput');
    const submitBtn = document.getElementById('profilePasswordSubmitBtn');
    const cancelBtn = document.getElementById('profilePasswordCancelBtn');
    
    if (!changeBtn || !form || !passwordInput || !confirmInput || !submitBtn || !cancelBtn) {
        return;
    }
    
    const hideForm = () => {
        form.style.display = 'none';
        passwordInput.value = '';
        confirmInput.value = '';
    };
    
    changeBtn.addEventListener('click', () => {
        if (!currentUsername) {
            showAuthOverlay('login');
            return;
        }
        if (profileData.username !== currentUsername) {
            alert('Only the account owner can change this password.');
            return;
        }
        form.style.display = 'flex';
        passwordInput.value = '';
        confirmInput.value = '';
        passwordInput.focus();
    });
    
    cancelBtn.addEventListener('click', (event) => {
        event.preventDefault();
        hideForm();
    });
    
    submitBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (!currentUsername) {
            showAuthOverlay('login');
            return;
        }
        if (profileData.username !== currentUsername) {
            alert('Only the account owner can change this password.');
            hideForm();
            return;
        }
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;
        if (password.length < 4) {
            alert('Password must be at least 4 characters.');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        const account = accounts[currentUsername];
        if (account) {
            account.passwordHash = hashPassword(password);
            account.updatedAt = Date.now();
            saveAccounts();
            alert('Password updated successfully.');
            hideForm();
        }
    });

    hideForm();
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', () => {
        if (!currentUsername) {
            showAuthOverlay('login');
            return;
        }
        teardownActiveSession();
        setCurrentUser(null);
        profileData = { ...profileDefaults };
        updateProfileStatsDisplay();
        caughtTowers = new Map();
        badges = new Set();
        gems = 0;
        updateGemDisplay();
        updateCollection();
        updateBadgesDisplay();
        showAuthOverlay('login');
    });
}

function setupTutorialModal() {
    const tutorialBtn = document.getElementById('tutorialBtn');
    const tutorialModal = document.getElementById('tutorialModal');
    const closeTutorialModal = document.getElementById('closeTutorialModal');
    
    if (!tutorialBtn || !tutorialModal) {
        return;
    }
    
    tutorialBtn.addEventListener('click', () => {
        tutorialModal.style.display = 'block';
    });
    
    if (closeTutorialModal) {
        closeTutorialModal.addEventListener('click', () => {
            tutorialModal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (event) => {
        if (event.target === tutorialModal) {
            tutorialModal.style.display = 'none';
        }
    });
}

function formatRankListDisplay(list) {
    if (!Array.isArray(list) || list.length === 0) {
        return 'None';
    }
    return list.join(', ');
}

function getRankLabelByKey(key) {
    return rankConfig.labels?.[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function getRankKeyForUsername(username) {
    if (!username) return 'player';
    const normalized = normalizeUsernameValue(username);
    if (!normalized) return 'player';
    
    const inOwner = rankConfig.ownerUsers.some(name => normalizeUsernameValue(name) === normalized);
    if (inOwner) return 'owner';
    
    const inCoOwner = rankConfig.coOwnerUsers.some(name => normalizeUsernameValue(name) === normalized);
    if (inCoOwner) return 'coOwner';
    
    const inTester = rankConfig.testerUsers.some(name => normalizeUsernameValue(name) === normalized);
    if (inTester) return 'tester';
    
    return 'player';
}

function getRankLabelForUsername(username) {
    const key = getRankKeyForUsername(username);
    if (key === 'player') {
        return rankConfig.labels.player;
    }
    if (key === 'owner') {
        return rankConfig.labels.owner;
    }
    if (key === 'coOwner') {
        return rankConfig.labels.coOwner;
    }
    if (key === 'tester') {
        return rankConfig.labels.tester;
    }
    return rankConfig.labels.player;
}

function updateRankMembershipForUsernameChange(oldUsername, newUsername) {
    if (!oldUsername || !newUsername) return;
    const normalizedOld = normalizeUsernameValue(oldUsername);
    const lists = ['ownerUsers', 'coOwnerUsers', 'testerUsers'];
    let changed = false;
    lists.forEach(key => {
        const arr = rankConfig[key];
        const index = arr.findIndex(name => normalizeUsernameValue(name) === normalizedOld);
        if (index !== -1) {
            arr[index] = newUsername.trim();
            changed = true;
        }
    });
    if (changed) {
        rankConfig.ownerUsers = dedupeUserList(rankConfig.ownerUsers);
        rankConfig.coOwnerUsers = dedupeUserList(rankConfig.coOwnerUsers);
        rankConfig.testerUsers = dedupeUserList(rankConfig.testerUsers);
        updateProfileStatsDisplay();
    }
}

// Load caught towers from localStorage
function loadCaughtTowersForUser(username) {
    const key = accountStorageKey('caughtTowers', username);
    let map = new Map();
    if (!key) {
        return map;
    }
    const stored = localStorage.getItem(key) || localStorage.getItem('caughtTowers');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (Array.isArray(data)) {
                map = new Map();
                data.forEach(towerName => {
                    const trimmed = typeof towerName === 'string' ? towerName.trim() : '';
                    if (!trimmed) return;
                    map.set(trimmed, (map.get(trimmed) || 0) + 1);
                });
            } else if (data && typeof data === 'object') {
                map = new Map(
                    Object.entries(data).map(([name, count]) => [name, parseInt(count, 10) || 0])
                );
            }
        } catch (error) {
            console.warn('Failed to parse caught towers for', username, error);
        }
    }
    return map;
}

function loadCaughtTowers() {
    caughtTowers = loadCaughtTowersForUser(currentUsername);
}

function saveCaughtTowers() {
    const key = accountStorageKey('caughtTowers');
    if (!key) return;
    const obj = Object.fromEntries(caughtTowers);
    localStorage.setItem(key, JSON.stringify(obj));
}

function loadBadgesForUser(username) {
    const key = accountStorageKey('badges', username);
    if (!key) return new Set();
    const stored = localStorage.getItem(key) || localStorage.getItem('badges');
    if (stored) {
        try {
            return new Set(JSON.parse(stored));
        } catch (error) {
            console.warn('Failed to parse badges for', username, error);
        }
    }
    return new Set();
}

// Load badges from localStorage
function loadBadges() {
    badges = loadBadgesForUser(currentUsername);
}

// Save badges to localStorage
function saveBadges() {
    const key = accountStorageKey('badges');
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(Array.from(badges)));
}

function loadGemsForUser(username) {
    const key = accountStorageKey('gems', username);
    if (!key) return 0;
    try {
        const savedGems = localStorage.getItem(key) || localStorage.getItem('gems');
        if (savedGems !== null) {
            return parseInt(savedGems, 10) || 0;
        }
    } catch (error) {
        console.error('Error loading gems for', username, error);
    }
    return 0;
}

// Load gems from localStorage
function loadGems() {
    gems = loadGemsForUser(currentUsername);
    updateGemDisplay();
}

// Save gems to localStorage
function saveGems() {
    const key = accountStorageKey('gems');
    if (!key) return;
    try {
        localStorage.setItem(key, gems.toString());
        updateGemDisplay();
    } catch (e) {
        console.error('Error saving gems:', e);
    }
}

// Update gem display
function updateGemDisplay() {
    const gemDisplay = document.getElementById('gemDisplay');
    if (gemDisplay) {
        gemDisplay.textContent = `💎 ${gems}`;
    }
}

function loadProfileDataForUser(username) {
    const key = accountStorageKey('profileData', username);
    let data = { ...profileDefaults };
    if (!key) {
        return data;
    }
    try {
        const stored = localStorage.getItem(key) || localStorage.getItem('profileData');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                data = {
                    ...profileDefaults,
                    ...parsed
                };
            }
        }
    } catch (error) {
        console.warn('Failed to load profile data for', username, error);
    }
    if (!data.username) {
        data.username = username || '';
    }
    return data;
}

function loadProfileData() {
    profileData = loadProfileDataForUser(currentUsername);
    if (!profileData.username) {
        profileData.username = currentUsername || generateDefaultUsername();
        saveProfileData();
    } else {
        registerUsername(profileData.username);
    }
}

function saveProfileData() {
    const key = accountStorageKey('profileData');
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(profileData));
}

function formatPlaytime(seconds) {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (value) => value.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

function updateProfilePlaytimeDisplay() {
    const playtimeElement = document.getElementById('profilePlaytime');
    if (!playtimeElement) return;
    playtimeElement.textContent = formatPlaytime(profileData.playtimeSeconds);
}

function startPlaytimeTracking() {
    if (playtimeInterval) {
        clearInterval(playtimeInterval);
    }
    lastPlaytimeTimestamp = Date.now();
    playtimeInterval = setInterval(() => {
        const now = Date.now();
        if (lastPlaytimeTimestamp) {
            const elapsed = Math.floor((now - lastPlaytimeTimestamp) / 1000);
            if (elapsed > 0) {
                profileData.playtimeSeconds += elapsed;
                incrementGlobalPlaytime(elapsed);
                lastPlaytimeTimestamp = now;
                updateProfilePlaytimeDisplay();
                saveProfileData();
                if (isPrivilegedRank(profileData.username)) {
                    updateProfileStatsDisplay();
                }
            }
        } else {
            lastPlaytimeTimestamp = now;
        }
    }, 1000);
}

function stopPlaytimeTracking() {
    if (playtimeInterval) {
        clearInterval(playtimeInterval);
        playtimeInterval = null;
    }
    if (lastPlaytimeTimestamp) {
        const elapsed = Math.floor((Date.now() - lastPlaytimeTimestamp) / 1000);
        if (elapsed > 0) {
            profileData.playtimeSeconds += elapsed;
            incrementGlobalPlaytime(elapsed);
        }
    }
    lastPlaytimeTimestamp = null;
    updateProfilePlaytimeDisplay();
    saveProfileData();
    if (isPrivilegedRank(profileData.username)) {
        updateProfileStatsDisplay();
    }
}

function getTotalTowerCatchCount(targetMap = caughtTowers) {
    let total = 0;
    targetMap.forEach(count => {
        total += parseInt(count, 10) || 0;
    });
    return total;
}

function getHardestDifficultyCaught(targetMap = caughtTowers) {
    for (let i = difficultyOrder.length - 1; i >= 0; i--) {
        const difficulty = difficultyOrder[i];
        const towers = towerData[difficulty] || [];
        for (const towerName of towers) {
            const trimmed = towerName.trim();
            if (!trimmed) continue;
            const count = targetMap.get(trimmed);
            if ((parseInt(count, 10) || 0) > 0) {
                return difficultyDisplayNames[difficulty] || difficulty;
            }
        }
    }
    return 'None';
}

function updateRankBadge(element, username) {
    if (!element) return;
    const rankKey = getRankKeyForUsername(username);
    element.textContent = getRankLabelForUsername(username);
    element.classList.remove('rank-player', 'rank-owner', 'rank-co-owner', 'rank-tester');
    const className = rankClassMap[rankKey] || rankClassMap.player;
    element.classList.add(className);
}

function updateProfileStatsDisplay() {
    const usernameDisplay = document.getElementById('profileUsernameDisplay');
    const usernameButton = document.getElementById('profileUsernameButton');
    const usernameInput = document.getElementById('profileUsernameInput');
    const rankDisplay = document.getElementById('profileRankDisplay');
    const uniqueCountElement = document.getElementById('profileUniqueCount');
    const totalCountElement = document.getElementById('profileTotalCount');
    const hardestDifficultyElement = document.getElementById('profileHardestDifficulty');
    const favoriteDisplay = document.getElementById('profileFavoriteDisplay');
    const favoriteButton = document.getElementById('profileFavoriteButton');
    const favoriteInput = document.getElementById('profileFavoriteInput');
    const leastFavoriteDisplay = document.getElementById('profileLeastFavoriteDisplay');
    const leastFavoriteButton = document.getElementById('profileLeastFavoriteButton');
    const leastFavoriteInput = document.getElementById('profileLeastFavoriteInput');
    const quoteDisplay = document.getElementById('profileQuoteDisplay');
    const quoteButton = document.getElementById('profileQuoteButton');
    const quoteInput = document.getElementById('profileQuoteInput');
    const ownerListDisplay = document.getElementById('profileOwnerListDisplay');
    const coOwnerListDisplay = document.getElementById('profileCoOwnerListDisplay');
    const testerListDisplay = document.getElementById('profileTesterListDisplay');

    const isEditing = (el) => !!(el && el.dataset && el.dataset.editing === 'true');

    if (usernameDisplay && !isEditing(usernameButton)) {
        usernameDisplay.textContent = profileData.username || 'Unknown';
    }
    if (usernameInput && !isEditing(usernameInput)) {
        usernameInput.value = profileData.username || '';
    }
    updateRankBadge(rankDisplay, profileData.username);
    if (uniqueCountElement) {
        uniqueCountElement.textContent = getUniqueTowersCaught();
    }
    if (totalCountElement) {
        totalCountElement.textContent = getTotalTowerCatchCount();
    }
    if (hardestDifficultyElement) {
        hardestDifficultyElement.textContent = getHardestDifficultyCaught();
    }
    if (favoriteDisplay && !isEditing(favoriteButton)) {
        favoriteDisplay.textContent = profileData.favoriteTower || 'None';
    }
    if (favoriteInput && !isEditing(favoriteInput)) {
        favoriteInput.value = profileData.favoriteTower || '';
    }
    if (leastFavoriteDisplay && !isEditing(leastFavoriteButton)) {
        leastFavoriteDisplay.textContent = profileData.leastFavoriteTower || 'None';
    }
    if (leastFavoriteInput && !isEditing(leastFavoriteInput)) {
        leastFavoriteInput.value = profileData.leastFavoriteTower || '';
    }
    if (quoteDisplay && !isEditing(quoteButton)) {
        const quote = profileData.quote && profileData.quote.trim() ? profileData.quote : 'No quote yet.';
        quoteDisplay.textContent = quote;
    }
    if (quoteInput && !isEditing(quoteInput)) {
        quoteInput.value = profileData.quote || '';
    }
    if (ownerListDisplay) {
        ownerListDisplay.textContent = formatRankListDisplay(rankConfig.ownerUsers);
    }
    if (coOwnerListDisplay) {
        coOwnerListDisplay.textContent = formatRankListDisplay(rankConfig.coOwnerUsers);
    }
    if (testerListDisplay) {
        testerListDisplay.textContent = formatRankListDisplay(rankConfig.testerUsers);
    }
    updateProfilePlaytimeDisplay();
    const totalPlayersRow = document.getElementById('profileTotalPlayersRow');
    const totalPlayersValue = document.getElementById('profileTotalPlayers');
    const totalPlaytimeRow = document.getElementById('profileTotalPlaytimeRow');
    const totalPlaytimeValue = document.getElementById('profileTotalPlaytime');
    const totalTowersRow = document.getElementById('profileTotalTowersRow');
    const totalTowersValue = document.getElementById('profileTotalTowers');

    const privileged = isPrivilegedRank(profileData.username);
    if (totalPlayersRow) {
        totalPlayersRow.style.display = privileged ? 'flex' : 'none';
    }
    if (totalPlaytimeRow) {
        totalPlaytimeRow.style.display = privileged ? 'flex' : 'none';
    }
    if (totalTowersRow) {
        totalTowersRow.style.display = privileged ? 'flex' : 'none';
    }
    if (privileged) {
        if (totalPlayersValue) {
            totalPlayersValue.textContent = Object.keys(accounts || {}).length.toString();
        }
        if (totalPlaytimeValue) {
            totalPlaytimeValue.textContent = formatPlaytime(globalStats.totalPlaytimeSeconds || 0);
        }
        if (totalTowersValue) {
            totalTowersValue.textContent = (globalStats.totalTowerCatches || 0).toLocaleString();
        }
    }
}

function setupProfileEditableField({ button, input, display, getValue, onSave, validate, skipProfileSave = false, afterSave }) {
    if (!button || !input || !display) {
        return;
    }
    
    let isEditing = false;
    const isTextArea = input.tagName === 'TEXTAREA';
    
    const setEditingFlag = (value) => {
        isEditing = value;
        const flag = value ? 'true' : 'false';
        button.setAttribute('data-editing', flag);
        input.setAttribute('data-editing', flag);
    };
    
    const enterEditMode = () => {
        const currentValue = typeof getValue === 'function' ? getValue() : '';
        if (currentValue !== undefined && currentValue !== null) {
            input.value = currentValue;
        }
        setEditingFlag(true);
        button.setAttribute('data-state', 'submit');
        button.textContent = 'Submit';
        display.style.display = 'none';
        input.style.display = isTextArea ? 'block' : 'inline-block';
        input.focus();
        if (!isTextArea) {
            input.select();
        }
    };
    
    const exitEditMode = () => {
        setEditingFlag(false);
        button.setAttribute('data-state', 'view');
        button.textContent = 'Change';
        display.style.display = '';
        input.style.display = 'none';
    };
    
    const handleSubmit = () => {
        const rawValue = input.value;
        const validationResult = typeof validate === 'function'
            ? validate(rawValue)
            : { valid: true, value: rawValue };
        
        if (!validationResult || validationResult.valid === false) {
            if (validationResult && validationResult.message) {
                alert(validationResult.message);
            }
            return;
        }
        
        const valueToSave = (validationResult && validationResult.value !== undefined)
            ? validationResult.value
            : rawValue;
        
        if (typeof onSave === 'function') {
            onSave(valueToSave);
        }
        
        exitEditMode();
        updateProfileStatsDisplay();
        if (!skipProfileSave) {
            saveProfileData();
        }
        if (typeof afterSave === 'function') {
            afterSave();
        }
    };
    
    button.addEventListener('click', () => {
        const state = button.getAttribute('data-state') || 'view';
        if (state === 'view') {
            enterEditMode();
        } else {
            handleSubmit();
        }
    });
    
    if (!isTextArea) {
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSubmit();
            }
        });
    }
    
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            exitEditMode();
            updateProfileStatsDisplay();
        }
    });
}

function resetProfileProgress({ keepUsername = true, keepFavorites = true, keepQuote = true } = {}) {
    const preserved = {
        username: profileData.username,
        favoriteTower: profileData.favoriteTower,
        leastFavoriteTower: profileData.leastFavoriteTower,
        quote: profileData.quote
    };

    profileData = { ...profileDefaults };
    profileData.playtimeSeconds = 0;

    if (keepUsername && preserved.username) {
        profileData.username = preserved.username;
        registerUsername(profileData.username);
    } else {
        profileData.username = generateDefaultUsername();
        if (preserved.username) {
            const renamed = renameAccount(preserved.username, profileData.username);
            if (!renamed) {
                updateRegisteredUsername(preserved.username, profileData.username);
            }
        } else {
            registerUsername(profileData.username);
        }
    }

    if (keepFavorites) {
        profileData.favoriteTower = preserved.favoriteTower || '';
        profileData.leastFavoriteTower = preserved.leastFavoriteTower || '';
    }

    if (keepQuote) {
        profileData.quote = preserved.quote || '';
    }

    saveProfileData();
    updateProfileStatsDisplay();
}


// Get gem reward for difficulty
function getGemReward(difficulty) {
    const rewards = {
        'effortless': 1,
        'easy': 2,
        'medium': 3,
        'hard': 5,
        'difficult': 10,
        'challenging': 15,
        'intense': 25,
        'remorseless': 35,
        'insane': 50,
        'extreme': 75,
        'terrifying': 100,
        'catastrophic': 150,
        'horrific': 200,
        'unreal': 250,
        'nil': 300,
        'error': 350,
        'toohard': 400
    };
    return rewards[difficulty] || 0;
}

// Get spawn cost for difficulty
function getSpawnCost(difficulty) {
    const costs = {
        'effortless': 5,
        'easy': 10,
        'medium': 20,
        'hard': 35,
        'difficult': 60,
        'challenging': 100,
        'intense': 150,
        'remorseless': 200,
        'insane': 250,
        'extreme': 325,
        'terrifying': 400,
        'catastrophic': 500,
        'horrific': 700,
        'unreal': 900,
        'nil': 1000,
        'error': 1111,
        'toohard': 1234
    };
    return costs[difficulty] || 0;
}

// Get badge description
function getBadgeDescription(badgeId) {
    // Difficulty badges
    const difficultyDescriptions = {
        'effortless': 'Catch your first Effortless tower',
        'easy': 'Catch your first Easy tower',
        'medium': 'Catch your first Medium tower',
        'hard': 'Catch your first Hard tower',
        'difficult': 'Catch your first Difficult tower',
        'challenging': 'Catch your first Challenging tower',
        'intense': 'Catch your first Intense tower',
        'remorseless': 'Catch your first Remorseless tower',
        'insane': 'Catch your first Insane tower',
        'extreme': 'Catch your first Extreme tower',
        'terrifying': 'Catch your first Terrifying tower',
        'catastrophic': 'Catch your first Catastrophic tower',
        'horrific': 'Catch your first Horrific tower',
        'unreal': 'Catch your first Unreal tower',
        'nil': 'Catch your first nil tower',
        'error': 'Catch your first eRRoR tower',
        'toohard': 'Catch your first TooHard tower'
    };
    
    if (difficultyDescriptions[badgeId]) {
        return difficultyDescriptions[badgeId];
    }
    
    // New badges
    const newBadgeDescriptions = {
        'firsttower': 'Catch your first tower',
        'towercount_3': 'Catch 3 unique towers',
        'towercount_5': 'Catch 5 unique towers',
        'towercount_10': 'Catch 10 unique towers',
        'towercount_25': 'Catch 25 unique towers',
        'towercount_50': 'Catch 50 unique towers',
        'towercount_75': 'Catch 75 unique towers',
        'towercount_100': 'Catch 100 unique towers',
        'towercount_150': 'Catch 150 unique towers',
        'towercount_200': 'Catch 200 unique towers',
        'towercount_300': 'Catch 300 unique towers',
        'towercount_400': 'Catch 400 unique towers',
        'towercount_500': 'Catch 500 unique towers',
        'towercount_600': 'Catch 600 unique towers',
        'towercount_700': 'Catch 700 unique towers',
        'towercount_800': 'Catch 800 unique towers',
        'mastery': 'Catch every single tower in-game',
        'perfection': 'Catch every single tower 3 times each'
    };
    
    return newBadgeDescriptions[badgeId] || `Badge: ${badgeId}`;
}

// Get all tower count milestones
function getTowerCountMilestones() {
    return [3, 5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 600, 700, 800];
}

// Get total number of unique towers caught
function getUniqueTowersCaught(targetMap = caughtTowers) {
    let unique = 0;
    targetMap.forEach(count => {
        if ((parseInt(count, 10) || 0) > 0) {
            unique++;
        }
    });
    return unique;
}

// Get total number of towers in the game
function getTotalTowersInGame() {
    return towerData.effortless.length + towerData.easy.length + towerData.medium.length + 
           towerData.hard.length + towerData.difficult.length + towerData.challenging.length + 
           towerData.intense.length + towerData.remorseless.length + towerData.insane.length + 
           towerData.extreme.length + towerData.terrifying.length + towerData.catastrophic.length + 
           towerData.horrific.length + towerData.unreal.length + towerData.nil.length + 
           towerData.error.length + towerData.toohard.length;
}

// Check for First Tower badge
function checkFirstTowerBadge() {
    const badgeId = 'firsttower';
    if (!badges.has(badgeId) && getUniqueTowersCaught() === 1) {
        badges.add(badgeId);
        saveBadges();
        updateBadgesDisplay();
        return true;
    }
    return false;
}

// Check for tower count badges
function checkTowerCountBadges() {
    const uniqueCount = getUniqueTowersCaught();
    const milestones = getTowerCountMilestones();
    const newlyUnlocked = [];
    
    milestones.forEach(milestone => {
        const badgeId = `towercount_${milestone}`;
        if (!badges.has(badgeId) && uniqueCount >= milestone) {
            badges.add(badgeId);
            newlyUnlocked.push(milestone);
        }
    });
    
    if (newlyUnlocked.length > 0) {
        saveBadges();
        updateBadgesDisplay();
        // Return array of newly unlocked milestones for notification
        return newlyUnlocked;
    }
    return [];
}

// Check for Mastery badge
function checkMasteryBadge() {
    const badgeId = 'mastery';
    const uniqueCount = getUniqueTowersCaught();
    const totalTowers = getTotalTowersInGame();
    
    if (!badges.has(badgeId) && uniqueCount >= totalTowers && totalTowers > 0) {
        badges.add(badgeId);
        saveBadges();
        updateBadgesDisplay();
        return true;
    }
    return false;
}

// Check for Perfection badge (all towers caught 3+ times each)
function checkPerfectionBadge() {
    const badgeId = 'perfection';
    const totalTowers = getTotalTowersInGame();
    
    if (totalTowers === 0) return false;
    
    // Check if all towers have been caught at least 3 times
    const allTowers = [
        ...towerData.effortless,
        ...towerData.easy,
        ...towerData.medium,
        ...towerData.hard,
        ...towerData.difficult,
        ...towerData.challenging,
        ...towerData.intense,
        ...towerData.remorseless,
        ...towerData.insane,
        ...towerData.extreme,
        ...towerData.terrifying,
        ...towerData.catastrophic,
        ...towerData.horrific,
        ...towerData.unreal,
        ...towerData.nil,
        ...towerData.error,
        ...towerData.toohard
    ];
    
    // Check if all towers have been caught at least 3 times
    const allCaughtThreeTimes = allTowers.every(towerName => {
        const trimmedName = towerName.trim();
        const count = caughtTowers.get(trimmedName) || 0;
        return count >= 3;
    });
    
    if (!badges.has(badgeId) && allCaughtThreeTimes) {
        badges.add(badgeId);
        saveBadges();
        updateBadgesDisplay();
        return true;
    }
    return false;
}

// Check and unlock badge for difficulty
function checkBadge(difficulty) {
    if (!badges.has(difficulty)) {
        badges.add(difficulty);
        saveBadges();
        updateBadgesDisplay();
        return true; // New badge unlocked
    }
    return false; // Badge already exists
}

// Update badges display (no longer needed - badges are in menu only)
function updateBadgesDisplay() {
    // Badges are now only shown in the Badges menu, no corner display needed
}

// Update badge collection modal (full view)
function updateBadgeCollection() {
    const badgeCollectionGrid = document.getElementById('badgeCollectionGrid');
    badgeCollectionGrid.innerHTML = '';
    
    // All badge IDs in display order
    const allBadges = [
        // Difficulty badges
        'effortless', 'easy', 'medium', 'hard', 'difficult', 'challenging', 
        'intense', 'remorseless', 'insane', 'extreme', 'terrifying', 
        'catastrophic', 'horrific', 'unreal', 'nil', 'error', 'toohard',
        // New badges
        'firsttower',
        'towercount_3', 'towercount_5', 'towercount_10', 'towercount_25', 'towercount_50', 
        'towercount_75', 'towercount_100', 'towercount_150', 'towercount_200', 'towercount_300', 
        'towercount_400', 'towercount_500', 'towercount_600', 'towercount_700', 'towercount_800',
        'mastery',
        'perfection'
    ];
    
    allBadges.forEach(badgeId => {
        const badgeItem = document.createElement('div');
        badgeItem.className = 'badge-item';
        
        // Get display name for badge
        let badgeName;
        if (badgeId === 'error') {
            badgeName = 'eRRoR';
        } else if (badgeId === 'toohard') {
            badgeName = 'TooHard';
        } else if (badgeId === 'firsttower') {
            badgeName = 'First Tower';
        } else if (badgeId === 'mastery') {
            badgeName = 'Mastery';
        } else if (badgeId === 'perfection') {
            badgeName = 'Perfection';
        } else if (badgeId.startsWith('towercount_')) {
            const count = badgeId.split('_')[1];
            badgeName = `${count} Towers`;
        } else {
            badgeName = badgeId.charAt(0).toUpperCase() + badgeId.slice(1);
        }
        
        if (badges.has(badgeId)) {
            // Badge unlocked - show image
            badgeItem.classList.add('unlocked');
            const badgeImg = document.createElement('img');
            badgeImg.className = 'badge-image';
            badgeImg.alt = badgeName;
            
            const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
            let imageFound = false;
            
            function tryBadgeImage(index) {
                if (index >= extensions.length) {
                    // No image found, show text placeholder
                    if (!imageFound) {
                        const badgeText = document.createElement('div');
                        badgeText.className = 'badge-text';
                        badgeText.textContent = badgeName;
                        badgeItem.appendChild(badgeText);
                    }
                    const badgeLabel = document.createElement('div');
                    badgeLabel.className = 'badge-label';
                    badgeLabel.textContent = badgeName;
                    badgeItem.appendChild(badgeLabel);
                    
                    // Add description
                    const badgeDesc = document.createElement('div');
                    badgeDesc.className = 'badge-description';
                    badgeDesc.textContent = getBadgeDescription(badgeId);
                    badgeItem.appendChild(badgeDesc);
                    
                    badgeCollectionGrid.appendChild(badgeItem);
                    return;
                }
                
                const imagePath = badgeName + extensions[index];
                badgeImg.src = imagePath;
                badgeImg.onload = () => {
                    imageFound = true;
                    badgeItem.insertBefore(badgeImg, badgeItem.firstChild);
                    const badgeLabel = document.createElement('div');
                    badgeLabel.className = 'badge-label';
                    badgeLabel.textContent = badgeName;
                    badgeItem.appendChild(badgeLabel);
                    
                    // Add description
                    const badgeDesc = document.createElement('div');
                    badgeDesc.className = 'badge-description';
                    badgeDesc.textContent = getBadgeDescription(badgeId);
                    badgeItem.appendChild(badgeDesc);
                    
                    if (badgeItem.parentNode !== badgeCollectionGrid) {
                        badgeCollectionGrid.appendChild(badgeItem);
                    }
                };
                badgeImg.onerror = () => {
                    tryBadgeImage(index + 1);
                };
            }
            
            tryBadgeImage(0);
        } else {
            // Badge locked - show placeholder
            badgeItem.classList.add('locked');
            const lockedIcon = document.createElement('div');
            lockedIcon.className = 'badge-locked';
            lockedIcon.textContent = '?';
            badgeItem.appendChild(lockedIcon);
            
            const badgeLabel = document.createElement('div');
            badgeLabel.className = 'badge-label';
            badgeLabel.textContent = badgeName;
            badgeItem.appendChild(badgeLabel);
            
            // Add description
            const badgeDesc = document.createElement('div');
            badgeDesc.className = 'badge-description';
            badgeDesc.textContent = getBadgeDescription(badgeId);
            badgeItem.appendChild(badgeDesc);
            
            badgeCollectionGrid.appendChild(badgeItem);
        }
    });
}

// Music system functions
function playMusic(filename) {
    const musicElement = document.getElementById('gameMusic');
    if (!musicElement) {
        return;
    }

    const currentTrack = musicElement.dataset ? musicElement.dataset.currentTrack : musicElement.getAttribute('data-current-track');
    if (currentTrack === filename && !musicElement.paused) {
        return;
    }

    musicElement.src = filename;
    if (musicElement.dataset) {
        musicElement.dataset.currentTrack = filename;
    } else {
        musicElement.setAttribute('data-current-track', filename);
    }

    pendingMusicTrack = filename;
    musicElement.load();

    const attemptPlay = () => {
        musicElement.play().then(() => {
            pendingMusicTrack = null;
            cleanupMusicResumeHandler();
        }).catch(() => {
            if (musicResumeHandler) {
                return;
            }
            musicResumeHandler = () => {
                if (pendingMusicTrack !== filename) {
                    cleanupMusicResumeHandler();
                    return;
                }
                musicElement.play().then(() => {
                    pendingMusicTrack = null;
                    cleanupMusicResumeHandler();
                }).catch(() => {
                    // keep handlers for another user interaction
                });
            };
            document.addEventListener('click', musicResumeHandler);
            document.addEventListener('keydown', musicResumeHandler);
        });
    };

    attemptPlay();
}

function stopMusic() {
    const musicElement = document.getElementById('gameMusic');
    if (!musicElement) return;
    musicElement.pause();
    musicElement.src = '';
    pendingMusicTrack = null;
    cleanupMusicResumeHandler();
    if (musicElement.dataset) {
        musicElement.dataset.currentTrack = '';
    } else {
        musicElement.setAttribute('data-current-track', '');
    }
}

// Reset all progress
function resetAllProgress() {
    if (!currentUsername) {
        return;
    }
    caughtTowers.clear();
    badges.clear();
    gems = 0;
    localStorage.removeItem('caughtTowers');
    localStorage.removeItem('badges');
    localStorage.removeItem('activeTower');
    localStorage.removeItem('gems');
    saveCaughtTowers();
    saveBadges();
    saveGems();
    updateCollection();
    updateBadgesDisplay();
    updateGemDisplay();
    
    // Reset game state
    if (currentTimer) {
        clearInterval(currentTimer);
        currentTimer = null;
    }
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    currentTower = null;
    currentDifficulty = null;
    isIntentionallySpawned = false;
    towerStartTime = null;
    
    // Reset UI
    const towerInput = document.getElementById('towerInput');
    const submitBtn = document.getElementById('submitBtn');
    const timerZone = document.getElementById('timerZone');
    const towerImage = document.getElementById('towerImage');

    if (towerInput) {
        towerInput.value = '';
        towerInput.disabled = true;
    }
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    if (timerZone) {
        timerZone.textContent = '--';
        timerZone.style.cursor = 'default';
        timerZone.title = '';
        timerZone.onclick = null;
    }
    if (towerImage) {
        towerImage.style.display = 'none';
        towerImage.src = '';
    }
    clearGameMessage();

    resetBackground();
    clearTowerOutline();
    
    stopPlaytimeTracking();
    resetProfileProgress({
        keepUsername: true,
        keepFavorites: true,
        keepQuote: true
    });
    startPlaytimeTracking();
    
    // Restart game
    startGame();
}

// Save current active tower state (only updates startTime on first call, preserves it otherwise)
function saveActiveTower() {
    if (currentTower && currentDifficulty) {
        // Only set startTime if not already set (first save)
        if (!towerStartTime) {
            towerStartTime = Date.now();
        }
        const state = {
            tower: currentTower,
            difficulty: currentDifficulty,
            startTime: towerStartTime,
            timerStarted: true
        };
        const key = accountStorageKey('activeTower');
        if (key) {
            localStorage.setItem(key, JSON.stringify(state));
        }
    }
}

// Clear active tower state
function clearActiveTower() {
    const key = accountStorageKey('activeTower');
    if (key) {
        localStorage.removeItem(key);
    }
    towerStartTime = null; // Reset start time
}

// Load and restore active tower if it exists
function restoreActiveTower() {
    const key = accountStorageKey('activeTower');
    const saved = key ? localStorage.getItem(key) : null;
    if (!saved) return false;
    
    try {
        const state = JSON.parse(saved);
        const elapsed = (Date.now() - state.startTime) / 1000; // seconds
        
        // If more than 60 seconds have passed, tower is expired
        if (elapsed >= 60) {
            clearActiveTower();
            return false;
        }
        
        // Restore the tower
        currentTower = state.tower;
        currentDifficulty = state.difficulty;
        towerStartTime = state.startTime; // Restore the original start time
        
        const timerZone = document.getElementById('timerZone');
        const towerInput = document.getElementById('towerInput');
        const submitBtn = document.getElementById('submitBtn');
        const towerImage = document.getElementById('towerImage');

        // Apply background
        applyDifficultyBackground(currentDifficulty);
        
        // Play appropriate music based on difficulty
        if (currentDifficulty === 'insane' || currentDifficulty === 'extreme' || 
            currentDifficulty === 'terrifying' || currentDifficulty === 'catastrophic') {
            playMusic('Point.mp3');
        } else if (currentDifficulty === 'horrific' || currentDifficulty === 'unreal' || 
                   currentDifficulty === 'nil' || currentDifficulty === 'error') {
            playMusic('Quality Control.mp3');
        } else {
            playMusic('Default.mp3');
        }
        
        // Load and display tower image
        loadTowerImage(currentTower, towerImage);
        
        // Apply difficulty outline to tower image
        applyTowerOutline(currentDifficulty);
        
        // Check if tower has been caught 3+ times - if so, allow immediate skip
        const trimmedTower = currentTower.trim();
        const catchCount = caughtTowers.get(trimmedTower) || 0;
        
        // Make timer zone clickable to skip if caught 3+ times (immediate skip)
        // Otherwise, skip will be enabled after 10 seconds in the timer function
        if (catchCount >= 3) {
            timerZone.style.cursor = 'pointer';
            timerZone.title = 'Click to skip (caught 3+ times)';
            timerZone.onclick = () => {
                skipTower();
            };
        } else {
            timerZone.style.cursor = 'default';
            timerZone.title = 'Skip available after 10 seconds';
            timerZone.onclick = null;
        }
        
        // Enable input
        towerInput.disabled = false;
        submitBtn.disabled = false;
        
        // Resume timer from remaining time
        const elapsedSeconds = Math.max(0, Math.floor(elapsed));
        const remainingTime = Math.max(0, 60 - elapsedSeconds);
        startGameTimerFromTime(remainingTime, elapsedSeconds);
        
        return true;
    } catch (error) {
        console.error('Error restoring active tower:', error);
        clearActiveTower();
        return false;
    }
}

// Select difficulty based on probability
function selectDifficulty() {
    let gotEasy = false;
    let gotMedium = false;
    let gotHard = false;
    let gotDifficult = false;
    let gotChallenging = false;
    let gotIntense = false;
    let gotRemorseless = false;
    let gotInsane = false;
    let gotExtreme = false;
    let gotTerrifying = false;
    let gotCatastrophic = false;
    let gotHorrific = false;
    let gotUnreal = false;
    let gotNil = false;
    let gotError = false;
    let gotTooHard = false;
    
    // Check Easy (1/2 chance)
    if (Math.random() < 0.5) {
        gotEasy = true;
    }
    
    // Check Medium (1/8 chance)
    if (Math.random() < 1/6) {
        gotMedium = true;
    }
    
    // Check Hard (1/20 chance)
    if (Math.random() < 1/15) {
        gotHard = true;
    }
    
    // Check Difficult (1/60 chance)
    if (Math.random() < 1/40) {
        gotDifficult = true;
    }
    
    // Check Challenging (1/125 chance)
    if (Math.random() < 1/85) {
        gotChallenging = true;
    }
    
    // Check Intense (1/200 chance)
    if (Math.random() < 1/175) {
        gotIntense = true;
    }
    
    // Check Remorseless (1/350 chance)
    if (Math.random() < 1/300) {
        gotRemorseless = true;
    }
    
    // Check Insane (1/500 chance)
    if (Math.random() < 1/500) {
        gotInsane = true;
    }
    
    // Check Extreme (1/750 chance)
    if (Math.random() < 1/750) {
        gotExtreme = true;
    }
    
    // Check Terrifying (1/1100 chance)
    if (Math.random() < 1/1100) {
        gotTerrifying = true;
    }
    
    // Check Catastrophic (1/1500 chance)
    if (Math.random() < 1/1500) {
        gotCatastrophic = true;
    }
    
    // Check Horrific (1/2500 chance)
    if (Math.random() < 1/2500) {
        gotHorrific = true;
    }
    
    // Check Unreal (1/3750 chance)
    if (Math.random() < 1/3750) {
        gotUnreal = true;
    }
    
    // Check nil (1/5000 chance)
    if (Math.random() < 1/5000) {
        gotNil = true;
    }
    
    // Check eRRoR (1/7000 chance)
    if (Math.random() < 1/7000) {
        gotError = true;
    }
    
    // Check TooHard (1/10000 chance)
    if (Math.random() < 1/10000) {
        gotTooHard = true;
    }
    
    // Take the rarest difficulty gotten, or Effortless if none
    // Check from rarest to most common
    if (gotTooHard) {
        return 'toohard';
    } else if (gotError) {
        return 'error';
    } else if (gotNil) {
        return 'nil';
    } else if (gotUnreal) {
        return 'unreal';
    } else if (gotHorrific) {
        return 'horrific';
    } else if (gotCatastrophic) {
        return 'catastrophic';
    } else if (gotTerrifying) {
        return 'terrifying';
    } else if (gotExtreme) {
        return 'extreme';
    } else if (gotInsane) {
        return 'insane';
    } else if (gotRemorseless) {
        return 'remorseless';
    } else if (gotIntense) {
        return 'intense';
    } else if (gotChallenging) {
        return 'challenging';
    } else if (gotDifficult) {
        return 'difficult';
    } else if (gotHard) {
        return 'hard';
    } else if (gotMedium) {
        return 'medium';
    } else if (gotEasy) {
        return 'easy';
    } else {
        return 'effortless';
    }
}

// Select random tower from difficulty
function selectRandomTower(difficulty) {
    const towers = towerData[difficulty];
    if (!towers || towers.length === 0) {
        console.error(`No towers available for difficulty: ${difficulty}`);
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * towers.length);
    const selected = towers[randomIndex].trim();
    return selected;
}

// Try to load an image with different extensions
function loadTowerImage(towerName, towerImage) {
    if (!towerImage) {
        return;
    }
    
    const normalizedName = towerName.trim();
    
    // Clean up previous handlers and hide image while loading new one
    towerImage.onload = null;
    towerImage.onerror = null;
    towerImage.style.display = 'none';
    
    const rawCandidates = [
        normalizedName,
        normalizedName.replace(/\s+/g, '_'),
        normalizedName.replace(/\s+/g, ''),
        normalizedName.replace(/'/g, ''),
        normalizedName.replace(/[^A-Za-z0-9_-]/g, ''),
        normalizedName.toLowerCase(),
        normalizedName.toLowerCase().replace(/\s+/g, '_'),
        normalizedName.toLowerCase().replace(/\s+/g, ''),
        normalizedName.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    ];
    
    const uniqueCandidates = Array.from(new Set(rawCandidates.filter(Boolean)));
    const extensions = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.svg'];
    const basePaths = [
        '',
        'Tower Images/',
        'TowerImages/',
        'Tower_Pictures/',
        'TowerPictures/',
        'towers/',
        'images/',
        'img/',
        'assets/towers/'
    ];
    
    const sources = [];
    uniqueCandidates.forEach(candidate => {
        extensions.forEach(ext => {
            basePaths.forEach(base => {
                sources.push(`${base}${candidate}${ext}`);
            });
        });
    });
    
    let currentIndex = 0;
    
    function tryNextSource() {
        if (currentIndex >= sources.length) {
            console.warn('No image found for tower:', towerName, 'tried sources:', sources);
            towerImage.style.display = 'none';
            towerImage.src = '';
            return;
        }
        
        const nextSrc = sources[currentIndex];
        currentIndex++;
        
        const onLoad = () => {
            towerImage.style.display = 'block';
            towerImage.onload = null;
            towerImage.onerror = null;
        };
        
        const onError = () => {
            towerImage.onload = null;
            towerImage.onerror = null;
            tryNextSource();
        };
        
        towerImage.onload = onLoad;
        towerImage.onerror = onError;
        towerImage.src = encodeURI(nextSrc);
    }
    
    tryNextSource();
}

// Function to apply background based on difficulty
function applyDifficultyBackground(difficulty) {
    const body = document.body;
    
    // Gradient background for Insane, Extreme, Terrifying, Catastrophic
    if (difficulty === 'insane' || difficulty === 'extreme' || difficulty === 'terrifying' || difficulty === 'catastrophic') {
        body.style.background = 'linear-gradient(180deg, #0000FF 0%, #0389FF 33%, #00FFFF 66%, #FFFFFF 100%)';
        body.style.backgroundAttachment = 'fixed';
        body.style.boxShadow = 'none';
        body.style.border = 'none';
    }
    // Outline effect for Horrific, Unreal, nil, eRRoR, TooHard
    // Layers from innermost to outermost: Horrific (25px), Unreal, nil, eRRoR, TooHard
    else if (difficulty === 'horrific' || difficulty === 'unreal' || difficulty === 'nil' || difficulty === 'error' || difficulty === 'toohard') {
        const outlineWidth = 25;
        const shadows = [];
        
        // Build box-shadow layers (box-shadow layers are applied from outermost to innermost)
        // So we build from outermost to innermost
        
        // TooHard (outermost, 125px)
        if (difficulty === 'toohard') {
            shadows.push(`inset 0 0 0 ${outlineWidth * 5}px #000000`);
        }
        
        // eRRoR (100px) - using average color for gradient
        if (difficulty === 'error' || difficulty === 'toohard') {
            shadows.push(`inset 0 0 0 ${outlineWidth * 4}px rgb(170, 105, 105)`);
        }
        
        // nil (75px)
        if (difficulty === 'nil' || difficulty === 'error' || difficulty === 'toohard') {
            shadows.push(`inset 0 0 0 ${outlineWidth * 3}px #65666D`);
        }
        
        // Unreal (50px)
        if (difficulty === 'unreal' || difficulty === 'nil' || difficulty === 'error' || difficulty === 'toohard') {
            shadows.push(`inset 0 0 0 ${outlineWidth * 2}px #5100CB`);
        }
        
        // Horrific (innermost, 25px)
        shadows.push(`inset 0 0 0 ${outlineWidth}px #9695FF`);
        
        body.style.background = '#000000';
        body.style.boxShadow = shadows.join(', ');
        body.style.backgroundAttachment = 'fixed';
        body.style.border = 'none';
    }
    // Normal background for other difficulties
    else {
        resetBackground();
    }
}

// Function to reset background to normal
function resetBackground() {
    const body = document.body;
    body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    body.style.boxShadow = 'none';
    body.style.backgroundAttachment = 'fixed';
}

// Get difficulty color for outline
function getDifficultyColor(difficulty) {
    const colorMap = {
        'effortless': '#00CE00',
        'easy': '#75F347',
        'medium': '#FFFE00',
        'hard': '#FD7C00',
        'difficult': '#FF3232',
        'challenging': '#A00000',
        'intense': '#19232D',
        'remorseless': '#C800C8',
        'insane': '#0000FF',
        'extreme': '#0389FF',
        'terrifying': '#00FFFF',
        'catastrophic': '#FFFFFF',
        'horrific': '#9695FF',
        'unreal': '#5100CB',
        'nil': '#65666D',
        'error': 'rgb(170, 105, 105)', // Average of eRRoR gradient
        'toohard': '#000000'
    };
    return colorMap[difficulty] || '#667eea';
}

// Apply difficulty outline to tower image
function applyTowerOutline(difficulty) {
    const towerImage = document.getElementById('towerImage');
    if (!towerImage) return;
    
    const color = getDifficultyColor(difficulty);
    // Apply outline with 5px width
    towerImage.style.border = `5px solid ${color}`;
    towerImage.style.boxShadow = `0 0 10px ${color}`;
}

// Clear tower outline
function clearTowerOutline() {
    const towerImage = document.getElementById('towerImage');
    if (towerImage) {
        towerImage.style.border = 'none';
        towerImage.style.boxShadow = 'none';
    }
}

// Skip the current tower
function skipTower() {
    if (!currentUsername) {
        return;
    }
    if (!currentTower) return;
    
    const trimmedTower = currentTower.trim();
    const catchCount = caughtTowers.get(trimmedTower) || 0;
    
    // Clear the 60 second timer
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    // Clear saved state
    clearActiveTower();
    
    // Clear tower outline
    clearTowerOutline();
    
    // Reset background to normal
    resetBackground();
    
    // Return music to default
    playMusic('Default.mp3');
    
    // Clear message (no message displayed on skip)
    clearGameMessage();
    
    // Reset state
    currentTower = null;
    currentDifficulty = null;
    isIntentionallySpawned = false;
    
    // Start new round after a brief delay
    setTimeout(() => {
        startGame();
    }, 2000);
}

// Update shop display
function updateShop() {
    const difficultySelector = document.getElementById('difficultySelector');
    if (!difficultySelector) return;
    
    difficultySelector.innerHTML = '';
    
    const difficulties = [
        { key: 'effortless', name: 'Effortless' },
        { key: 'easy', name: 'Easy' },
        { key: 'medium', name: 'Medium' },
        { key: 'hard', name: 'Hard' },
        { key: 'difficult', name: 'Difficult' },
        { key: 'challenging', name: 'Challenging' },
        { key: 'intense', name: 'Intense' },
        { key: 'remorseless', name: 'Remorseless' },
        { key: 'insane', name: 'Insane' },
        { key: 'extreme', name: 'Extreme' },
        { key: 'terrifying', name: 'Terrifying' },
        { key: 'catastrophic', name: 'Catastrophic' },
        { key: 'horrific', name: 'Horrific' },
        { key: 'unreal', name: 'Unreal' },
        { key: 'nil', name: 'nil' },
        { key: 'error', name: 'eRRoR' },
        { key: 'toohard', name: 'TooHard' }
    ];
    
    difficulties.forEach(diff => {
        const cost = getSpawnCost(diff.key);
        const canAfford = gems >= cost;
        const hasTowers = towerData[diff.key] && towerData[diff.key].length > 0;
        
        const btn = document.createElement('button');
        btn.className = 'difficulty-spawn-btn';
        btn.disabled = !canAfford || !hasTowers;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'difficulty-name';
        nameDiv.textContent = diff.name;
        nameDiv.style.color = getDifficultyColor(diff.key);
        btn.appendChild(nameDiv);
        
        const costDiv = document.createElement('div');
        costDiv.className = 'difficulty-cost';
        if (!canAfford) {
            costDiv.classList.add('insufficient');
            costDiv.textContent = `💎 ${cost} (Need ${cost - gems} more)`;
        } else {
            costDiv.textContent = `💎 ${cost}`;
        }
        btn.appendChild(costDiv);
        
        if (canAfford && hasTowers) {
            btn.onclick = () => spawnTowerFromShop(diff.key);
        }
        
        difficultySelector.appendChild(btn);
    });
}

// Spawn tower from shop
function spawnTowerFromShop(difficulty) {
    const cost = getSpawnCost(difficulty);
    
    // Check if player can afford it
    if (gems < cost) {
        alert(`Not enough gems! You need ${cost} gems but only have ${gems}.`);
        return;
    }
    
    // Check if there are towers in this difficulty
    const towers = towerData[difficulty];
    if (!towers || towers.length === 0) {
        alert(`No towers available for ${difficulty} difficulty!`);
        return;
    }
    
    // Deduct gems
    gems -= cost;
    saveGems();
    
    // Close shop modal
    document.getElementById('shopModal').style.display = 'none';
    
    // Clear any existing timers
    if (currentTimer) {
        clearInterval(currentTimer);
        currentTimer = null;
    }
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    // Clear saved active tower
    clearActiveTower();
    
    // Set flag that this was intentionally spawned
    isIntentionallySpawned = true;
    
    // Select random tower from difficulty
    const randomIndex = Math.floor(Math.random() * towers.length);
    currentTower = towers[randomIndex];
    currentDifficulty = difficulty;
    
    // Show the tower immediately
    showTowerDirectly();
}

// Show tower directly (for shop spawns)
function showTowerDirectly() {
    if (!currentUsername) {
        return;
    }
    const timerZone = document.getElementById('timerZone');
    const towerInput = document.getElementById('towerInput');
    const submitBtn = document.getElementById('submitBtn');
    // const message = document.getElementById('message');
    
    // Enable input
    towerInput.disabled = false;
    submitBtn.disabled = false;
    towerInput.focus();
    
    // Clear message
    clearGameMessage();
    
    // Load and display tower image
    const towerImage = document.getElementById('towerImage');
    loadTowerImage(currentTower, towerImage);
    
    // Apply difficulty background
    applyDifficultyBackground(currentDifficulty);
    
    // Apply tower outline
    applyTowerOutline(currentDifficulty);
    
    // Play appropriate music
    if (currentDifficulty === 'insane' || currentDifficulty === 'extreme' || 
        currentDifficulty === 'terrifying' || currentDifficulty === 'catastrophic') {
        playMusic('Point.mp3');
    } else if (currentDifficulty === 'horrific' || currentDifficulty === 'unreal' || 
               currentDifficulty === 'nil' || currentDifficulty === 'error') {
        playMusic('Quality Control.mp3');
    } else {
        playMusic('Default.mp3');
    }
    
    // Start the 60 second timer
    towerStartTime = Date.now();
    startGameTimer(60);
    
    // Save active tower state
    saveActiveTower();
}

// Function to show the tower (called when timer ends or is skipped)
function showTower() {
    if (!currentUsername) {
        return;
    }
    const timerZone = document.getElementById('timerZone');
    const towerInput = document.getElementById('towerInput');
    const submitBtn = document.getElementById('submitBtn');
    const towerImage = document.getElementById('towerImage');
    
    // Clear the pre-timer
    if (currentTimer) {
        clearInterval(currentTimer);
        currentTimer = null;
    }
    
    // Select difficulty and tower
    currentDifficulty = selectDifficulty();
    currentTower = selectRandomTower(currentDifficulty);
    
    if (!currentTower) {
        setGameMessage('Error: No tower found! Please refresh the page.', { type: 'error' });
        console.error('Failed to select tower. Tower data:', towerData);
        // Try to restart after a delay
        setTimeout(() => {
            startGame();
        }, 3000);
        return;
    }
    
    // Apply background based on difficulty
    applyDifficultyBackground(currentDifficulty);
    
    // Play appropriate music based on difficulty
    if (currentDifficulty === 'insane' || currentDifficulty === 'extreme' || 
        currentDifficulty === 'terrifying' || currentDifficulty === 'catastrophic') {
        playMusic('Point.mp3');
    } else if (currentDifficulty === 'horrific' || currentDifficulty === 'unreal' || 
               currentDifficulty === 'nil' || currentDifficulty === 'error') {
        playMusic('Quality Control.mp3');
    } else {
        playMusic('Default.mp3');
    }
    
    // Load and display tower image (tries multiple extensions)
    loadTowerImage(currentTower, towerImage);
    
    // Apply difficulty outline to tower image
    applyTowerOutline(currentDifficulty);
    
    // Enable input
    towerInput.disabled = false;
    submitBtn.disabled = false;
    towerInput.focus();
    
    // Start 60 second timer when tower appears (this will handle skip logic)
    startGameTimer();
    
    // Save the active tower state
    saveActiveTower();
}

// Start the game
function startGame() {
    if (!currentUsername) {
        return;
    }
    const timerZone = document.getElementById('timerZone');
    const towerInput = document.getElementById('towerInput');
    const submitBtn = document.getElementById('submitBtn');
    const towerImage = document.getElementById('towerImage');
    
    // Clear previous state
    clearGameMessage();
    towerImage.style.display = 'none';
    towerInput.value = '';
    
    // Clear any existing timers
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    // Disable input
    towerInput.disabled = true;
    submitBtn.disabled = true;
    
    // Make timer zone clickable to skip
    timerZone.style.cursor = 'pointer';
    timerZone.title = 'Click to skip';
    timerZone.onclick = () => {
        if (currentTimer) {
            showTower();
        }
    };
    
    // Start 15 second timer
    let timeLeft = 15;
    timerZone.textContent = timeLeft;
    
    currentTimer = setInterval(() => {
        timeLeft--;
        timerZone.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            showTower();
        }
    }, 1000);
}

// Start the 60 second timer after tower appears (from beginning or from specific time)
function startGameTimer(startTime = 60, elapsedAlready = 0) {
    const timerZone = document.getElementById('timerZone');
    const towerInput = document.getElementById('towerInput');
    const submitBtn = document.getElementById('submitBtn');
    const towerImage = document.getElementById('towerImage');
    
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    const trimmedTower = currentTower ? currentTower.trim() : '';
    const catchCount = trimmedTower ? (caughtTowers.get(trimmedTower) || 0) : 0;
    
    let timeLeft = startTime;
    let elapsed = elapsedAlready;
    timerZone.textContent = timeLeft;
    const skipThreshold = 10;
    
    function skipTowerHandler(e) {
        e.preventDefault();
        e.stopPropagation();
        skipTower();
    }
    
    function disableSkip() {
        timerZone.style.cursor = 'default';
        timerZone.title = '';
        timerZone.onclick = null;
        timerZone.removeEventListener('click', skipTowerHandler);
    }
    
    function enableSkip() {
        timerZone.style.cursor = 'pointer';
        timerZone.title = catchCount >= 3 ? 'Click to skip (caught 3+ times)' : 'Click to skip';
        timerZone.onclick = null;
        timerZone.removeEventListener('click', skipTowerHandler);
        timerZone.addEventListener('click', skipTowerHandler);
    }
    
    function updateSkipState() {
        if (catchCount >= 3 || elapsed >= skipThreshold) {
            enableSkip();
        } else {
            disableSkip();
        }
    }
    
    updateSkipState();
    saveActiveTower();
    
    gameTimer = setInterval(() => {
        timeLeft--;
        elapsed++;
        timerZone.textContent = timeLeft;
        
        updateSkipState();
        
        if (currentTower && currentDifficulty) {
            const state = {
                tower: currentTower,
                difficulty: currentDifficulty,
                startTime: towerStartTime || Date.now(),
                timerStarted: true
            };
            localStorage.setItem('activeTower', JSON.stringify(state));
        }
        
        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            gameTimer = null;
            
            clearActiveTower();
            
            towerInput.disabled = true;
            submitBtn.disabled = true;
            towerImage.style.display = 'none';
            towerImage.src = '';
            timerZone.textContent = '--';
            
            clearTowerOutline();
            resetBackground();
            playMusic('Default.mp3');
            clearGameMessage();
            
            // Reset state
            currentTower = null;
            currentDifficulty = null;
            
            setTimeout(() => {
                startGame();
            }, 2000);
        }
    }, 1000);
}

// Alias for starting from a specific time (used when restoring)
function startGameTimerFromTime(timeLeft, elapsed = 60 - timeLeft) {
    const safeElapsed = clamp(elapsed, 0, 60);
    startGameTimer(timeLeft, safeElapsed);
}

// Handle tower name submission
function handleSubmit() {
    if (!currentUsername) {
        showAuthOverlay('login');
        return;
    }
    const towerInput = document.getElementById('towerInput');
    const userInput = towerInput.value.trim();
    
    if (!currentTower || !userInput) {
        return;
    }
    
    // Check if input matches (case-insensitive, identical in everything except capitalization)
    // Compare trimmed versions to handle whitespace, convert to lowercase for case-insensitive comparison
    const trimmedInput = userInput.trim();
    const trimmedTower = currentTower.trim();
    
    if (trimmedInput.toLowerCase() === trimmedTower.toLowerCase()) {
        // Correct!
        let successMessage = `You have catched ${currentTower} of the difficulty ${currentDifficulty}!`;
        
        // Increment caught count for this tower
        const currentCount = caughtTowers.get(trimmedTower) || 0;
        caughtTowers.set(trimmedTower, currentCount + 1);
        incrementGlobalTowerCatches(1);
        saveCaughtTowers();
        
        // Check for badges
        const isNewDifficultyBadge = checkBadge(currentDifficulty);
        const isFirstTowerBadge = checkFirstTowerBadge();
        const isNewTowerCountBadge = checkTowerCountBadges();
        const isMasteryBadge = checkMasteryBadge();
        const isPerfectionBadge = checkPerfectionBadge();
        
        const isNewBadge = isNewDifficultyBadge || isFirstTowerBadge || (isNewTowerCountBadge && isNewTowerCountBadge.length > 0) || isMasteryBadge || isPerfectionBadge;
        
        // Award gems if not intentionally spawned
        if (!isIntentionallySpawned) {
            const reward = getGemReward(currentDifficulty);
            gems += reward;
            saveGems();
        }
        
        // Reset intentionally spawned flag
        isIntentionallySpawned = false;
        
        // Update collection view
        updateCollection();
        updateProfileStatsDisplay();
        
        // Show badge notification if new
        if (isNewBadge) {
            let badgeNames = [];
            if (isNewDifficultyBadge) {
                const diffName = currentDifficulty === 'error' ? 'eRRoR' : 
                               currentDifficulty === 'toohard' ? 'TooHard' :
                               currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);
                badgeNames.push(diffName);
            }
            if (isFirstTowerBadge) badgeNames.push('First Tower');
            if (isNewTowerCountBadge && Array.isArray(isNewTowerCountBadge)) {
                // isNewTowerCountBadge is an array of newly unlocked milestones
                isNewTowerCountBadge.forEach(milestone => {
                    badgeNames.push(`${milestone} Towers`);
                });
            }
            if (isMasteryBadge) badgeNames.push('Mastery');
            if (isPerfectionBadge) badgeNames.push('Perfection');
            
            const badgeText = badgeNames.join(', ');
            successMessage = `You have catched ${currentTower} of the difficulty ${currentDifficulty}! Badge unlocked: ${badgeText}!`;
        }
        
        setGameMessage(successMessage, { type: 'success', difficulty: currentDifficulty });
        if (announcementDifficulties.has(currentDifficulty)) {
            announceCatch(profileData.username, currentTower, currentDifficulty);
        }
        
        // Clear the 60 second timer since tower was caught
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
        
        // Clear saved state
        clearActiveTower();
        
        // Clear tower outline
        clearTowerOutline();
        
        // Reset background to normal
        resetBackground();
        
        // Return music to default
        playMusic('Default.mp3');
        
        // Reset after 3 seconds
        setTimeout(() => {
            startGame();
        }, 3000);
    } else {
        // Wrong!
        setGameMessage('Wrong name!', { type: 'error' });
    }
}

// Update collection view
function updateCollection() {
    const collectionList = document.getElementById('collectionList');
    collectionList.innerHTML = '';
    
    // Organize by difficulty: Effortless, Easy, Medium, Hard, Difficult, and all new ones
    const difficulties = [
        { name: 'effortless', towers: towerData.effortless, color: '#00CE00' },
        { name: 'easy', towers: towerData.easy, color: '#75F347' },
        { name: 'medium', towers: towerData.medium, color: '#FFFE00' },
        { name: 'hard', towers: towerData.hard, color: '#FD7C00' },
        { name: 'difficult', towers: towerData.difficult, color: '#FF3232' },
        { name: 'challenging', towers: towerData.challenging, color: '#A00000' },
        { name: 'intense', towers: towerData.intense, color: '#19232D' },
        { name: 'remorseless', towers: towerData.remorseless, color: '#C800C8' },
        { name: 'insane', towers: towerData.insane, color: '#0000FF' },
        { name: 'extreme', towers: towerData.extreme, color: '#0389FF' },
        { name: 'terrifying', towers: towerData.terrifying, color: '#00FFFF' },
        { name: 'catastrophic', towers: towerData.catastrophic, color: '#FFFFFF' },
        { name: 'horrific', towers: towerData.horrific, color: '#9695FF' },
        { name: 'unreal', towers: towerData.unreal, color: '#5100CB' },
        { name: 'nil', towers: towerData.nil, color: '#65666D' },
        { name: 'error', towers: towerData.error, color: 'linear-gradient(180deg, rgb(255, 174, 174), rgb(86, 36, 36))' },
        { name: 'toohard', towers: towerData.toohard, color: '#000000' }
    ];
    
    difficulties.forEach(diff => {
        const section = document.createElement('div');
        section.className = 'difficulty-section';
        
        const title = document.createElement('div');
        title.className = 'difficulty-title';
        // Special case for error -> eRRoR
        const displayName = diff.name === 'error' ? 'eRRoR' : 
                            diff.name === 'toohard' ? 'TooHard' :
                            diff.name.charAt(0).toUpperCase() + diff.name.slice(1);
        title.textContent = displayName;
        section.appendChild(title);
        
        // Show all towers for this difficulty, even if not caught
        diff.towers.forEach(towerName => {
            const towerItem = document.createElement('div');
            towerItem.className = `tower-item difficulty-${diff.name}`;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'tower-name';
            nameSpan.textContent = towerName.trim();
            // Apply color directly if it's a gradient (for error)
            if (typeof diff.color === 'string' && diff.color.includes('gradient')) {
                nameSpan.style.background = diff.color;
                nameSpan.style.webkitBackgroundClip = 'text';
                nameSpan.style.webkitTextFillColor = 'transparent';
                nameSpan.style.backgroundClip = 'text';
            }
            
            // Get catch count for this tower
            const trimmedName = towerName.trim();
            const count = caughtTowers.get(trimmedName) || caughtTowers.get(towerName) || 0;
            const isCaught = count > 0;
            
            // Make tower name clickable if caught (to view picture)
            if (isCaught) {
                nameSpan.style.cursor = 'pointer';
                nameSpan.style.textDecoration = 'underline';
                nameSpan.title = 'Click to view picture';
                nameSpan.addEventListener('click', () => {
                    showTowerPicture(towerName.trim());
                });
            }
            
            towerItem.appendChild(nameSpan);
            
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-container';
            
            // Display count to the left of checkbox
            if (count > 0) {
                const countSpan = document.createElement('span');
                countSpan.className = 'catch-count';
                countSpan.textContent = `${count}x`;
                checkboxContainer.appendChild(countSpan);
            }
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isCaught;
            checkbox.disabled = true; // Make it read-only
            checkboxContainer.appendChild(checkbox);
            
            towerItem.appendChild(checkboxContainer);
            section.appendChild(towerItem);
        });
        
        collectionList.appendChild(section);
    });
}

// Initialize the game
async function init() {
    await loadTowerData();
    
    // Verify data was loaded
    const totalTowers = towerData.effortless.length + towerData.easy.length + towerData.medium.length + 
        towerData.hard.length + towerData.difficult.length + towerData.challenging.length + 
        towerData.intense.length + towerData.remorseless.length + towerData.insane.length + 
        towerData.extreme.length + towerData.terrifying.length + towerData.catastrophic.length + 
        towerData.horrific.length + towerData.unreal.length + towerData.nil.length + 
        towerData.error.length + towerData.toohard.length;
    if (totalTowers === 0) {
        document.getElementById('message').textContent = 'Error: No towers loaded. Please check the .txt files.';
        document.getElementById('message').className = 'message error';
        return;
    }
    
    buildTowerDifficultyLookup();
    updateTowersDatalist();
    
    loadAccounts();
    loadGlobalStats();
    migrateLegacyDataIfNeeded();
    cleanupLegacyOwnerAccounts();
    ensureDefaultOwnerAccount();
    refreshTakenUsernames();
    restoreCurrentUser();
    
    setupAuthUI();
    setupProfileSearch();
    setupProfileViewerModal();
    setupProfilePasswordControls();
    setupLogoutButton();
    setupTutorialModal();
    
    if (currentUsername) {
        initializeUserSession(currentUsername);
    } else {
        teardownActiveSession();
        showAuthOverlay('login');
    }
    
    // Set up event listeners
    document.getElementById('submitBtn').addEventListener('click', handleSubmit);
    document.getElementById('towerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !document.getElementById('towerInput').disabled) {
            handleSubmit();
        }
    });
    
    // Collection modal
    const collectionBtn = document.getElementById('collectionBtn');
    const collectionModal = document.getElementById('collectionModal');
    const closeModal = document.getElementById('closeModal');
    
    collectionBtn.addEventListener('click', () => {
        if (!currentUsername) {
            showAuthOverlay('login');
            return;
        }
        updateCollection();
        collectionModal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', () => {
        collectionModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === collectionModal) {
            collectionModal.style.display = 'none';
        }
    });
    
    // Settings modal
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    
    settingsBtn.addEventListener('click', () => {
        if (!currentUsername) {
            showAuthOverlay('login');
            return;
        }
        settingsModal.style.display = 'block';
    });
    
    closeSettingsModal.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // Reset progress button
    const resetProgressBtn = document.getElementById('resetProgressBtn');
    const resetConfirmModal = document.getElementById('resetConfirmModal');
    const confirmResetBtn = document.getElementById('confirmResetBtn');
    const cancelResetBtn = document.getElementById('cancelResetBtn');
    
    resetProgressBtn.addEventListener('click', () => {
        if (!currentUsername) {
            showAuthOverlay('login');
            return;
        }
        resetConfirmModal.style.display = 'block';
    });
    
    confirmResetBtn.addEventListener('click', () => {
        resetAllProgress();
        resetConfirmModal.style.display = 'none';
        settingsModal.style.display = 'none';
    });
    
    cancelResetBtn.addEventListener('click', () => {
        resetConfirmModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === resetConfirmModal) {
            resetConfirmModal.style.display = 'none';
        }
    });
    
    // Tower picture modal
    const towerPictureModal = document.getElementById('towerPictureModal');
    const closeTowerModal = document.getElementById('closeTowerModal');
    
    closeTowerModal.addEventListener('click', () => {
        towerPictureModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === towerPictureModal) {
            towerPictureModal.style.display = 'none';
        }
    });
    
    // Badge collection modal
    const badgeCollectionModal = document.getElementById('badgeCollectionModal');
    const closeBadgeModal = document.getElementById('closeBadgeModal');
    
    closeBadgeModal.addEventListener('click', () => {
        badgeCollectionModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === badgeCollectionModal) {
            badgeCollectionModal.style.display = 'none';
        }
    });
    
    // Badges button
    const badgesBtn = document.getElementById('badgesBtn');
    badgesBtn.addEventListener('click', () => {
        if (!currentUsername) {
            showAuthOverlay('login');
            return;
        }
        updateBadgeCollection();
        badgeCollectionModal.style.display = 'block';
    });
    
    // Shop modal
    const shopBtn = document.getElementById('shopBtn');
    const shopModal = document.getElementById('shopModal');
    const closeShopModal = document.getElementById('closeShopModal');
    
    shopBtn.addEventListener('click', () => {
        if (!currentUsername) {
            showAuthOverlay('login');
            return;
        }
        updateShop();
        shopModal.style.display = 'block';
    });
    
    closeShopModal.addEventListener('click', () => {
        shopModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === shopModal) {
            shopModal.style.display = 'none';
        }
    });
    
    // Profile modal
    const profileBtn = document.getElementById('profileBtn');
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    
    profileBtn.addEventListener('click', () => {
        if (!currentUsername) {
            showAuthOverlay('login');
            return;
        }
        updateProfileStatsDisplay();
        profileModal.style.display = 'block';
    });
    
    closeProfileModal.addEventListener('click', () => {
        profileModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.style.display = 'none';
        }
    });
    
    // Profile editable fields
    setupProfileEditableField({
        button: document.getElementById('profileUsernameActionBtn'),
        input: document.getElementById('profileUsernameInput'),
        display: document.getElementById('profileUsernameDisplay'),
        getValue: () => profileData.username,
        validate: (value) => {
            const trimmed = value.trim();
            if (!trimmed) {
                return { valid: false, message: 'Username cannot be empty.' };
            }
            if (trimmed.length > 32) {
                return { valid: false, message: 'Username must be 32 characters or fewer.' };
            }
            const allowed = /^[A-Za-z0-9 _-]+$/;
            if (!allowed.test(trimmed)) {
                return { valid: false, message: 'Username can only contain letters, numbers, spaces, underscores, and hyphens.' };
            }
            if (trimmed !== profileData.username && isUsernameTaken(trimmed)) {
                return { valid: false, message: 'That username is already taken. Please choose another.' };
            }
            return { valid: true, value: trimmed };
        },
        onSave: (newValue) => {
            if (newValue === profileData.username) {
                return;
            }
            const previousUsername = profileData.username;
            const normalizedNew = newValue.trim();
            const renamed = renameAccount(previousUsername, normalizedNew);
            if (!renamed) {
                updateRegisteredUsername(previousUsername, normalizedNew);
            }
            profileData.username = normalizedNew;
            updateRankMembershipForUsernameChange(previousUsername, normalizedNew);
        }
    });
    
    const towerNameValidator = (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return { valid: true, value: '' };
        }
        if (!towerDifficultyLookup.has(trimmed)) {
            return { valid: false, message: 'Please choose a tower from the list.' };
        }
        return { valid: true, value: trimmed };
    };
    
    setupProfileEditableField({
        button: document.getElementById('profileFavoriteActionBtn'),
        input: document.getElementById('profileFavoriteInput'),
        display: document.getElementById('profileFavoriteDisplay'),
        getValue: () => profileData.favoriteTower,
        validate: towerNameValidator,
        onSave: (newValue) => {
            profileData.favoriteTower = newValue;
        }
    });
    
    setupProfileEditableField({
        button: document.getElementById('profileLeastFavoriteActionBtn'),
        input: document.getElementById('profileLeastFavoriteInput'),
        display: document.getElementById('profileLeastFavoriteDisplay'),
        getValue: () => profileData.leastFavoriteTower,
        validate: towerNameValidator,
        onSave: (newValue) => {
            profileData.leastFavoriteTower = newValue;
        }
    });
    
    setupProfileEditableField({
        button: document.getElementById('profileQuoteActionBtn'),
        input: document.getElementById('profileQuoteInput'),
        display: document.getElementById('profileQuoteDisplay'),
        getValue: () => profileData.quote,
        validate: (value) => {
            if (value.length > 512) {
                return { valid: false, message: 'Quote must be 512 characters or fewer.' };
            }
            return { valid: true, value };
        },
        onSave: (newValue) => {
            profileData.quote = newValue;
        }
    });
}

// Show tower picture in modal
function showTowerPicture(towerName) {
    const modal = document.getElementById('towerPictureModal');
    const title = document.getElementById('towerPictureTitle');
    const img = document.getElementById('towerPictureImg');
    
    title.textContent = towerName;
    
    // Try to load image with different extensions
    const extensions = ['.webp', '.png', '.jpg', '.jpeg'];
    let found = false;
    
    function tryLoad(index) {
        if (index >= extensions.length) {
            if (!found) {
                img.src = '';
                img.alt = 'Image not found';
                img.style.display = 'none';
            }
            modal.style.display = 'block';
            return;
        }
        
        const imagePath = towerName + extensions[index];
        img.src = imagePath;
        img.onload = () => {
            img.style.display = 'block';
            found = true;
            modal.style.display = 'block';
        };
        img.onerror = () => {
            tryLoad(index + 1);
        };
    }
    
    tryLoad(0);
}

// Start when page loads
window.addEventListener('DOMContentLoaded', init);

window.addEventListener('beforeunload', () => {
    stopPlaytimeTracking();
});

function clamp(value, min, max) {
    const number = Number.isFinite(value) ? value : parseFloat(value);
    if (Number.isNaN(number)) {
        return min;
    }
    return Math.min(Math.max(number, min), max);
}


let pendingMusicTrack = null;
let musicResumeHandler = null;

function cleanupMusicResumeHandler() {
    if (!musicResumeHandler) return;
    document.removeEventListener('click', musicResumeHandler);
    document.removeEventListener('keydown', musicResumeHandler);
    musicResumeHandler = null;
}

function isPrivilegedRank(username) {
    const key = getRankKeyForUsername(username);
    return key === 'owner' || key === 'coOwner';
}

function removeAccount(username) {
    const normalized = normalizeUsernameValue(username);
    if (!normalized) {
        return false;
    }
    const entryName = Object.keys(accounts).find(name => normalizeUsernameValue(name) === normalized);
    if (!entryName) {
        return false;
    }

    const bases = ['profileData', 'caughtTowers', 'badges', 'gems', 'activeTower'];
    bases.forEach(base => {
        const key = accountStorageKey(base, entryName);
        if (key) {
            localStorage.removeItem(key);
        }
    });

    delete accounts[entryName];
    saveAccounts();

    loadTakenUsernames();
    takenUsernames.delete(entryName);
    saveTakenUsernames();

    const rankLists = ['ownerUsers', 'coOwnerUsers', 'testerUsers'];
    rankLists.forEach(listKey => {
        const list = rankConfig[listKey];
        if (!Array.isArray(list)) return;
        const index = list.findIndex(name => normalizeUsernameValue(name) === normalized);
        if (index !== -1) {
            list.splice(index, 1);
        }
    });

    if (currentUsername === entryName) {
        teardownActiveSession();
        setCurrentUser(null);
        profileData = { ...profileDefaults };
        caughtTowers = new Map();
        badges = new Set();
        gems = 0;
        updateGemDisplay();
        updateCollection();
        updateBadgesDisplay();
        updateProfileStatsDisplay();
    }

    refreshTakenUsernames();
    return true;
}

