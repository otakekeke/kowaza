class KnowledgeApp {
    constructor() {
        this.storage = window.knowledgeStorage;
        this.currentFilter = {
            search: '',
            tag: '',
            sort: 'date-desc'
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
        this.updateStatistics();
        this.loadTags();
    }

    bindEvents() {
        // 新規作成ボタン
        document.getElementById('newKnowledgeBtn').addEventListener('click', () => {
            this.showCreateModal();
        });

        // モーダル関連
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideCreateModal();
        });

        document.getElementById('cancelCreate').addEventListener('click', () => {
            this.hideCreateModal();
        });

        document.getElementById('createForm').addEventListener('submit', (e) => {
            this.handleCreate(e);
        });

        // 検索・フィルター
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilter.search = e.target.value;
            this.debounce(() => this.loadData(), 300)();
        });

        document.getElementById('tagFilter').addEventListener('change', (e) => {
            this.currentFilter.tag = e.target.value;
            this.loadData();
        });

        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.currentFilter.sort = e.target.value;
            this.loadData();
        });

        // モーダルの背景クリックで閉じる
        document.getElementById('createModal').addEventListener('click', (e) => {
            if (e.target.id === 'createModal') {
                this.hideCreateModal();
            }
        });
    }

    showCreateModal() {
        document.getElementById('createModal').classList.remove('hidden');
        document.getElementById('knowledgeTitle').focus();
    }

    hideCreateModal() {
        document.getElementById('createModal').classList.add('hidden');
        document.getElementById('createForm').reset();
    }

    handleCreate(e) {
        e.preventDefault();
        
        const title = document.getElementById('knowledgeTitle').value.trim();
        const description = document.getElementById('knowledgeDescription').value.trim();
        const tagsInput = document.getElementById('knowledgeTags').value.trim();
        
        if (!title) {
            alert('タイトルを入力してください。');
            return;
        }

        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        
        const knowledgeData = {
            title: title,
            description: description,
            tags: tags,
            content: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen p-8">
    <div class="max-w-4xl mx-auto">
        <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">${title}</h1>
            <p class="text-gray-600">${description}</p>
        </header>
        
        <main class="bg-white rounded-lg shadow p-6">
            <p>ここにコンテンツを追加してください...</p>
        </main>
    </div>
</body>
</html>`
        };

        try {
            const savedKnowledge = this.storage.saveKnowledge(knowledgeData);
            this.hideCreateModal();
            this.loadData();
            this.updateStatistics();
            this.loadTags();
            
            // エディタページに移動
            window.location.href = `editor.html?id=${savedKnowledge.id}`;
        } catch (error) {
            console.error('Failed to create knowledge:', error);
            alert('知見の作成に失敗しました。');
        }
    }

    loadData() {
        const knowledge = this.storage.searchKnowledge(
            this.currentFilter.search,
            this.currentFilter.tag,
            this.currentFilter.sort
        );

        this.renderKnowledgeList(knowledge);
    }

    renderKnowledgeList(knowledge) {
        const container = document.getElementById('knowledgeList');
        const emptyState = document.getElementById('emptyState');

        if (knowledge.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.innerHTML = knowledge.map(item => this.createKnowledgeCard(item)).join('');
    }

    createKnowledgeCard(knowledge) {
        const publishedPage = this.storage.getPublishedPageByKnowledgeId(knowledge.id);
        const isPublished = !!publishedPage;
        
        const tagsHtml = knowledge.tags ? 
            knowledge.tags.map(tag => `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${this.escapeHtml(tag)}</span>`).join('') : '';

        const publishedBadge = isPublished ? 
            `<span class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                <i class="fas fa-globe mr-1"></i>公開中
            </span>` : '';

        const publishedUrl = isPublished ? 
            `<div class="mt-2">
                <a href="${publishedPage.url}" target="_blank" class="text-sm text-blue-600 hover:text-blue-800">
                    <i class="fas fa-external-link-alt mr-1"></i>${publishedPage.url}
                </a>
            </div>` : '';

        return `
            <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-lg font-semibold text-gray-900 flex-1">${this.escapeHtml(knowledge.title)}</h3>
                    <div class="flex items-center space-x-2 ml-4">
                        ${publishedBadge}
                        <div class="flex space-x-1">
                            <button onclick="app.editKnowledge('${knowledge.id}')" 
                                    class="p-2 text-gray-500 hover:text-blue-600 transition-colors" title="編集">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="app.deleteKnowledge('${knowledge.id}')" 
                                    class="p-2 text-gray-500 hover:text-red-600 transition-colors" title="削除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <p class="text-gray-600 mb-3">${this.escapeHtml(knowledge.description || '')}</p>
                
                <div class="flex flex-wrap gap-2 mb-3">
                    ${tagsHtml}
                </div>
                
                <div class="flex justify-between items-center text-sm text-gray-500">
                    <span>作成: ${this.formatDate(knowledge.createdAt)}</span>
                    <span>更新: ${this.formatDate(knowledge.updatedAt)}</span>
                </div>
                
                ${publishedUrl}
            </div>
        `;
    }

    editKnowledge(id) {
        window.location.href = `editor.html?id=${id}`;
    }

    deleteKnowledge(id) {
        const knowledge = this.storage.getKnowledgeById(id);
        if (!knowledge) return;

        if (confirm(`「${knowledge.title}」を削除しますか？この操作は取り消せません。`)) {
            if (this.storage.deleteKnowledge(id)) {
                this.loadData();
                this.updateStatistics();
                this.loadTags();
            } else {
                alert('削除に失敗しました。');
            }
        }
    }

    updateStatistics() {
        const stats = this.storage.getStatistics();
        document.getElementById('totalKnowledge').textContent = stats.totalKnowledge;
        document.getElementById('publishedPages').textContent = stats.publishedPages;
        document.getElementById('lastUpdated').textContent = stats.lastUpdated;
    }

    loadTags() {
        const tags = this.storage.getAllTags();
        const tagFilter = document.getElementById('tagFilter');
        const currentValue = tagFilter.value;
        
        tagFilter.innerHTML = '<option value="">全てのタグ</option>';
        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            if (tag === currentValue) {
                option.selected = true;
            }
            tagFilter.appendChild(option);
        });
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.app = new KnowledgeApp();
});