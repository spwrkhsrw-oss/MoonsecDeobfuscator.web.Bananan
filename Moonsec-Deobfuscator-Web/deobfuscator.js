class MoonsecDeobfuscator {
    constructor() {
        this.version = '1.0.0';
        this.stats = {
            processingTime: 0,
            layersRemoved: 0,
            stringsDecoded: 0
        };
        
        this.settings = {
            autoFormat: true,
            extractStrings: true,
            removeJunk: true,
            highlightSyntax: true,
            aggressiveMode: false
        };
        
        this.patterns = {
            // Base64 patterns
            base64: [
                /frombase64\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/gi,
                /loadstring\s*\(\s*frombase64\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)\s*\)/gi,
                /Base64Decode\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/gi,
                /atob\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/gi
            ],
            
            // Loadstring patterns
            loadstring: [
                /loadstring\s*\(([^)]+)\)/gi,
                /load\s*\(([^)]+)\)/gi,
                /assert\s*\(\s*loadstring\s*\(([^)]+)\)\s*\)/gi
            ],
            
            // String concatenation
            stringConcat: [
                /(["'])([^"']*?)\s*\.\.\s*(["'])([^"']*?)\1/gi,
                /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(["'])([^"']*?)\s*\.\./gi
            ],
            
            // Hex encoding
            hexStrings: [
                /\\x[0-9a-fA-F]{2}/g,
                /["'](?:\\x[0-9a-fA-F]{2})+["']/g
            ],
            
            // Character code arrays
            charCodes: [
                /string\.char\(([^)]+)\)/gi,
                /({[\d\s,]+})/g
            ],
            
            // Junk code patterns
            junkCode: [
                /local\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*function\s*\(\s*\)\s*end\s*[^;]*;/gi,
                /--\[\[[^\]]*\]\]/g,
                /\/\*.*?\*\//gs
            ]
        };
    }
    
    // Update settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
    
    // Main deobfuscation function
    deobfuscate(code) {
        const startTime = performance.now();
        this.resetStats();
        
        try {
            let result = code;
            let layers = [];
            
            // Layer 1: Remove comments and whitespace
            if (this.settings.removeJunk) {
                result = this.removeComments(result);
                result = this.removeExtraWhitespace(result);
                layers.push({ name: 'Comments/Whitespace', count: 1 });
            }
            
            // Layer 2: Decode base64
            const base64Results = this.extractBase64(result);
            if (base64Results.length > 0) {
                result = this.decodeBase64InCode(result);
                layers.push({ name: 'Base64 Decoding', count: base64Results.length });
                this.stats.stringsDecoded += base64Results.length;
            }
            
            // Layer 3: Resolve string concatenation
            const concatResults = this.resolveStringConcatenation(result);
            if (concatResults.modified) {
                result = concatResults.code;
                layers.push({ name: 'String Concatenation', count: concatResults.count });
            }
            
            // Layer 4: Extract loadstring
            const loadstringResults = this.extractLoadstring(result);
            if (loadstringResults.found) {
                result = loadstringResults.code;
                layers.push({ name: 'Loadstring Extraction', count: loadstringResults.count });
            }
            
            // Layer 5: Decode hex strings
            const hexResults = this.decodeHexStrings(result);
            if (hexResults.modified) {
                result = hexResults.code;
                layers.push({ name: 'Hex Decoding', count: hexResults.count });
            }
            
            // Layer 6: Remove junk code
            if (this.settings.removeJunk) {
                const junkResults = this.removeJunkCode(result);
                if (junkResults.modified) {
                    result = junkResults.code;
                    layers.push({ name: 'Junk Code Removal', count: junkResults.count });
                }
            }
            
            // Layer 7: Beautify code
            if (this.settings.autoFormat) {
                result = this.beautifyLua(result);
                layers.push({ name: 'Code Formatting', count: 1 });
            }
            
            // Calculate processing time
            this.stats.processingTime = performance.now() - startTime;
            this.stats.layersRemoved = layers.length;
            
            return {
                success: true,
                deobfuscatedCode: result,
                originalCode: code,
                statistics: {
                    ...this.stats,
                    layers: layers,
                    originalLength: code.length,
                    finalLength: result.length,
                    reduction: ((code.length - result.length) / code.length * 100).toFixed(2)
                },
                warnings: [],
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: this.version
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                deobfuscatedCode: code,
                statistics: this.stats
            };
        }
    }
    
    // Analyze code without deobfuscating
    analyze(code) {
        const analysis = {
            length: code.length,
            lines: code.split('\n').length,
            hasLoadstring: false,
            hasBase64: false,
            hasHex: false,
            hasConcatenation: false,
            hasJunkCode: false,
            obfuscationLevel: 'low',
            patternsFound: [],
            estimatedTime: 'instant'
        };
        
        // Check for patterns
        analysis.hasLoadstring = this.patterns.loadstring.some(pattern => pattern.test(code));
        analysis.hasBase64 = this.patterns.base64.some(pattern => pattern.test(code));
        analysis.hasHex = this.patterns.hexStrings.some(pattern => pattern.test(code));
        analysis.hasConcatenation = code.includes('..');
        analysis.hasJunkCode = this.patterns.junkCode.some(pattern => {
            const matches = code.match(pattern);
            return matches && matches.length > 3;
        });
        
        // Count pattern occurrences
        this.patterns.base64.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) analysis.patternsFound.push(`Base64: ${matches.length}`);
        });
        
        // Determine obfuscation level
        let score = 0;
        if (analysis.hasLoadstring) score += 2;
        if (analysis.hasBase64) score += 2;
        if (analysis.hasHex) score += 1;
        if (analysis.hasConcatenation && code.split('..').length > 10) score += 1;
        if (analysis.hasJunkCode) score += 2;
        
        if (score >= 5) {
            analysis.obfuscationLevel = 'high';
            analysis.estimatedTime = 'moderate';
        } else if (score >= 2) {
            analysis.obfuscationLevel = 'medium';
            analysis.estimatedTime = 'fast';
        } else {
            analysis.obfuscationLevel = 'low';
            analysis.estimatedTime = 'instant';
        }
        
        // Calculate complexity
        analysis.complexity = this.calculateComplexity(code);
        
        return analysis;
    }
    
    // Helper methods
    resetStats() {
        this.stats = {
            processingTime: 0,
            layersRemoved: 0,
            stringsDecoded: 0
        };
    }
    
    decodeBase64(str) {
        try {
            // Add padding if needed
            str = str.replace(/\s/g, '');
            while (str.length % 4 !== 0) {
                str += '=';
            }
            return decodeURIComponent(atob(str).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch (e) {
            return str;
        }
    }
    
    extractBase64(code) {
        const results = [];
        this.patterns.base64.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const base64Match = match.match(/([A-Za-z0-9+/=]{20,})/);
                    if (base64Match) {
                        results.push({
                            match: match,
                            encoded: base64Match[1],
                            decoded: this.decodeBase64(base64Match[1])
                        });
                    }
                });
            }
        });
        return results;
    }
    
    decodeBase64InCode(code) {
        let result = code;
        this.patterns.base64.forEach(pattern => {
            result = result.replace(pattern, (match, encoded) => {
                const decoded = this.decodeBase64(encoded);
                return `"${decoded.replace(/"/g, '\\"')}"`;
            });
        });
        return result;
    }
    
    resolveStringConcatenation(code) {
        let modified = false;
        let count = 0;
        let result = code;
        
        // Simple concatenation: "a" .. "b"
        result = result.replace(/["']([^"']*)["']\s*\.\.\s*["']([^"']*)["']/g, (match, part1, part2) => {
            modified = true;
            count++;
            return `"${part1}${part2}"`;
        });
        
        // Multiple concatenations
        result = result.replace(/(["'][^"']*["'])(?:\s*\.\.\s*(["'][^"']*["']))+/g, (match) => {
            modified = true;
            count++;
            const parts = match.split(/\s*\.\.\s*/);
            const combined = parts.map(part => part.slice(1, -1)).join('');
            return `"${combined}"`;
        });
        
        return { code: result, modified, count };
    }
    
    extractLoadstring(code) {
        let result = code;
        let found = false;
        let count = 0;
        
        this.patterns.loadstring.forEach(pattern => {
            result = result.replace(pattern, (match, content) => {
                found = true;
                count++;
                // Try to evaluate the content if it's a simple string
                try {
                    // Remove quotes and get the actual string
                    const cleanContent = content.trim();
                    if ((cleanContent.startsWith('"') && cleanContent.endsWith('"')) ||
                        (cleanContent.startsWith("'") && cleanContent.endsWith("'"))) {
                        return cleanContent.slice(1, -1);
                    }
                } catch (e) {
                    // If we can't evaluate, just return the content
                }
                return content;
            });
        });
        
        return { code: result, found, count };
    }
    
    decodeHexStrings(code) {
        let result = code;
        let modified = false;
        let count = 0;
        
        // Decode \x41\x42 patterns
        result = result.replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
            modified = true;
            count++;
            return String.fromCharCode(parseInt(hex, 16));
        });
        
        // Decode hex strings in quotes
        result = result.replace(/["']((?:\\x[0-9a-fA-F]{2})+)+["']/g, (match) => {
            modified = true;
            count++;
            const hexSequence = match.slice(1, -1);
            return `"${hexSequence.replace(/\\x([0-9a-fA-F]{2})/g, (m, hex) => 
                String.fromCharCode(parseInt(hex, 16)))}"`;
        });
        
        return { code: result, modified, count };
    }
    
    removeJunkCode(code) {
        let result = code;
        let modified = false;
        let count = 0;
        
        this.patterns.junkCode.forEach(pattern => {
            result = result.replace(pattern, (match) => {
                modified = true;
                count++;
                return '';
            });
        });
        
        return { code: result.trim(), modified, count };
    }
    
    removeComments(code) {
        // Remove single line comments
        let result = code.replace(/--.*$/gm, '');
        // Remove multi-line comments
        result = result.replace(/--\[\[[\s\S]*?\]\]/g, '');
        return result;
    }
    
    removeExtraWhitespace(code) {
        // Remove multiple empty lines
        return code.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    }
    
    beautifyLua(code) {
        const lines = code.split('\n');
        let indentLevel = 0;
        const result = [];
        
        const indentKeywords = ['function', 'if', 'for', 'while', 'repeat'];
        const outdentKeywords = ['end', 'until', 'else', 'elseif'];
        
        for (let line of lines) {
            line = line.trim();
            if (!line) {
                result.push('');
                continue;
            }
            
            // Check if line should outdent
            if (outdentKeywords.some(keyword => line.startsWith(keyword))) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // Add line with proper indentation
            result.push('    '.repeat(indentLevel) + line);
            
            // Check if line should increase indent
            if (line.endsWith('then') || line.endsWith('do') || 
                indentKeywords.some(keyword => line.includes(keyword + ' '))) {
                indentLevel++;
            }
        }
        
        return result.join('\n');
    }
    
    calculateComplexity(code) {
        let score = 0;
        
        // Score based on various complexity factors
        score += code.split('..').length * 0.1;
        score += (code.match(/loadstring/gi) || []).length * 2;
        score += (code.match(/frombase64/gi) || []).length * 1.5;
        score += (code.match(/function/gi) || []).length * 0.5;
        score += (code.match(/local/gi) || []).length * 0.2;
        
        if (score > 10) return 'very-high';
        if (score > 5) return 'high';
        if (score > 2) return 'medium';
        return 'low';
    }
    
    // Batch processing
    batchProcess(files) {
        const results = [];
        const total = files.length;
        
        for (let i = 0; i < files.length; i++) {
            try {
                const result = this.deobfuscate(files[i].content);
                results.push({
                    filename: files[i].name,
                    success: result.success,
                    statistics: result.statistics,
                    error: result.error
                });
            } catch (error) {
                results.push({
                    filename: files[i].name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return {
            total,
            processed: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }
}

// Create global instance
window.MoonsecDeobfuscator = new MoonsecDeobfuscator();
