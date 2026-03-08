/* ============================================================
   BLOG.JS — Article Loading, Search, and Rendering
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Determine which page we're on
  const blogGrid = document.getElementById('blogGrid');
  const articleBody = document.getElementById('articleBody');

  if (blogGrid) {
    loadBlogListing();
  }

  if (articleBody) {
    loadArticle();
  }
});

/* ---------- Blog Listing Page ---------- */
async function loadBlogListing() {
  const grid = document.getElementById('blogGrid');
  const searchInput = document.getElementById('blogSearch');
  const noResults = document.getElementById('noResults');

  try {
    const { data: articles, error } = await db
      .from('articles')
      .select('id,title,excerpt,tag,read_time,created_at')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Render all articles
    renderArticles(articles, grid);

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        const filtered = articles.filter(article =>
          article.title.toLowerCase().includes(query) ||
          article.excerpt.toLowerCase().includes(query) ||
          article.tag.toLowerCase().includes(query)
        );

        renderArticles(filtered, grid);

        if (noResults) {
          noResults.style.display = filtered.length === 0 ? 'block' : 'none';
        }
      });
    }
  } catch (error) {
    console.error('Failed to load articles:', error);
    grid.innerHTML = `
      <div class="no-results">
        <h3>Unable to load articles</h3>
        <p>Please check your connection and try again.</p>
      </div>
    `;
  }
}

/* ---------- Render Article Cards ---------- */
function renderArticles(articles, container) {
  container.innerHTML = articles.map(article => `
    <a href="article.html?id=${escapeHtml(article.id)}" class="blog-card reveal visible" id="card-${escapeHtml(article.id)}">
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span class="blog-card-tag">${escapeHtml(article.tag)}</span>
          <span class="blog-card-date">${formatDate(article.created_at)}</span>
        </div>
        <h2 class="blog-card-title">${escapeHtml(article.title)}</h2>
        <p class="blog-card-excerpt">${escapeHtml(article.excerpt)}</p>
        <span class="blog-card-link">Read article →</span>
      </div>
    </a>
  `).join('');
}

/* ---------- Individual Article Page ---------- */
async function loadArticle() {
  const articleHeader = document.getElementById('articleHeader');
  const articleBody = document.getElementById('articleBody');

  // Get article ID from URL
  const params = new URLSearchParams(window.location.search);
  const articleId = params.get('id');

  if (!articleId) {
    articleBody.innerHTML = '<p>Article not found. <a href="blog.html">Back to Blog</a></p>';
    return;
  }

  try {
    // Load article from Supabase
    const { data: article, error } = await db
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      articleBody.innerHTML = '<p>Article not found. <a href="blog.html">Back to Blog</a></p>';
      return;
    }

    // Update page title and meta
    document.title = `${article.title} — Charles Shalua`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', article.excerpt);

    // Render header
    if (articleHeader) {
      articleHeader.innerHTML = `
        <span class="blog-card-tag article-tag-header">${escapeHtml(article.tag)}</span>
        <h1 class="section-title">${escapeHtml(article.title)}</h1>
        <div class="article-meta article-meta-center">
          <span>${formatDate(article.created_at)}</span>
          <span>·</span>
          <span>${escapeHtml(article.read_time || '5 min read')}</span>
        </div>
      `;
    }

    // Render article content directly from the database field
    articleBody.innerHTML = article.content;

  } catch (error) {
    console.error('Failed to load article:', error);
    articleBody.innerHTML = '<p>Failed to load article content. <a href="blog.html">Back to Blog</a></p>';
  }
}

/* ---------- Utility: Format Date ---------- */
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

/* ---------- Utility: Escape HTML (XSS prevention) ---------- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
