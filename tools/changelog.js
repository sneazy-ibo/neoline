class GitHubChangelog {
  constructor({ owner = "sneazy-ibo", repo = "neoline" } = {}) {
    this.owner = owner;
    this.repo = repo;
    this.apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    this.commits = [];
    this.currentPage = 1;
    this.hasMore = true;
		
    this.init();
  }

  async init() {
    try {
      this.showChangelog();
      this.setupGitHubLink();
      this.showLoading();
      await this.fetchCommits();
      this.renderCommits();
    } catch (error) {
      console.error("Changelog Error:", error);
      this.showError(error.message);
    }
  }

  createCommitElement(commit) {
    const div = document.createElement('div');
    div.className = 'changelog-commit';
    
    const shortSha = commit.sha.substring(0, 7);
    const message = commit.message.split('\n')[0];
    const displayMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;

    div.innerHTML = `
      <div class="commit-avatar" style="--avatar-url: url('${commit.author.avatar}')">
        <img src="${commit.author.avatar}" alt="${commit.author.username}">
      </div>
      <div class="commit-content">
        <div class="commit-header">
          <div class="commit-message">${this.escapeHtml(displayMessage)}</div>
          <div class="commit-sha">${shortSha}</div>
        </div>
        <div class="commit-meta">
          <div class="commit-author">${this.escapeHtml(commit.author.username)}</div>
          <div class="commit-date">${this.formatDate(commit.date)}</div>
        </div>
      </div>
    `;

    this.setupClickHandlers(div, commit);
    return div;
  }

  setupClickHandlers(element, commit) {
    const avatar = element.querySelector('.commit-avatar');
    const author = element.querySelector('.commit-author');
    const message = element.querySelector('.commit-message');
    const sha = element.querySelector('.commit-sha');

    const openProfile = (e) => {
      e.stopPropagation();
      window.open(`https://github.com/${commit.author.username}`, '_blank');
    };

    const openCommit = (e) => {
      e.stopPropagation();
      window.open(commit.url, '_blank');
    };

    avatar.onclick = openProfile;
    author.onclick = openProfile;
    message.onclick = openCommit;
    sha.onclick = openCommit;
    element.onclick = openCommit;
  }

  setupGitHubLink() {
    const githubIcon = document.querySelector('.github-icon');
    if (githubIcon) {
      githubIcon.onclick = () => window.open(`https://github.com/${this.owner}/${this.repo}`, '_blank');
    }
  }

  showChangelog() {
    const container = document.getElementById('changelog-container');
    if (container) {
      container.style.display = 'block';
      container.offsetHeight;
      container.classList.add('show');
    }
  }

  hideChangelog() {
    const container = document.getElementById('changelog-container');
    if (container) {
      container.classList.remove('show');
      setTimeout(() => container.style.display = 'none', 500);
    }
  }

  showLoading() {
    this.setContainerContent(`
      <div class="changelog-loading">
        <div class="loading-spinner"></div>
        <p>Loading commits...</p>
      </div>
    `);
  }

  async fetchCommits(page = 1) {
    const response = await fetch(`${this.apiUrl}/commits?page=${page}&per_page=30`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const commits = await response.json();
    const processed = commits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        avatar: commit.author?.avatar_url || 'https://github.com/identicons/default.png',
        username: commit.author?.login || commit.commit.author.name
      },
      date: new Date(commit.commit.author.date),
      url: commit.html_url
    }));

    this.commits = page === 1 ? processed : [...this.commits, ...processed];
    this.hasMore = commits.length === 30;
    return this.commits;
  }

  renderCommits() {
    const container = document.getElementById('changelog-commits');
    if (!container) return;

    container.innerHTML = '';
    this.commits.forEach(commit => container.appendChild(this.createCommitElement(commit)));
    
    if (this.hasMore) {
      container.appendChild(this.createLoadMoreButton());
    }
  }

  createLoadMoreButton() {
    const button = document.createElement('button');
    button.className = 'changelog-load-more';
    button.textContent = 'Load More Commits';
    button.onclick = () => this.loadMore();
    return button;
  }

  async loadMore() {
    if (!this.hasMore) return;

    const btn = document.querySelector('.changelog-load-more');
    this.setButtonState(btn, 'Loading...', true);

    try {
      await this.fetchCommits(++this.currentPage);
      this.renderCommits();
    } catch (error) {
      console.error("Load more error:", error);
      this.setButtonState(btn, 'Error - Retry', false);
    }
  }

  setButtonState(button, text, disabled) {
    if (button) {
      button.textContent = text;
      button.disabled = disabled;
    }
  }

  showError(message) {
    this.setContainerContent(`
      <div class="changelog-error">
        <h3>Error Loading Commits</h3>
        <p>${this.escapeHtml(message)}</p>
        <button onclick="changelog.init()">Retry</button>
      </div>
    `);
  }

  setContainerContent(html) {
    const container = document.getElementById('changelog-commits');
    if (container) container.innerHTML = html;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(date) {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}

const changelog = new GitHubChangelog();