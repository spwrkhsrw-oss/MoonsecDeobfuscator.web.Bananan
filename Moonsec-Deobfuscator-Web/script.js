class MoonsecDeobfuscatorUI {
    constructor() {
        this.deobfuscator = window.MoonsecDeobfuscator;
        this.currentTheme = 'dark';
        this.currentSession = null;
        
        this.initElements();
        this.bindEvents();
        this.loadSettings();
        this.loadExampleCode();
        this.initTheme();
    }
    
    initElements() {
        // Core elements
        this.inputCode = document.getElementById('inputCode');
        this.outputCode = document.getElementById('outputCode');
        this.deobfuscateBtn = document.getElementById('deobfuscateBtn');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.copyOutput = document.getElementById('copyOutput');
        this.downloadOutput = document.getElementById('downloadOutput');
        
        // Stats elements
        this.charCount = document.getElementById('charCount');
        this.lineCount = document.getElementById('lineCount');
        this.outputCharCount = document.getElementById('outputCharCount');
        this.outputLineCount = document.getElementById('outputLineCount');
        this.processingTime = document.getElementById('processingTime');
        
        // Modal elements
        this.loadingModal = document.getElementById('loadingModal');
        this.instructionsModal = document.getElementById('instructionsModal');
        this.batchModal = document.getElementById('batchModal');
        
        // Other UI elements
        this.analysisResults = document.getElementById('analysisResults');
        this.analysisContent = document.getElementById('analysisContent');
        this.settingsPanel = document.getElementById('settingsPanel');
        
        // Initialize syntax highlighter
        this.syntaxHighlighter = new LuaSyntaxHighlighter();
    }
    
    bindEvents() {
        // Input events
        this.inputCode.addEventListener('input', () => this.updateInputStats());
        this.inputCode.addEventListener('keydown', (e) => this.handleTabKey(e));
        
        // Button events
        this.deobfuscateBtn.addEventListener('click', () => this.deobfuscate());
        this.analyzeBtn.addEventListener('click', () => this.analyze());
        this.copyOutput.addEventListener('click', () => this.copyToClipboard());
        this.downloadOutput.addEventListener('click', () => this.downloadOutputFile());
        
        // Example and clear
        document.getElementById('loadExample').addEventListener('click', () => this.loadExampleCode());
        document.getElementById('clearInput').addEventListener('click', () => this.clearInput());
        document.getElementById('pasteFromClipboard').addEventListener('click', () => this.pasteFromClipboard());
        
        // Analysis
        document.getElementById('closeAnalysis').addEventListener('click', () => {
            this.analysisResults.style.display = 'none';
        });
        
        // Settings
        document.getElementById('toggleSettings').addEventListener('click', () => {
            this.settingsPanel.style.display = 
                this.settingsPanel.style.display === 'none' ? 'block' : 'none';
        });
        
        // Settings checkboxes
        document.getElementById('autoFormat').addEventListener('change', (e) => {
            this.updateSetting('autoFormat', e.target.checked);
        });
        document.getElementById('extractStrings').addEventListener('change', (e) => {
            this.updateSetting('extractStrings', e.target.checked);
        });
        document.getElementById('removeJunk').addEventListener('change', (e) => {
            this.updateSetting('removeJunk', e.target.checked);
        });
        document.getElementById('highlightSyntax').addEventListener('change', (e) => {
            this.updateSetting('highlightSyntax', e.target.checked);
        });
        
        // Theme toggle
        document.getElementById('toggleTheme').addEventListener('click', () => this.toggleTheme());
        
        // Save session
        document.getElementById('saveSession').addEventListener('click', () => this.saveSession());
        
        // Batch processing
        document.getElementById('batchProcess').addEventListener('click', () => this.openBatchModal());
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Help and instructions
        document.getElementById('toggleInstructions').addEventListener('click', () => {
            this.instructionsModal.style.display = 'block';
        });
        
        // Report issue
        document.getElementById('reportIssue').addEventListener('click', (e) => {
            e.preventDefault();
            this.reportIssue();
        });
        
        // File drag and drop
        const fileDropArea = document.getElementById('fileDropArea');
        const fileInput = document.getElementById('fileInput');
        
        fileDropArea.addEventListener('click', () => fileInput.click());
        fileDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropArea.classList.add('dragover');
        });
        fileDropArea.addEventListener('dragleave', () => {
            fileDropArea.classList.remove('dragover');
        });
        fileDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropArea.classList.remove('dragover');
            this.handleDroppedFiles(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
    }
    
    updateInputStats() {
        const text = this.inputCode.value;
        this.charCount.textContent = `${text.length} characters`;
        this.lineCount.textContent = `${text.split('\n').length} lines`;
    }
    
    updateOutputStats(stats = null) {
        const text = this.outputCode.textContent;
        this.outputCharCount.textContent = `${text.length} characters`;
        this.outputLineCount.textContent = `${text.split('\n').length} lines`;
        
        if (stats && stats.processingTime) {
            this.processingTime.textContent = `${Math.round(stats.processingTime)}ms`;
        }
    }
    
    async deobfuscate() {
        const code = this.inputCode.value.trim();
        
        if (!code) {
            this.showToast('Please enter some Lua code to deobfuscate', 'warning');
            return;
        }
        
        this.showLoading('Deobfuscating code...');
        
        setTimeout(() => {
            try {
                const result = this.deobfuscator.deobfuscate(code);
                
                if (result.success) {
                    // Display deobfuscated code
                    let displayCode = result.deobfuscatedCode;
                    
                    // Apply syntax highlighting if enabled
                    if (this.deobfuscator.settings.highlightSyntax) {
                        displayCode = this.syntaxHighlighter.highlight(displayCode);
                        this.outputCode.innerHTML = displayCode;
                    } else {
                        this.outputCode.textContent = displayCode;
                    }
                    
                    // Enable output buttons
                    this.copyOutput.disabled = false;
                    this.downloadOutput.disabled = false;
                    
                    // Update stats
                    this.updateOutputStats(result.statistics);
                    
                    // Store current session
                    this.currentSession = {
                        original: code,
                        deobfuscated: result.deobfuscatedCode,
                        stats: result.statistics,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Show statistics toast
                    this.showToast(
                        `Deobfuscation successful! Removed ${result.statistics.layersRemoved} layers in ${Math.round(result.statistics.processingTime)}ms`,
                        'success'
                    );
                    
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Deobfuscation error:', error);
                this.outputCode.textContent = `// Error during deobfuscation:\n// ${error.message}\n\n${code}`;
                this.showToast(`Error: ${error.message}`, 'error');
            } finally {
                this.hideLoading();
            }
        }, 100); // Small delay for smooth UI
    }
    
    analyze() {
        const code = this.inputCode.value.trim();
        
        if (!code) {
            this.showToast('Please enter some Lua code to analyze', 'warning');
            return;
        }
        
        const analysis = this.deobfuscator.analyze(code);
        
        // Display analysis results
        this.analysisContent.innerHTML = `
            <div class="analysis-item">
                <div class="analysis-label">Obfuscation Level</div>
                <div class="analysis-value ${analysis.obfuscationLevel}">
                    ${analysis.obfuscationLevel.toUpperCase()}
                </div>
            </div>
            <div class="analysis-item">
                <div class="analysis-label">Code Size</div>
                <div class="analysis-value">${analysis.length} chars, ${analysis.lines} lines</div>
            </div>
            <div class="analysis-item">
                <div class="analysis-label">Complexity</div>
                <div class="analysis-value">${analysis.complexity.replace('-', ' ')}</div>
            </div>
            <div class="analysis-item">
                <div class="analysis-label">Estimated Time</div>
                <div class="analysis-value">${analysis.estimatedTime}</div>
            </div>
            <div class="analysis-item full-width">
                <div class="analysis-label">Patterns Detected</div>
                <div class="analysis-patterns">
                    ${analysis.hasLoadstring ? '<span class="pattern-tag">Loadstring</span>' : ''}
                    ${analysis.hasBase64 ? '<span class="pattern-tag">Base64</span>' : ''}
                    ${analysis.hasHex ? '<span class="pattern-tag">Hex Encoding</span>' : ''}
                    ${analysis.hasConcatenation ? '<span class="pattern-tag">Concatenation</span>' : ''}
                    ${analysis.hasJunkCode ? '<span class="pattern-tag">Junk Code</span>' : ''}
                    ${analysis.patternsFound.length === 0 ? '<span class="pattern-tag">None detected</span>' : ''}
                </div>
            </div>
        `;
        
        this.analysisResults.style.display = 'block';
        this.showToast('Analysis complete', 'info');
    }
    
    async copyToClipboard() {
        const text = this.outputCode.textContent;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Code copied to clipboard!', 'success');
        } catch (err) {
            this.showToast('Failed to copy code', 'error');
        }
    }
    
    downloadOutputFile() {
        const text = this.outputCode.textContent;
        const blob = new Blob([text], { type: 'text/x-lua' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `deobfuscated_${Date.now()}.lua`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('File downloaded successfully', 'success');
    }
    
    loadExampleCode() {
        const examples = [
            `-- Example 1: Base64 encoded loadstring
local encoded = "bG9hZHN0cmluZygiYXBwID0ge30="
local decoded = frombase64(encoded)
loadstring(decoded)()`,
            
            `-- Example 2: String concatenation
local a = "lo"
local b = "ad"
local c = "st"
local d = "ring"
local func = a .. b .. c .. d
local code = "print('Hello World')"
loadstring(func)(code)`,
            
            `-- Example 3: Hex encoded strings
local str = "\\x48\\x65\\x6c\\x6c\\x6f\\x20\\x57\\x6f\\x72\\x6c\\x64"
print(str)`,
            
            `-- Example 4: Complex Moonsec pattern
local _G = _G or getfenv()
local function x()
    return function() 
        local a = "bG9h"
        local b = "ZHN0"
        local c = "cmlu"
        local d = "Zygp"
        return frombase64(a..b..c..d)
    end
end
loadstring(x()())()`
        ];
        
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        this.inputCode.value = randomExample;
        this.updateInputStats();
        this.showToast('Example code loaded', 'info');
    }
    
    clearInput() {
        this.inputCode.value = '';
        this.outputCode.textContent = '';
        this.updateInputStats();
        this.updateOutputStats();
        this.copyOutput.disabled = true;
        this.downloadOutput.disabled = true;
        this.analysisResults.style.display = 'none';
        this.showToast('Editors cleared', 'info');
    }
    
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            this.inputCode.value = text;
            this.updateInputStats();
            this.showToast('Pasted from clipboard', 'success');
        } catch (err) {
            this.showToast('Unable to read clipboard', 'error');
        }
    }
    
    handleTabKey(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.inputCode.selectionStart;
            const end = this.inputCode.selectionEnd;
            
            // Insert 4 spaces
            this.inputCode.value = this.inputCode.value.substring(0, start) +
                '    ' + this.inputCode.value.substring(end);
            
            // Move cursor
            this.inputCode.selectionStart = this.inputCode.selectionEnd = start + 4;
        }
    }
    
    updateSetting(key, value) {
        this.deobfuscator.updateSettings({ [key]: value });
        localStorage.setItem(`moonsec_${key}`, value);
        this.showToast(`Setting updated: ${key}`, 'info');
    }
    
    loadSettings() {
        const settings = ['autoFormat', 'extractStrings', 'removeJunk', 'highlightSyntax'];
        settings.forEach(key => {
            const value = localStorage.getItem(`moonsec_${key}`);
            if (value !== null) {
                const checkbox = document.getElementById(key);
                if (checkbox) {
                    checkbox.checked = value === 'true';
                    this.deobfuscator.updateSettings({ [key]: value === 'true' });
                }
            }
        });
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('moonsec_theme') || 'dark';
        this.setTheme(savedTheme);
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        localStorage.setItem('moonsec_theme', newTheme);
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        
        const themeIcon = document.querySelector('#toggleTheme i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        this.showToast(`Switched to ${theme} theme`, 'info');
    }
    
    saveSession() {
        if (!this.currentSession) {
            this.showToast('No session to save', 'warning');
            return;
        }
        
        const sessionData = {
            ...this.currentSession,
            settings: this.deobfuscator.settings
        };
        
        const dataStr = JSON.stringify(sessionData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `moonsec_session_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Session saved', 'success');
    }
    
    openBatchModal() {
        this.batchModal.style.display = 'block';
    }
    
    async handleFileSelect(files) {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        
        for (let file of files) {
            if (!file.name.endsWith('.lua') && !file.name.endsWith('.txt')) {
                continue;
            }
            
            const content = await this.readFile(file);
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <i class="fas fa-file-code"></i>
                <span>${file.name} (${Math.round(file.size / 1024)} KB)</span>
                <button class="remove-file" data-name="${file.name}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileList.appendChild(item);
            
            // Store file data
            file.content = content;
        }
        
        // Enable process button if files exist
        document.getElementById('processBatch').disabled = fileList.children.length === 0;
    }
    
    async handleDroppedFiles(files) {
        await this.handleFileSelect(files);
    }
    
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    showLoading(message = 'Processing...') {
        const messageEl = document.getElementById('loadingMessage');
        if (messageEl) messageEl.textContent = message;
        this.loadingModal.style.display = 'flex';
    }
    
    hideLoading() {
        this.loadingModal.style.display = 'none';
    }
    
    closeAllModals() {
        this.loadingModal.style.display = 'none';
        this.instructionsModal.style.display = 'none';
        this.batchModal.style.display = 'none';
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
    
    reportIssue() {
        const url = 'https://github.com/YOUR_USERNAME/Moonsec-Deobfuscator-Web/issues/new';
        window.open(url, '_blank');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MoonsecDeobfuscatorUI();
});
