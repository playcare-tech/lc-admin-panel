const LIVECHAT_BASE = 'https://api.livechatinc.com/v3.5/configuration';
const HELPDESK_BASE = 'https://api.helpdesk.com/configuration'; // placeholder
const LOGS_URL = '/functions/logs';

let token = '';

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = document.getElementById('password').value;
    if (pass === 'admin') {
        document.getElementById('login').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        token = document.getElementById('token').value;
        loadData();
    } else {
        alert('Wrong password');
    }
});

async function loadData() {
    await loadAgents();
    await loadGroups();
    await loadLogs();
    await loadMemberships();
}

async function loadAgents() {
    try {
        const res = await fetch(`${LIVECHAT_BASE}/agents`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const agents = data.agents || data;
        const select = document.getElementById('agents');
        select.innerHTML = '';
        const deactivateSelect = document.getElementById('deactivateUser');
        deactivateSelect.innerHTML = '<option value="">Select user to deactivate</option>';
        agents.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.text = a.name || a.login;
            select.appendChild(opt);
            const opt2 = opt.cloneNode(true);
            deactivateSelect.appendChild(opt2);
        });
    } catch (e) {
        console.error(e);
    }
}

async function loadGroups() {
    try {
        const res = await fetch(`${LIVECHAT_BASE}/groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const groups = data.groups || data;
        const select = document.getElementById('groupsSelect');
        select.innerHTML = '';
        groups.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.text = g.name;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error(e);
    }
}

async function loadLogs() {
    try {
        const res = await fetch(LOGS_URL);
        const logs = await res.json();
        const tbody = document.getElementById('logsTable').querySelector('tbody');
        tbody.innerHTML = '';
        logs.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${l.timestamp}</td><td>${l.action}</td><td>${l.details}</td>`;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
    }
}

async function loadMemberships() {
    const agents = Array.from(document.getElementById('agents').options);
    const ul = document.getElementById('membershipList');
    ul.innerHTML = '';
    for (const opt of agents) {
        if (!opt.value) continue;
        try {
            const res = await fetch(`${LIVECHAT_BASE}/agents/${opt.value}/groups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const groups = data.groups || [];
            const li = document.createElement('li');
            li.textContent = `${opt.text}: ${groups.map(g => g.name).join(', ') || 'None'}`;
            ul.appendChild(li);
        } catch (e) {
            console.error(e);
        }
    }
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const platform = document.getElementById('platform').value;
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const base = platform === 'livechat' ? LIVECHAT_BASE : HELPDESK_BASE;
    try {
        const res = await fetch(`${base}/agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, login: email, role: 'agent' })
        });
        if (res.ok) {
            alert('User created');
            logAction('create_user', `Created ${name} on ${platform}`);
            loadAgents();
        } else {
            alert('Error creating user');
        }
    } catch (e) {
        console.error(e);
    }
});

document.getElementById('deactivateBtn').addEventListener('click', async () => {
    const id = document.getElementById('deactivateUser').value;
    if (!id) return;
    try {
        const res = await fetch(`${LIVECHAT_BASE}/agents/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'deactivated' })
        });
        if (res.ok) {
            alert('User deactivated');
            logAction('deactivate_user', `Deactivated agent ${id}`);
            loadAgents();
        } else {
            alert('Error deactivating user');
        }
    } catch (e) {
        console.error(e);
    }
});

document.getElementById('assignBtn').addEventListener('click', async () => {
    const selectedAgents = Array.from(document.getElementById('agents').selectedOptions).map(o => o.value);
    const selectedGroups = Array.from(document.getElementById('groupsSelect').selectedOptions).map(o => o.value);
    const priority = document.getElementById('priority').value;
    for (const agentId of selectedAgents) {
        for (const groupId of selectedGroups) {
            try {
                const res = await fetch(`${LIVECHAT_BASE}/groups/${groupId}/agents/${agentId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ priority })
                });
                if (res.ok) {
                    logAction('assign_group', `Assigned agent ${agentId} to group ${groupId} as ${priority}`);
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
    loadMemberships();
});

document.getElementById('unassignBtn').addEventListener('click', async () => {
    const selectedAgents = Array.from(document.getElementById('agents').selectedOptions).map(o => o.value);
    const selectedGroups = Array.from(document.getElementById('groupsSelect').selectedOptions).map(o => o.value);
    for (const agentId of selectedAgents) {
        for (const groupId of selectedGroups) {
            try {
                const res = await fetch(`${LIVECHAT_BASE}/groups/${groupId}/agents/${agentId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    logAction('unassign_group', `Unassigned agent ${agentId} from group ${groupId}`);
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
    loadMemberships();
});

async function logAction(action, details) {
    try {
        await fetch(LOGS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, details })
        });
        loadLogs();
    } catch (e) {
        console.error(e);
    }
}