class KnowledgeStorage {
    constructor() {
        this.storageKey = 'knowledgeData';
        this.publishedPagesKey = 'publishedPages';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.publishedPagesKey)) {
            localStorage.setItem(this.publishedPagesKey, JSON.stringify([]));
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getAllKnowledge() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (error) {
            console.error('Failed to get knowledge data:', error);
            return [];
        }
    }

    getKnowledgeById(id) {
        const knowledge = this.getAllKnowledge();
        return knowledge.find(item => item.id === id);
    }

    saveKnowledge(knowledgeData) {
        try {
            const knowledge = this.getAllKnowledge();
            const existingIndex = knowledge.findIndex(item => item.id === knowledgeData.id);

            if (existingIndex !== -1) {
                knowledge[existingIndex] = {
                    ...knowledge[existingIndex],
                    ...knowledgeData,
                    updatedAt: new Date().toISOString()
                };
            } else {
                const newKnowledge = {
                    id: this.generateId(),
                    ...knowledgeData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                knowledge.push(newKnowledge);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(knowledge));
            return knowledge[existingIndex] || knowledge[knowledge.length - 1];
        } catch (error) {
            console.error('Failed to save knowledge:', error);
            throw error;
        }
    }

    deleteKnowledge(id) {
        try {
            const knowledge = this.getAllKnowledge();
            const filtered = knowledge.filter(item => item.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(filtered));
            
            // 関連する公開ページも削除
            this.unpublishPage(id);
            return true;
        } catch (error) {
            console.error('Failed to delete knowledge:', error);
            return false;
        }
    }

    searchKnowledge(query, tag = '', sortBy = 'date-desc') {
        let knowledge = this.getAllKnowledge();

        // 検索フィルタ
        if (query) {
            query = query.toLowerCase();
            knowledge = knowledge.filter(item => 
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                (item.content && item.content.toLowerCase().includes(query)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }

        // タグフィルタ
        if (tag) {
            knowledge = knowledge.filter(item => 
                item.tags && item.tags.includes(tag)
            );
        }

        // ソート
        knowledge.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'date-desc':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                default:
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
        });

        return knowledge;
    }

    getAllTags() {
        const knowledge = this.getAllKnowledge();
        const tags = new Set();
        
        knowledge.forEach(item => {
            if (item.tags) {
                item.tags.forEach(tag => tags.add(tag));
            }
        });
        
        return Array.from(tags).sort();
    }

    getStatistics() {
        const knowledge = this.getAllKnowledge();
        const publishedPages = this.getPublishedPages();
        
        const lastUpdated = knowledge.length > 0 
            ? new Date(Math.max(...knowledge.map(k => new Date(k.updatedAt)))).toLocaleDateString('ja-JP')
            : '-';

        return {
            totalKnowledge: knowledge.length,
            publishedPages: publishedPages.length,
            lastUpdated: lastUpdated
        };
    }

    // 公開ページ管理
    getPublishedPages() {
        try {
            return JSON.parse(localStorage.getItem(this.publishedPagesKey)) || [];
        } catch (error) {
            console.error('Failed to get published pages:', error);
            return [];
        }
    }

    publishPage(knowledgeId, slug, htmlContent) {
        try {
            const publishedPages = this.getPublishedPages();
            const knowledge = this.getKnowledgeById(knowledgeId);
            
            if (!knowledge) {
                throw new Error('Knowledge not found');
            }

            const pageData = {
                id: this.generateId(),
                knowledgeId: knowledgeId,
                slug: slug,
                title: knowledge.title,
                htmlContent: htmlContent,
                publishedAt: new Date().toISOString(),
                url: `pages/${slug}.html`
            };

            // 既存の同じスラッグのページを削除
            const filtered = publishedPages.filter(page => page.slug !== slug);
            filtered.push(pageData);

            localStorage.setItem(this.publishedPagesKey, JSON.stringify(filtered));
            return pageData;
        } catch (error) {
            console.error('Failed to publish page:', error);
            throw error;
        }
    }

    unpublishPage(knowledgeId) {
        try {
            const publishedPages = this.getPublishedPages();
            const filtered = publishedPages.filter(page => page.knowledgeId !== knowledgeId);
            localStorage.setItem(this.publishedPagesKey, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Failed to unpublish page:', error);
            return false;
        }
    }

    getPublishedPageByKnowledgeId(knowledgeId) {
        const publishedPages = this.getPublishedPages();
        return publishedPages.find(page => page.knowledgeId === knowledgeId);
    }

    // データのエクスポート/インポート
    exportData() {
        return {
            knowledge: this.getAllKnowledge(),
            publishedPages: this.getPublishedPages(),
            exportedAt: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.knowledge) {
                localStorage.setItem(this.storageKey, JSON.stringify(data.knowledge));
            }
            if (data.publishedPages) {
                localStorage.setItem(this.publishedPagesKey, JSON.stringify(data.publishedPages));
            }
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    clearAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.publishedPagesKey);
        this.init();
    }
}

// グローバルインスタンス
window.knowledgeStorage = new KnowledgeStorage();