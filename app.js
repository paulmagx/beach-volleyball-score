const API_URL = 'https://beachvolleyball-blog.com/score-api.php';

const state = {
    name1: 'Team 1',
    name2: 'Team 2',
    t1Sets: 0,
    t2Sets: 0,
    t1Points: 0,
    t2Points: 0
};

// History for Undo
const historyStack = [];

// DOM Elements
const els = {
    name1: document.getElementById('name1'),
    name2: document.getElementById('name2'),
    sets1: document.getElementById('sets1'),
    sets2: document.getElementById('sets2'),
    points1: document.getElementById('points1'),
    points2: document.getElementById('points2'),
    status: document.getElementById('status-msg'),
    saveNames: document.getElementById('save-names')
};

// --- Initialization ---
async function init() {
    loadLocal();
    render();

    // Initial fetch to sync with server if data is there
    try {
        await loadRemote();
    } catch (e) {
        console.warn('Initial load failed, using local state');
    }

    setupListeners();
}

function setupListeners() {
    // Score Buttons
    document.getElementById('btn-p1').addEventListener('mousedown', (e) => handlePoint(1, e)); // Using mousedown for instant response
    document.getElementById('btn-p2').addEventListener('mousedown', (e) => handlePoint(2, e));
    // Prevent double filing on touch devices
    document.getElementById('btn-p1').addEventListener('touchstart', (e) => { e.preventDefault(); handlePoint(1, e); });
    document.getElementById('btn-p2').addEventListener('touchstart', (e) => { e.preventDefault(); handlePoint(2, e); });

    // Minus Buttons
    document.getElementById('minus-p1').addEventListener('mousedown', (e) => handleMinus(1, e));
    document.getElementById('minus-p2').addEventListener('mousedown', (e) => handleMinus(2, e));
    document.getElementById('minus-p1').addEventListener('touchstart', (e) => { e.preventDefault(); handleMinus(1, e); });
    document.getElementById('minus-p2').addEventListener('touchstart', (e) => { e.preventDefault(); handleMinus(2, e); });

    // Set Controls
    document.querySelectorAll('.set-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            pushHistory();
            const team = parseInt(btn.dataset.team);
            const action = btn.dataset.action;
            if (action === 'inc-set') {
                if (team === 1) state.t1Sets++; else state.t2Sets++;
            } else {
                if (team === 1) state.t1Sets = Math.max(0, state.t1Sets - 1);
                else state.t2Sets = Math.max(0, state.t2Sets - 1);
            }
            save();
            render();
        });
    });

    // Control Bar
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('switch-sides-btn').addEventListener('click', () => {
        alert('Switch Sides Manually Triggered');
    });
    document.getElementById('reset-match-btn').addEventListener('click', () => {
        if (confirm('Start new match? Scores will be reset.')) {
            pushHistory();
            state.t1Points = 0;
            state.t2Points = 0;
            state.t1Sets = 0;
            state.t2Sets = 0;
            save();
            render();
        }
    });

    // Names
    els.saveNames.addEventListener('click', () => {
        state.name1 = els.name1.value;
        state.name2 = els.name2.value;
        save();
        els.status.textContent = 'Names Saved';
        setTimeout(() => els.status.textContent = '', 2000);
    });

    // Modal
    els.closeModal.addEventListener('click', () => {
        els.modal.classList.remove('active');
    });
}

// --- Logic ---

function handlePoint(team, event) {
    pushHistory();

    if (team === 1) state.t1Points++;
    else state.t2Points++;

    checkSideSwitch();
    checkSetWin();

    save();
    render();
}

function handleMinus(team, event) {
    if (event) event.stopPropagation(); // Don't trigger the plus button
    pushHistory();

    if (team === 1) state.t1Points = Math.max(0, state.t1Points - 1);
    else state.t2Points = Math.max(0, state.t2Points - 1);

    save();
    render();
}

function checkSideSwitch() {
    const sum = state.t1Points + state.t2Points;
    const isTieBreak = (state.t1Sets === 1 && state.t2Sets === 1); // Approximation for simple logic

    // Rule: Switch every 7 points (sets 1/2) or every 5 points (set 3)
    // Simplified logic: Check standard beach rules
    const switchInterval = isTieBreak ? 5 : 7;

    if (sum > 0 && sum % switchInterval === 0) {
        showSwitchModal(sum);
    }
}

function checkSetWin() {
    const p1 = state.t1Points;
    const p2 = state.t2Points;
    const isTieBreak = (state.t1Sets === 1 && state.t2Sets === 1); // Assuming BO3

    const winPoints = isTieBreak ? 15 : 21;

    // Win by 2
    if ((p1 >= winPoints && p1 - p2 >= 2) || (p2 >= winPoints && p2 - p1 >= 2)) {
        // Set Won
        if (p1 > p2) {
            state.t1Sets++;
            alert(`${state.name1} wins the set!`);
        } else {
            state.t2Sets++;
            alert(`${state.name2} wins the set!`);
        }
        // New Set
        state.t1Points = 0;
        state.t2Points = 0;
    }
}

function pushHistory() {
    if (historyStack.length > 20) historyStack.shift(); // Limit history
    historyStack.push(JSON.stringify(state));
}

function undo() {
    if (historyStack.length === 0) return;
    const prevState = JSON.parse(historyStack.pop());

    state.name1 = prevState.name1;
    state.name2 = prevState.name2;
    state.t1Sets = prevState.t1Sets;
    state.t2Sets = prevState.t2Sets;
    state.t1Points = prevState.t1Points;
    state.t2Points = prevState.t2Points;

    save();
    render();
}



// --- Persistence & Networking ---

function render() {
    els.name1.value = state.name1;
    els.name2.value = state.name2;
    els.sets1.textContent = state.t1Sets;
    els.sets2.textContent = state.t2Sets;
    els.points1.textContent = state.t1Points;
    els.points2.textContent = state.t2Points;
}

function saveLocal() {
    localStorage.setItem('bv_scorer_state', JSON.stringify(state));
}

function loadLocal() {
    const stored = localStorage.getItem('bv_scorer_state');
    if (stored) {
        Object.assign(state, JSON.parse(stored));
    }
}

async function save() {
    saveLocal();
    els.status.textContent = 'Saving...';
    els.status.className = 'status-bar saving';

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name1: state.name1,
                name2: state.name2,
                t1Sets: state.t1Sets,
                t2Sets: state.t2Sets,
                t1Points: state.t1Points,
                t2Points: state.t2Points
            })
        });
        els.status.textContent = 'Saved';
        els.status.className = 'status-bar saved';
    } catch (e) {
        console.error('Sync error', e);
        els.status.textContent = 'Offline (Local Only)';
        els.status.className = 'status-bar error';
    }
}

async function loadRemote() {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data) {
        state.name1 = data.name1 || state.name1;
        state.name2 = data.name2 || state.name2;
        state.t1Sets = parseInt(data.t1Sets) || 0;
        state.t2Sets = parseInt(data.t2Sets) || 0;
        state.t1Points = parseInt(data.t1Points) || 0;
        state.t2Points = parseInt(data.t2Points) || 0;
        render();
        saveLocal();
    }
}

init();
