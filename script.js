// State
var state = {
    bosses: [
        { id: 'b1', name: '', element: 'Fire' },
        { id: 'b2', name: '', element: 'Water' },
        { id: 'b3', name: '', element: 'Wind' },
        { id: 'b4', name: '', element: 'Iron' },
        { id: 'b5', name: '', element: 'Electric' }
    ],
    members: [],
    config: { memberCount: 32, cloudApiKey: '', cloudBinId: '' }
};
var activeBossId = 'b1';
var activeSel = null;

var ELEM_COLORS = {
    'Fire': '#e53935', 'Water': '#1e88e5', 'Wind': '#43a047', 'Iron': '#f9a825', 'Electric': '#8e24aa'
};

// Init
function init() {
    initTheme();
    var sel = document.getElementById('member-count-select');
    for (var i = 1; i <= 32; i++) {
        var opt = document.createElement('option');
        opt.value = i; opt.textContent = i;
        if (i === 32) opt.selected = true;
        sel.appendChild(opt);
    }
    var saved = localStorage.getItem('nikke_v2');
    if (saved) {
        try { 
            var parsed = JSON.parse(saved); 
            // Migration for v3 (Boss Tabs)
            if (!parsed.bosses) {
                parsed.bosses = [
                    { id: 'b1', name: '', element: 'Fire' },
                    { id: 'b2', name: '', element: 'Water' },
                    { id: 'b3', name: '', element: 'Wind' },
                    { id: 'b4', name: '', element: 'Iron' },
                    { id: 'b5', name: '', element: 'Electric' }
                ];
                parsed.members.forEach(function(m) {
                    var oldMocks = m.mocks;
                    m.bossData = {
                        'b1': { mocks: oldMocks || makeEmptyMocks() },
                        'b2': { mocks: makeEmptyMocks() },
                        'b3': { mocks: makeEmptyMocks() },
                        'b4': { mocks: makeEmptyMocks() },
                        'b5': { mocks: makeEmptyMocks() }
                    };
                    delete m.mocks;
                });
            } else {
                // Patch to fix old default names still saved in cache
                parsed.bosses.forEach(function(b) {
                    if (b.name === 'Boss 1' || b.name === 'Boss 2' || b.name === 'Boss 3' || b.name === 'Boss 4' || b.name === 'Boss 5') {
                        b.name = '';
                    }
                });
            }
            state = parsed;
        } catch(e) { buildDefaultMembers(32); }
    } else {
        buildDefaultMembers(32);
    }
    sel.value = state.config.memberCount;
    renderTabs();
    renderTable();
    bindStatic();
}

// Theme Handling
function initTheme() {
    var savedTheme = localStorage.getItem('nikke_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.setAttribute('data-theme', 'dark');
    }
    
    document.getElementById('theme-btn').onclick = function() {
        var isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('nikke_theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('nikke_theme', 'dark');
        }
    };
}

function buildDefaultMembers(n) {
    state.members = [];
    for (var i = 0; i < n; i++) state.members.push(makeMember(i));
}

function makeEmptyMocks() {
    return [0,1,2,3,4].map(function(j) { return { id: j, team: [null,null,null,null,null], damage: 0, isActual: false }; });
}

function makeMember(i) {
    return {
        id: 'm' + i + '_' + Date.now(),
        name: 'Member ' + (i + 1),
        syncLevel: 200,
        bossData: {
            'b1': { mocks: makeEmptyMocks() },
            'b2': { mocks: makeEmptyMocks() },
            'b3': { mocks: makeEmptyMocks() },
            'b4': { mocks: makeEmptyMocks() },
            'b5': { mocks: makeEmptyMocks() }
        }
    };
}

function save() {
    localStorage.setItem('nikke_v2', JSON.stringify(state));
}

function saveAndPush() {
    save();
}

// Render
function renderTabs() {
    var container = document.getElementById('boss-tabs-container');
    container.innerHTML = '';
    state.bosses.forEach(function(b, i) {
        var tab = document.createElement('div');
        tab.className = 'b-tab' + (activeBossId === b.id ? ' active' : '');
        tab.style.borderTopColor = ELEM_COLORS[b.element] || '#ccc';
        tab.textContent = b.name || b.element;
        tab.onclick = function() {
            activeBossId = b.id;
            renderTabs();
            renderTable();
        };
        container.appendChild(tab);
    });

    // Update Boss Editor fields for active tab
    var activeBoss = state.bosses.find(function(b) { return b.id === activeBossId; });
    if (activeBoss) {
        document.getElementById('boss-name-input').value = activeBoss.name;
    }
}

function renderTable() {
    var tbody = document.getElementById('member-rows');
    tbody.innerHTML = '';
    var count = parseInt(state.config.memberCount) || 32;
    while (state.members.length < count) state.members.push(makeMember(state.members.length));
    for (var i = 0; i < count; i++) {
        var m = state.members[i];
        var mocks = m.bossData[activeBossId].mocks;
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td class="col-num">' + (i+1) + '</td>' +
            '<td class="col-name"><input class="name-input" data-id="' + m.id + '" value="' + escHtml(m.name) + '"></td>' +
            '<td class="col-sync"><input class="sync-input" type="number" data-id="' + m.id + '" value="' + m.syncLevel + '"></td>' +
            '<td class="col-mocks">' + renderMocks(m, mocks) + '</td>' +
            '<td class="col-best"><strong>' + bestDmg(m, activeBossId).toLocaleString() + '</strong><br><small>Best (M)</small></td>';
        tbody.appendChild(tr);
    }
    renderLeaderboard();
    bindRows();
}

function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

function renderMocks(m, mocks) {
    var html = '<div class="mock-list">';
    mocks.forEach(function(mock) {
        var isBest = mock.damage > 0 && mock.damage === bestDmg(m, activeBossId);
        html += '<div class="mock-row' + (isBest ? ' is-best' : '') + '" data-mid="' + m.id + '" data-mockid="' + mock.id + '">';
        html += '<span class="mock-num">' + (mock.id+1) + '</span>';
        html += '<div class="slots">';
        mock.team.forEach(function(uid, idx) {
            var unit = uid ? NIKKE_UNITS.find(function(u){ return u.id===uid; }) : null;
            var slotImg = unit ? (unit.image || ('https://nikke.gg/wp-content/uploads/characters/icon/' + unit.id + '.webp')) : null;
            html += '<div class="slot' + (unit?' filled':'') + '" data-idx="' + idx + '"' + (unit?' draggable="true"':'') + '>' +
                (unit
                    ? '<img src="' + slotImg + '" class="slot-img" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\'"><span class="sname">' + escHtml(unit.name) + '</span>'
                    : '+') +
                '</div>';
        });
        html += '</div>';
        html += '<input class="dmg-input" type="number" placeholder="0" value="' + (mock.damage||'') + '">';
        html += '<label class="check-wrap"><input type="checkbox" class="act-check"' + (mock.isActual?' checked':'') + '> Done</label>';
        html += '</div>';
    });
    html += '<button class="add-mock-btn" data-mid="' + m.id + '">+ Add Team</button>';
    html += '</div>';
    return html;
}

function bestDmg(m, bossId) {
    var max = 0;
    var mocks = m.bossData[bossId].mocks;
    mocks.forEach(function(mk) { if (mk.damage > max) max = mk.damage; });
    return max;
}

function renderLeaderboard() {
    var lbTbody = document.getElementById('leaderboard-rows');
    lbTbody.innerHTML = '';
    
    // Flatten all mocks from all active members into a single array
    var allMocks = [];
    state.members.slice(0, state.config.memberCount).forEach(function(m) {
        var mocks = m.bossData[activeBossId].mocks;
        mocks.forEach(function(mk) {
            // Exclude mocks that are marked "Done" or have no damage
            if (mk.damage > 0 && !mk.isActual) {
                allMocks.push({
                    memberName: m.name,
                    mock: mk,
                    teamNum: mk.id + 1
                });
            }
        });
    });
    
    // Sort all individual mock teams by damage descending
    allMocks.sort(function(a, b) {
        return b.mock.damage - a.mock.damage;
    });
    
    if (allMocks.length === 0) {
        lbTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;font-style:italic;padding:16px;">No active teams recorded.</td></tr>';
        return;
    }
    
    // Display top 20 teams
    allMocks.slice(0, 20).forEach(function(item, idx) {
        var tr = document.createElement('tr');
        
        tr.innerHTML = 
            '<td class="lb-rank">' + (idx + 1) + '</td>' +
            '<td class="lb-name" title="' + escHtml(item.memberName) + '">' + escHtml(item.memberName) + '</td>' +
            '<td style="color:#666;font-size:11px;">Team ' + item.teamNum + '</td>' +
            '<td class="lb-dmg">' + item.mock.damage.toLocaleString() + '</td>';
        lbTbody.appendChild(tr);
    });
}

// Bind events on static elements
function bindStatic() {
    document.getElementById('boss-name-input').onchange = function(e) {
        var b = state.bosses.find(function(b) { return b.id === activeBossId; });
        if (b) { b.name = e.target.value; saveAndPush(); renderTabs(); }
    };

    document.getElementById('member-count-select').onchange = function(e) {
        state.config.memberCount = parseInt(e.target.value);
        saveAndPush();
        renderTable();
    };

    // Roster modal
    document.getElementById('roster-btn').onclick = function() {
        var names = state.members.slice(0, state.config.memberCount).map(function(m) { return m.name; }).join('\n');
        document.getElementById('inp-roster').value = names;
        document.getElementById('roster-modal').style.display = 'flex';
    };
    document.getElementById('roster-close').onclick = function() {
        document.getElementById('roster-modal').style.display = 'none';
    };
    document.getElementById('roster-save').onclick = function() {
        var lines = document.getElementById('inp-roster').value.split('\n');
        for (var i = 0; i < state.config.memberCount; i++) {
            if (lines[i] !== undefined) {
                state.members[i].name = lines[i].trim() || ('Member ' + (i + 1));
            }
        }
        saveAndPush();
        document.getElementById('roster-modal').style.display = 'none';
        renderTable();
    };

    // Unit modal close
    document.getElementById('unit-modal-close').onclick = closeUnitModal;
    document.getElementById('unit-search').oninput = renderUnitGrid;
    document.getElementById('filter-mfr').onchange = renderUnitGrid;
    document.getElementById('filter-burst').onchange = renderUnitGrid;
    document.getElementById('filter-element').onchange = renderUnitGrid;

    // Close modals on clicking overlay background
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('mousedown', function(e) {
            if (e.target === overlay) {
                overlay.style.display = 'none';
                if (overlay.id === 'unit-modal') activeSel = null;
            }
        });
    });
}

// Bind row events (re-bound on each render)
function bindRows() {
    document.querySelectorAll('.name-input').forEach(function(el) {
        el.onchange = function() {
            var m = findMember(el.dataset.id);
            if (m) { m.name = el.value; saveAndPush(); }
        };
    });
    document.querySelectorAll('.sync-input').forEach(function(el) {
        el.onchange = function() {
            var m = findMember(el.dataset.id);
            if (m) { m.syncLevel = parseInt(el.value)||200; saveAndPush(); }
        };
    });
    document.querySelectorAll('.dmg-input').forEach(function(el) {
        el.onchange = function() {
            var row = el.closest('.mock-row');
            var m = findMember(row.dataset.mid);
            var mk = m && m.bossData[activeBossId].mocks[parseInt(row.dataset.mockid)];
            if (mk) { mk.damage = parseFloat(el.value)||0; saveAndPush(); }
            // update best cell
            if (m) {
                var bestCell = el.closest('tr').querySelector('.col-best strong');
                if (bestCell) bestCell.textContent = bestDmg(m, activeBossId).toLocaleString();
                renderLeaderboard(); // Update leaderboard when damage changes
            }
        };
    });
    document.querySelectorAll('.act-check').forEach(function(el) {
        el.onchange = function() {
            var row = el.closest('.mock-row');
            var m = findMember(row.dataset.mid);
            var mk = m && m.bossData[activeBossId].mocks[parseInt(row.dataset.mockid)];
            if (mk) { 
                mk.isActual = el.checked; 
                saveAndPush(); 
                renderLeaderboard(); // Remove from leaderboard if checked
            }
        };
    });
    document.querySelectorAll('.slot').forEach(function(el) {
        el.onclick = function() {
            var row = el.closest('.mock-row');
            activeSel = { memberId: row.dataset.mid, mockId: parseInt(row.dataset.mockid), slotIdx: parseInt(el.dataset.idx) };
            openUnitModal();
        };

        // Drag and Drop (only within the same mock row)
        if (el.getAttribute('draggable') === 'true') {
            el.ondragstart = function(e) {
                var row = el.closest('.mock-row');
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    mid: row.dataset.mid,
                    mockid: parseInt(row.dataset.mockid),
                    idx: parseInt(el.dataset.idx)
                }));
                el.style.opacity = '0.5';
            };
            el.ondragend = function(e) { el.style.opacity = '1'; };
        }
        
        el.ondragover = function(e) {
            e.preventDefault(); // Allow drop
            el.style.borderColor = 'var(--primary)';
        };
        el.ondragleave = function(e) { el.style.borderColor = ''; };
        el.ondrop = function(e) {
            e.preventDefault();
            el.style.borderColor = '';
            var data = e.dataTransfer.getData('text/plain');
            if (!data) return;
            try {
                var src = JSON.parse(data);
                var row = el.closest('.mock-row');
                var targetMid = row.dataset.mid;
                var targetMockid = parseInt(row.dataset.mockid);
                var targetIdx = parseInt(el.dataset.idx);
                
                // Swap only if same team
                if (src.mid === targetMid && src.mockid === targetMockid && src.idx !== targetIdx) {
                    var m = findMember(targetMid);
                    var mk = m && m.bossData[activeBossId].mocks[targetMockid];
                    if (mk) {
                        var temp = mk.team[src.idx];
                        mk.team[src.idx] = mk.team[targetIdx];
                        mk.team[targetIdx] = temp;
                        saveAndPush();
                        renderTable();
                    }
                }
            } catch(err) {}
        };
    });
    
    document.querySelectorAll('.add-mock-btn').forEach(function(el) {
        el.onclick = function() {
            var m = findMember(el.dataset.mid);
            if (m) {
                var mocks = m.bossData[activeBossId].mocks;
                var nextId = mocks.length > 0 ? Math.max.apply(null, mocks.map(function(mk) { return mk.id; })) + 1 : 0;
                mocks.push({ id: nextId, team: [null, null, null, null, null], damage: 0, isActual: false });
                saveAndPush();
                renderTable();
            }
        };
    });
}

function findMember(id) { return state.members.find(function(m){ return m.id===id; }); }

// Unit Modal
function openUnitModal() {
    document.getElementById('unit-modal').style.display = 'flex';
    document.getElementById('unit-search').value = '';
    document.getElementById('filter-mfr').value = 'all';
    document.getElementById('filter-burst').value = 'all';
    document.getElementById('filter-element').value = 'all';
    renderUnitGrid();
}
function closeUnitModal() {
    document.getElementById('unit-modal').style.display = 'none';
    activeSel = null;
}
function renderUnitGrid() {
    var grid = document.getElementById('unit-grid');
    var search = document.getElementById('unit-search').value.toLowerCase();
    var fMfr = document.getElementById('filter-mfr').value;
    var fBurst = document.getElementById('filter-burst').value;
    var fElem = document.getElementById('filter-element').value;
    grid.innerHTML = '';

    var clr = document.createElement('div');
    clr.className = 'u-card clear-card';
    clr.innerHTML = '✕ Clear Slot';
    clr.onclick = function(){ selectUnit(null); };
    grid.appendChild(clr);

    var rarityOrder = {SSR:0, SR:1, R:2};

    var filtered = NIKKE_UNITS.filter(function(u) {
        return (fMfr==='all' || u.manufacturer===fMfr) &&
               (fBurst==='all' || u.burst===fBurst) &&
               (fElem==='all' || u.element===fElem) &&
               (u.name.toLowerCase().includes(search) || u.manufacturer.toLowerCase().includes(search));
    }).sort(function(a,b){
        var rA = rarityOrder[a.rarity||'SSR'] ?? 0;
        var rB = rarityOrder[b.rarity||'SSR'] ?? 0;
        if (rA !== rB) return rA - rB;
        return a.name.localeCompare(b.name);
    });

    filtered.forEach(function(u) {
        var card = document.createElement('div');
        card.className = 'u-card elem-' + u.element.toLowerCase();
        var imgUrl = u.image || ('https://nikke.gg/wp-content/uploads/characters/icon/' + u.id + '.webp');
        var imgHtml = '<img src="'+imgUrl+'" onerror="this.src=\'https://nikke.gg/wp-content/uploads/characters/icon/'+u.id+'.png\';this.onerror=function(){this.style.display=\'none\';this.nextSibling.style.display=\'flex\';}" class="u-icon"><div class="u-icon-placeholder" style="display:none">?</div>';
        card.innerHTML = imgHtml + '<span class="u-cname">' + u.name + '</span>';
        card.title = u.manufacturer + ' | Burst ' + u.burst + ' | ' + u.element + (u.rarity?' | '+u.rarity:'');
        card.onclick = function(){ selectUnit(u.id); };
        grid.appendChild(card);
    });
}

function selectUnit(uid) {
    if (!activeSel) return;
    var m = findMember(activeSel.memberId);
    var mk = m && m.bossData[activeBossId].mocks[activeSel.mockId];
    if (!mk) return;
    if (uid && mk.team.includes(uid) && mk.team[activeSel.slotIdx] !== uid) {
        alert('This Nikke is already in the team!'); return;
    }
    mk.team[activeSel.slotIdx] = uid;
    saveAndPush();
    closeUnitModal();
    renderTable();
}

init();
