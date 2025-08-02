class KnowledgeEditor {
    constructor() {
        this.storage = window.knowledgeStorage;
        this.currentKnowledge = null;
        this.editor = null;
        this.autoSaveTimer = null;
        this.isPreviewMode = false;
        this.init();
    }

    init() {
        this.loadKnowledgeFromUrl();
        this.initEditor();
        this.bindEvents();
        this.startAutoSave();
    }

    loadKnowledgeFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
            this.currentKnowledge = this.storage.getKnowledgeById(id);
            if (this.currentKnowledge) {
                document.getElementById('pageTitle').textContent = this.currentKnowledge.title;
            } else {
                alert('指定された知見が見つかりません。');
                window.location.href = 'index.html';
                return;
            }
        } else {
            alert('知見IDが指定されていません。');
            window.location.href = 'index.html';
            return;
        }
    }

    initEditor() {
        const textarea = document.getElementById('htmlEditor');
        
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: 'htmlmixed',
            theme: 'default',
            lineNumbers: true,
            lineWrapping: true,
            autoCloseTags: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            indentWithTabs: false,
            extraKeys: {
                'Ctrl-S': () => this.saveKnowledge(),
                'Cmd-S': () => this.saveKnowledge(),
                'F11': () => this.toggleFullscreen(),
                'Esc': () => this.exitFullscreen()
            }
        });

        // 既存のコンテンツを読み込み
        if (this.currentKnowledge && this.currentKnowledge.content) {
            this.editor.setValue(this.currentKnowledge.content);
        }

        // エディタの変更を監視
        this.editor.on('change', () => {
            this.updatePreview();
            this.markAsModified();
        });

        // 初期プレビュー
        this.updatePreview();
    }

    bindEvents() {
        // テーマ変更
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.editor.setOption('theme', e.target.value);
        });

        // 保存ボタン
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveKnowledge();
        });

        // 公開ボタン
        document.getElementById('publishBtn').addEventListener('click', () => {
            this.showPublishModal();
        });

        // プレビュー切り替え
        document.getElementById('previewToggle').addEventListener('click', () => {
            this.togglePreviewMode();
        });

        // プレビュー更新
        document.getElementById('refreshPreview').addEventListener('click', () => {
            this.updatePreview();
        });

        // フルスクリーンプレビュー
        document.getElementById('fullscreenPreview').addEventListener('click', () => {
            this.showFullscreenPreview();
        });

        document.getElementById('closeFullscreen').addEventListener('click', () => {
            this.hideFullscreenPreview();
        });

        // 公開モーダル
        document.getElementById('cancelPublish').addEventListener('click', () => {
            this.hidePublishModal();
        });

        document.getElementById('confirmPublish').addEventListener('click', () => {
            this.publishPage();
        });

        // スラッグ入力でプレビューURL更新
        document.getElementById('pageSlug').addEventListener('input', (e) => {
            const slug = e.target.value;
            document.getElementById('previewUrl').textContent = `pages/${slug}.html`;
        });

        // モーダルの背景クリックで閉じる
        document.getElementById('publishModal').addEventListener('click', (e) => {
            if (e.target.id === 'publishModal') {
                this.hidePublishModal();
            }
        });

        document.getElementById('fullscreenModal').addEventListener('click', (e) => {
            if (e.target.id === 'fullscreenModal') {
                this.hideFullscreenPreview();
            }
        });

        // ページ離脱時の確認
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveKnowledge();
            }
        });
    }

    updatePreview() {
        const content = this.editor.getValue();
        const iframe = document.getElementById('previewFrame');
        const fullscreenFrame = document.getElementById('fullscreenFrame');
        
        // セキュアなプレビュー用にsrcDocを使用
        iframe.srcdoc = content;
        fullscreenFrame.srcdoc = content;
    }

    togglePreviewMode() {
        const editorSection = document.getElementById('editorSection');
        const previewSection = document.getElementById('previewSection');
        const toggleBtn = document.getElementById('previewToggle');
        
        if (this.isPreviewMode) {
            // エディタモードに戻す
            editorSection.classList.remove('hidden');
            editorSection.classList.add('w-1/2');
            previewSection.classList.add('w-1/2');
            previewSection.classList.remove('w-full');
            toggleBtn.innerHTML = '<i class="fas fa-eye mr-2"></i>プレビュー';
            this.isPreviewMode = false;
        } else {
            // プレビューのみモード
            editorSection.classList.add('hidden');
            editorSection.classList.remove('w-1/2');
            previewSection.classList.remove('w-1/2');
            previewSection.classList.add('w-full');
            toggleBtn.innerHTML = '<i class="fas fa-code mr-2"></i>エディタ';
            this.isPreviewMode = true;
        }
    }

    showFullscreenPreview() {
        document.getElementById('fullscreenModal').classList.remove('hidden');
        this.updatePreview();
    }

    hideFullscreenPreview() {
        document.getElementById('fullscreenModal').classList.add('hidden');
    }

    saveKnowledge() {
        if (!this.currentKnowledge) return;

        try {
            const updatedKnowledge = {
                ...this.currentKnowledge,
                content: this.editor.getValue()
            };

            this.currentKnowledge = this.storage.saveKnowledge(updatedKnowledge);
            this.markAsSaved();
            this.showMessage('保存しました', 'success');
        } catch (error) {
            console.error('Failed to save knowledge:', error);
            this.showMessage('保存に失敗しました', 'error');
        }
    }

    showPublishModal() {
        if (!this.currentKnowledge) return;

        // 既存の公開ページがあるかチェック
        const publishedPage = this.storage.getPublishedPageByKnowledgeId(this.currentKnowledge.id);
        const slugInput = document.getElementById('pageSlug');
        
        if (publishedPage) {
            slugInput.value = publishedPage.slug;
        } else {
            // タイトルからスラッグを生成
            const slug = this.generateSlug(this.currentKnowledge.title);
            slugInput.value = slug;
        }
        
        // プレビューURL更新
        document.getElementById('previewUrl').textContent = `pages/${slugInput.value}.html`;
        
        document.getElementById('publishModal').classList.remove('hidden');
        slugInput.focus();
    }

    hidePublishModal() {
        document.getElementById('publishModal').classList.add('hidden');
        document.getElementById('pageSlug').value = '';
    }

    publishPage() {
        const slug = document.getElementById('pageSlug').value.trim();
        
        if (!slug) {
            alert('スラッグを入力してください。');
            return;
        }

        if (!/^[a-z0-9-_]+$/i.test(slug)) {
            alert('スラッグは英数字、ハイフン、アンダースコアのみ使用できます。');
            return;
        }

        try {
            const htmlContent = this.editor.getValue();
            const pageData = this.storage.publishPage(this.currentKnowledge.id, slug, htmlContent);
            
            // 実際のファイルを生成
            this.generatePageFile(pageData);
            
            this.hidePublishModal();
            this.showMessage('ページを公開しました', 'success');
        } catch (error) {
            console.error('Failed to publish page:', error);
            this.showMessage('公開に失敗しました', 'error');
        }
    }

    generatePageFile(pageData) {
        // GitHub Pages用にpagesディレクトリにファイルを作成
        // ブラウザではファイルシステムにアクセスできないため、
        // ダウンロード形式で提供
        const blob = new Blob([pageData.htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pageData.slug}.html`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // 説明メッセージを表示
        setTimeout(() => {
            alert(`ファイル「${pageData.slug}.html」をダウンロードしました。\npagesディレクトリにアップロードしてください。`);
        }, 100);
    }

    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // 特殊文字を除去
            .replace(/\s+/g, '-') // スペースをハイフンに
            .replace(/-+/g, '-') // 連続するハイフンを単一に
            .trim('-'); // 前後のハイフンを除去
    }

    startAutoSave() {
        // 5分ごとに自動保存
        this.autoSaveTimer = setInterval(() => {
            if (this.hasUnsavedChanges()) {
                this.saveKnowledge();
            }
        }, 300000);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    markAsModified() {
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>保存*';
    }

    markAsSaved() {
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
        saveBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        saveBtn.innerHTML = '<i class="fas fa-check mr-2"></i>保存済み';
        
        setTimeout(() => {
            saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>保存';
        }, 2000);
    }

    hasUnsavedChanges() {
        if (!this.currentKnowledge || !this.editor) return false;
        return this.editor.getValue() !== this.currentKnowledge.content;
    }

    showMessage(text, type = 'success') {
        const messageId = type === 'success' ? 'successMessage' : 'errorMessage';
        const textId = type === 'success' ? 'successText' : 'errorText';
        
        document.getElementById(textId).textContent = text;
        document.getElementById(messageId).classList.remove('hidden');
        
        setTimeout(() => {
            document.getElementById(messageId).classList.add('hidden');
        }, 3000);
    }

    destroy() {
        this.stopAutoSave();
        if (this.editor) {
            this.editor.toTextArea();
        }
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new KnowledgeEditor();
});

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (window.editor) {
        window.editor.destroy();
    }
});