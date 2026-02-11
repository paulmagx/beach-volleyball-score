const API_URL = 'https://beachvolleyball-blog.com/score-api.php';

const els = {
    name1: document.getElementById('name1'),
    name2: document.getElementById('name2'),
    sets1: document.getElementById('sets1'),
    sets2: document.getElementById('sets2'),
    points1: document.getElementById('points1'),
    points2: document.getElementById('points2')
};

// State to track changes and trigger animations
let lastState = {
    p1: -1, p2: -1
};

async function update() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        if (!data) return;

        // Names
        if (data.name1) els.name1.textContent = data.name1;
        if (data.name2) els.name2.textContent = data.name2;

        // Sets
        els.sets1.textContent = data.t1Sets || 0;
        els.sets2.textContent = data.t2Sets || 0;

        // Points (with animation check)
        const p1 = parseInt(data.t1Points || 0);
        const p2 = parseInt(data.t2Points || 0);

        if (p1 !== lastState.p1) {
            animate(els.points1);
            els.points1.textContent = p1;
            lastState.p1 = p1;
        }
        if (p2 !== lastState.p2) {
            animate(els.points2);
            els.points2.textContent = p2;
            lastState.p2 = p2;
        }

    } catch (e) {
        console.error('Display update error:', e);
    }
}

function animate(el) {
    el.style.transform = 'scale(1.2)';
    el.style.color = '#fff';
    setTimeout(() => {
        el.style.transform = 'scale(1)';
    }, 200);
}

// Fullscreen
document.body.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.body.requestFullscreen().catch(e => console.log(e));
    } else {
        document.exitFullscreen();
    }
});

// Poll every 1 second
setInterval(update, 1000);
update();
