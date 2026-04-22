const fs = require('fs');
let content = fs.readFileSync('lib/movie-data.ts', 'utf8');

// Add originalLanguage: "en" after every genreIds line in FALLBACK_MOVIES
// The pattern is: genreIds: [...],\n  },
content = content.replace(/genreIds: (\[[^\]]+\]),\n  \}/g, 'genreIds: $1,\n    originalLanguage: "en",\n  }');

fs.writeFileSync('lib/movie-data.ts', content);
console.log('Done - added originalLanguage to fallback movies');
