export const extensionToLanguage: { [key: string]: string } = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'java': 'java',
    'cs': 'csharp',
    'rb': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'go': 'go',
    'rs': 'rust',
    'htm': 'html',
    'html': 'html',
    'xml': 'xml',
    'css': 'css',
    'scss': 'scss',
    'less': 'less'
};

export const commentPatterns: { [key: string]: RegExp } = {
    'javascript': /\/\/.*|\/\*[\s\S]*?\*\//g,
    'typescript': /\/\/.*|\/\*[\s\S]*?\*\//g,
    'python': /#.*|'''[\s\S]*?'''|"""[\s\S]*?"""/g,
    'java': /\/\/.*|\/\*[\s\S]*?\*\//g,
    'c': /\/\/.*|\/\*[\s\S]*?\*\//g,
    'cpp': /\/\/.*|\/\*[\s\S]*?\*\//g,
    'csharp': /\/\/.*|\/\*[\s\S]*?\*\//g,
    'ruby': /#.*|=begin[\s\S]*?=end/g,
    'php': /\/\/.*|#.*|\/\*[\s\S]*?\*\//g,
    'swift': /\/\/.*|\/\*[\s\S]*?\*\//g,
    'go': /\/\/.*|\/\*[\s\S]*?\*\//g,
    'rust': /\/\/.*|\/\*[\s\S]*?\*\//g,
    'html': /<!--[\s\S]*?-->/g,
    'xml': /<!--[\s\S]*?-->/g,
    'css': /\/\*[\s\S]*?\*\//g,
    'scss': /\/\/.*|\/\*[\s\S]*?\*\//g,
    'less': /\/\/.*|\/\*[\s\S]*?\*\//g
};
