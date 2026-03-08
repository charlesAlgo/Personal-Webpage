/* ============================================================
   ADMIN.JS — Dashboard Logic
   ============================================================ */

const SUPABASE_URL     = 'https://oqgybwucpuiqniytmiby.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hb2sbUi_9dAaXJPX13lppg_2J8j9P6A';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   AUTH GUARD
   ============================================================ */
(async function authGuard() {
  const { data } = await db.auth.getSession();
  if (!data.session) {
    window.location.href = 'login.html';
  }
})();

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  document.getElementById('articleModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modalSaveBtn').addEventListener('click', saveArticle);

  switchTab('messages');
});

/* ============================================================
   LOGOUT
   ============================================================ */
async function handleLogout() {
  await db.auth.signOut();
  window.location.href = 'login.html';
}

/* ============================================================
   TAB SWITCHING
   ============================================================ */
let currentTab = 'messages';

function switchTab(tab) {
  currentTab = tab;

  document.getElementById('tabBtnMessages').classList.toggle('active', tab === 'messages');
  document.getElementById('tabBtnArticles').classList.toggle('active', tab === 'articles');

  if (tab === 'messages') {
    loadMessages();
  } else {
    loadArticles();
  }
}

/* ============================================================
   MESSAGES TAB
   ============================================================ */
async function loadMessages() {
  const container = document.getElementById('tabContent');
  container.innerHTML = renderLoading();

  const { data: contacts, error } = await db
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = renderError('Failed to load messages: ' + error.message);
    return;
  }

  const unread = contacts.filter(c => !c.read).length;
  updateUnreadBadge(unread);

  if (contacts.length === 0) {
    container.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <span class="admin-card-title">Messages</span>
        </div>
        ${renderEmpty('No messages yet', 'Contact form submissions will appear here.')}
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <span class="admin-card-title">Messages</span>
        <span style="color:var(--text-muted);font-size:0.85rem;">${contacts.length} total · ${unread} unread</span>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table" id="messagesTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="messagesBody"></tbody>
        </table>
      </div>
    </div>
  `;

  renderMessageRows(contacts);
}

function renderMessageRows(contacts) {
  const tbody = document.getElementById('messagesBody');
  if (!tbody) return;

  tbody.innerHTML = contacts.map(c => `
    <tr data-id="${c.id}" class="${c.read ? '' : 'font-bold'}" onclick="toggleMessage('${c.id}')">
      <td style="${!c.read ? 'font-weight:600;' : ''}">${escapeHtml(c.name)}</td>
      <td class="muted">${escapeHtml(c.email)}</td>
      <td class="muted">${escapeHtml(c.subject || '—')}</td>
      <td class="muted" style="white-space:nowrap;">${formatDate(c.created_at)}</td>
      <td>
        <span class="badge ${c.read ? 'badge-read' : 'badge-unread'}">
          ${c.read ? 'Read' : 'Unread'}
        </span>
      </td>
      <td onclick="event.stopPropagation()">
        <div class="actions-cell">
          ${!c.read ? `<button class="btn btn-ghost btn-sm" onclick="markRead('${c.id}')">Mark Read</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteContact('${c.id}')">Delete</button>
        </div>
      </td>
    </tr>
    <tr id="expand-${c.id}" style="display:none;" class="expanded-row">
      <td colspan="6">
        <div class="expanded-message">${escapeHtml(c.message)}</div>
      </td>
    </tr>
  `).join('');
}

function toggleMessage(id) {
  const expandRow = document.getElementById(`expand-${id}`);
  if (!expandRow) return;
  const isVisible = expandRow.style.display !== 'none';
  expandRow.style.display = isVisible ? 'none' : 'table-row';

  // Mark as read when opened
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (row && row.querySelector('.badge-unread')) {
    markRead(id, true);
  }
}

async function markRead(id, silent = false) {
  const { error } = await db
    .from('contacts')
    .update({ read: true })
    .eq('id', id);

  if (!error && !silent) {
    loadMessages();
  } else if (!error) {
    // Update UI inline
    const badge = document.querySelector(`tr[data-id="${id}"] .badge`);
    if (badge) {
      badge.className = 'badge badge-read';
      badge.textContent = 'Read';
    }
    const markBtn = document.querySelector(`tr[data-id="${id}"] .actions-cell .btn-ghost`);
    if (markBtn) markBtn.remove();
    // Update unread count
    const currentBadge = document.getElementById('unreadBadge');
    if (currentBadge) {
      const n = parseInt(currentBadge.textContent, 10) - 1;
      updateUnreadBadge(n);
    }
  }
}

async function deleteContact(id) {
  if (!confirm('Delete this message? This cannot be undone.')) return;

  const { error } = await db
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Failed to delete: ' + error.message);
    return;
  }

  loadMessages();
}

function updateUnreadBadge(count) {
  const badge = document.getElementById('unreadBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

/* ============================================================
   ARTICLES TAB
   ============================================================ */
let articlesCache = [];

async function loadArticles() {
  const container = document.getElementById('tabContent');
  container.innerHTML = renderLoading();

  const { data: articles, error } = await db
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = renderError('Failed to load articles: ' + error.message);
    return;
  }

  articlesCache = articles;

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <span class="admin-card-title">Articles</span>
        <button class="btn btn-primary btn-sm" onclick="openNewArticle()">+ New Article</button>
      </div>
      <div class="admin-table-wrap">
        ${articles.length === 0
          ? renderEmpty('No articles yet', 'Create your first article using the button above.')
          : `<table class="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Tag</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${articles.map(a => `
                  <tr>
                    <td>
                      <div class="truncate" title="${escapeHtml(a.title)}">${escapeHtml(a.title)}</div>
                    </td>
                    <td><span class="tag-text">${escapeHtml(a.tag || '—')}</span></td>
                    <td>
                      <span class="badge ${a.published ? 'badge-published' : 'badge-draft'}">
                        ${a.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td class="muted" style="white-space:nowrap;">${formatDate(a.created_at)}</td>
                    <td onclick="event.stopPropagation()">
                      <div class="actions-cell">
                        <button class="btn btn-ghost btn-sm" onclick="openEditArticle('${escapeHtml(a.id)}')">Edit</button>
                        <button class="btn btn-ghost btn-sm" onclick="togglePublished('${escapeHtml(a.id)}', ${a.published})">
                          ${a.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteArticle('${escapeHtml(a.id)}')">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`
        }
      </div>
    </div>
  `;
}

async function togglePublished(id, currentState) {
  const { error } = await db
    .from('articles')
    .update({ published: !currentState, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert('Failed to update: ' + error.message);
    return;
  }

  loadArticles();
}

async function deleteArticle(id) {
  if (!confirm('Delete this article? This cannot be undone.')) return;

  const { error } = await db
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Failed to delete: ' + error.message);
    return;
  }

  loadArticles();
}

/* ============================================================
   ARTICLE EDITOR MODAL
   ============================================================ */
let editingArticleId = null;

function openNewArticle() {
  editingArticleId = null;
  document.getElementById('modalTitle').textContent = 'New Article';
  document.getElementById('articleForm').reset();
  document.getElementById('fieldId').disabled = false;
  openModal();
}

function openEditArticle(id) {
  const article = articlesCache.find(a => a.id === id);
  if (!article) return;

  editingArticleId = id;
  document.getElementById('modalTitle').textContent = 'Edit Article';

  // Populate fields
  document.getElementById('fieldId').value         = article.id;
  document.getElementById('fieldId').disabled      = true;
  document.getElementById('fieldTitle').value      = article.title || '';
  document.getElementById('fieldExcerpt').value    = article.excerpt || '';
  document.getElementById('fieldTag').value        = article.tag || '';
  document.getElementById('fieldReadTime').value   = article.read_time || '';
  document.getElementById('fieldContent').value    = article.content || '';
  document.getElementById('fieldPublished').checked = !!article.published;

  openModal();
}

function openModal() {
  document.getElementById('articleModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('articleModal').classList.add('hidden');
  document.body.style.overflow = '';
  editingArticleId = null;
}

async function saveArticle() {
  const form = document.getElementById('articleForm');
  const saveBtn = document.getElementById('modalSaveBtn');

  const id       = document.getElementById('fieldId').value.trim();
  const title    = document.getElementById('fieldTitle').value.trim();
  const excerpt  = document.getElementById('fieldExcerpt').value.trim();
  const tag      = document.getElementById('fieldTag').value.trim();
  const readTime = document.getElementById('fieldReadTime').value.trim();
  const content  = document.getElementById('fieldContent').value;
  const published = document.getElementById('fieldPublished').checked;

  if (!id) { alert('Slug / ID is required.'); return; }
  if (!title) { alert('Title is required.'); return; }

  const payload = {
    id,
    title,
    excerpt,
    tag,
    read_time: readTime || '5 min read',
    content,
    published,
    updated_at: new Date().toISOString()
  };

  // For new articles, include created_at
  if (!editingArticleId) {
    payload.created_at = new Date().toISOString();
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  const { error } = await db
    .from('articles')
    .upsert([payload], { onConflict: 'id' });

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Article';

  if (error) {
    alert('Failed to save article: ' + error.message);
    return;
  }

  closeModal();
  loadArticles();
}

/* ============================================================
   UTILITIES
   ============================================================ */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function renderLoading() {
  return `<div class="admin-loading"><div class="spinner"></div> Loading…</div>`;
}

function renderError(msg) {
  return `<div class="admin-alert admin-alert-error">${escapeHtml(msg)}</div>`;
}

function renderEmpty(title, desc) {
  return `
    <div class="admin-empty">
      <div class="admin-empty-icon">📭</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(desc)}</p>
    </div>
  `;
}
