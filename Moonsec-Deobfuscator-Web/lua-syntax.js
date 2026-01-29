class LuaSyntaxHighlighter {
    constructor() {
        this.keywords = new Set([
            'and', 'break', 'do', 'else', 'elseif', 'end',
            'false', 'for', 'function', 'goto', 'if', 'in',
            'local', 'nil', 'not', 'or', 'repeat', 'return',
            'then', 'true', 'until', 'while'
        ]);
        
        this.builtins = new Set([
            'assert', 'collectgarbage', 'dofile', 'error', 'getmetatable',
            'ipairs', 'load', 'loadfile', 'next', 'pairs', 'pcall',
            'print', 'rawequal', 'rawget', 'rawlen', 'rawset',
            'require', 'select', 'setmetatable', 'tonumber', 'tostring',
            'type', 'xpcall', '_G', '_VERSION'
        ]);
        
        this.patterns = [
            { regex: /--.*$/gm, class: 'comment' },
            { regex: /--\[\[[\s\S]*?\]\]/g, class: 'comment' },
            { regex: /(["'])(?:\\.|(?!\1).)*\1/g, class: 'string' },
            { regex: /\b(\d+\.?\d*|\.\d+)\b/g, class: 'number' },
            { regex: /[=+\-*/%^#<>~]|\.\.|\.\.\./g, class: 'operator' }
        ];
    }
    
    highlight(code) {
        let highlighted = this.escapeHTML(code);
        
        // Highlight keywords
        this.keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
        });
        
        // Highlight builtins
        this.builtins.forEach(builtin => {
            const regex = new RegExp(`\\b${builtin}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="builtin">${builtin}</span>`);
        });
        
        // Apply other patterns
        this.patterns.forEach(pattern => {
            highlighted = highlighted.replace(pattern.regex, `<span class="${pattern.class}">$&</span>`);
        });
        
        // Highlight function definitions
        highlighted = highlighted.replace(/\bfunction\b\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, 
            'function <span class="function">$1</span>');
        
        return `<code class="lua-code">${highlighted}</code>`;
    }
    
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
