const fs = require('fs');
let content = fs.readFileSync('lib/movie-data.ts', 'utf8');

content = content.replace(/originalLanguage: "en",\n  \}/g, 'originalLanguage: "en",\n    popularity: 0,\n  }');

fs.writeFileSync('lib/movie-data.ts', content);
console.log('Done - added popularity to fallback movies');
