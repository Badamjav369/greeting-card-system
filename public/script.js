//const API_BASE = 'https://greeting-card-system.onrender.com/api';
//const API_BASE = 'http://localhost:3001/api';
// const API_BASE = 'http://localhost:3001/api';
const API_BASE = window.location.origin + '/api';



let editingGreetingId = null;

const form = {
    senderName: document.getElementById('senderName'),
    senderEmail: document.getElementById('senderEmail'),
    recipientName: document.getElementById('recipientName'),
    occasion: document.getElementById('occasion'),
    message: document.getElementById('message')
};

const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const cancelBtn = document.getElementById('cancelBtn');
const statusMessage = document.getElementById('statusMessage');
const greetingsList = document.getElementById('greetingsList');
const refreshBtn = document.getElementById('refreshBtn');

const occasions = {
    birthday: '🎂 Төрсөн өдөр',
    anniversary: '💑 Ойн баяр',
    congratulations: '🎉 Баяр хүргэе',
    thank_you: '🙏 Баярлалаа',
    get_well: '🌸 Эдгээрэй',
    holiday: '🎄 Баярын мэнд'
};

document.addEventListener('DOMContentLoaded', () => {
    loadGreetings();
    setupEventListeners();
});

function setupEventListeners() {
    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', cancelEdit);
    refreshBtn.addEventListener('click', loadGreetings);
}

function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
    
    setTimeout(() => {
        statusMessage.className = 'status-message';
    }, 5000);
}

function validateForm() {
    const errors = [];

    if (!form.senderName.value.trim()) {
        errors.push('Илгээгчийн нэр шаардлагатай');
    }

    if (!form.senderEmail.value.trim()) {
        errors.push('Илгээгчийн имэйл шаардлагатай');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.senderEmail.value.trim())) {
            errors.push('Имэйл хаяг буруу байна');
        }
    }

    if (!form.recipientName.value.trim()) {
        errors.push('Хүлээн авагчийн нэр шаардлагатай');
    }

    if (!form.message.value.trim()) {
        errors.push('Мэндчилгээ бичих шаардлагатай');
    }

    return errors;
}

async function handleSubmit() {
    const errors = validateForm();
    
    if (errors.length > 0) {
        showStatus(errors.join(', '), true);
        return;
    }

    const greetingData = {
        senderName: form.senderName.value.trim(),
        senderEmail: form.senderEmail.value.trim(),
        recipientName: form.recipientName.value.trim(),
        occasion: form.occasion.value,
        message: form.message.value.trim()
    };

    submitBtn.disabled = true;
    btnText.textContent = editingGreetingId ? '⏳ Шинэчилж байна...' : '⏳ Илгээж байна...';

    try {
        const url = editingGreetingId 
            ? `${API_BASE}/greeting/${editingGreetingId}`
            : `${API_BASE}/greetings`;
        
        const method = editingGreetingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(greetingData)
        });

        const data = await response.json();

        if (data.success) {
            showStatus(
                editingGreetingId 
                    ? '✅ Мэндчилгээ амжилттай шинэчлэгдлээ! Имэйл мэдэгдэл илгээгдлээ.'
                    : '✅ Мэндчилгээ амжилттай илгээгдлээ! Имэйл мэдэгдэл илгээгдлээ.',
                false
            );
            resetForm();
            loadGreetings();
        } else {
            showStatus(`❌ Алдаа: ${data.error}`, true);
        }
    } catch (error) {
        console.error('Мэндчилгээ илгээхэд алдаа гарлаа:', error);
        showStatus('❌ Мэндчилгээ илгээхэд алдаа гарлаа. Сервер ажиллаж байгаа эсэхийг шалгана уу.', true);
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = editingGreetingId ? '📝 Мэндчилгээ шинэчлэх' : '✉️ Мэндчилгээ илгээх';
    }
}

async function loadGreetings() {
    greetingsList.innerHTML = '<div class="loading">Мэндчилгээнүүдийг ачааллаж байна...</div>';

    try {
        const response = await fetch(`${API_BASE}/greetings`);
        const data = await response.json();

        if (data.success && data.greetings) {
            displayGreetings(data.greetings);
        } else {
            greetingsList.innerHTML = '<div class="empty-state"><h3>Мэндчилгээ байхгүй байна</h3><p>Эхний мэндчилгээгээ үүсгээрэй!</p></div>';
        }
    } catch (error) {
        console.error('Мэндчилгээнүүдийг ачааллахад алдаа гарлаа:', error);
        greetingsList.innerHTML = '<div class="empty-state"><h3>⚠️ Алдаа гарлаа</h3><p>Сервер ажиллаж байгаа эсэхийг шалгана уу.</p></div>';
    }
}

function displayGreetings(greetings) {
    if (greetings.length === 0) {
        greetingsList.innerHTML = '<div class="empty-state"><h3>📭 Мэндчилгээ байхгүй байна</h3><p>Дээрх формыг ашиглан эхний мэндчилгээгээ үүсгээрэй!</p></div>';
        return;
    }

    greetings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const html = greetings.map(greeting => `
        <div class="greeting-item ${greeting.occasion}">
            <div class="greeting-occasion">${occasions[greeting.occasion] || '🎉 Мэндчилгээ'}</div>
            <div class="greeting-recipient">Хэнд: ${escapeHtml(greeting.recipientName)}</div>
            <div class="greeting-sender">Хэнээс: ${escapeHtml(greeting.senderName)}</div>
            <div class="greeting-date">${formatDate(greeting.createdAt)}</div>
            <div class="greeting-message-preview">${escapeHtml(greeting.message)}</div>
            <div class="greeting-actions">
                <button class="btn btn-small" onclick="viewGreeting('${greeting.id}')">👁️ Үзэх</button>
                <button class="btn btn-small" onclick="editGreeting('${greeting.id}')">✏️ Засах</button>
                <button class="btn btn-small" onclick="deleteGreeting('${greeting.id}')">🗑️ Устгах</button>
            </div>
        </div>
    `).join('');

    greetingsList.innerHTML = html;
}

function viewGreeting(id) {
    window.location.href = `view.html?id=${id}`;
}

async function editGreeting(id) {
    try {
        const response = await fetch(`${API_BASE}/greeting/${id}`);
        const data = await response.json();

        if (data.success && data.greeting) {
            const greeting = data.greeting;
            
            form.senderName.value = greeting.senderName;
            form.senderEmail.value = greeting.senderEmail;
            form.recipientName.value = greeting.recipientName;
            form.occasion.value = greeting.occasion;
            form.message.value = greeting.message;

            editingGreetingId = id;
            formTitle.textContent = '📝 Мэндчилгээний карт засах';
            btnText.textContent = '📝 Мэндчилгээ шинэчлэх';
            cancelBtn.style.display = 'inline-flex';

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showStatus('❌ Мэндчилгээ ачааллахад алдаа гарлаа', true);
        }
    } catch (error) {
        console.error('Мэндчилгээ ачааллахад алдаа гарлаа:', error);
        showStatus('❌ Мэндчилгээ ачааллахад алдаа гарлаа', true);
    }
}

async function deleteGreeting(id) {
    if (!confirm('Та энэ мэндчилгээний картыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/greeting/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showStatus('✅ Мэндчилгээ амжилттай устгагдлаа', false);
            loadGreetings();
        } else {
            showStatus(`❌ Алдаа: ${data.error}`, true);
        }
    } catch (error) {
        console.error('Мэндчилгээ устгахад алдаа гарлаа:', error);
        showStatus('❌ Мэндчилгээ устгахад алдаа гарлаа', true);
    }
}

function cancelEdit() {
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    form.senderName.value = '';
    form.senderEmail.value = '';
    form.recipientName.value = '';
    form.occasion.value = 'birthday';
    form.message.value = '';

    editingGreetingId = null;
    formTitle.textContent = 'Шинэ мэндчилгээний карт үүсгэх';
    btnText.textContent = '✉️ Мэндчилгээ илгээх';
    cancelBtn.style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
```

## ✅ Бэлэн боллоо!

Одоо browser дээр шинэчилээд үзнэ үү:
```