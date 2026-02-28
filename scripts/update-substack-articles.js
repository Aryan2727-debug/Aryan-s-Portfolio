const fs = require('fs');
const path = require('path');

// Use RSS2JSON proxy service (free tier: 10,000 requests/month)
const SUBSTACK_FEED = 'https://aryanshourie.substack.com/feed';
const RSS2JSON_API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(SUBSTACK_FEED)}`;
const ARTICLES_JSON_PATH = path.join(__dirname, '..', 'js', 'articles.json');

async function fetchSubstackArticles() {
    console.log('Using RSS2JSON proxy service...');
    
    const response = await fetch(RSS2JSON_API, {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status !== 'ok') {
        throw new Error(`RSS2JSON error: ${data.message || 'Unknown error'}`);
    }

    console.log(`RSS2JSON returned ${data.items.length} items`);

    return data.items.map(item => ({
        title: cleanText(item.title),
        description: cleanDescription(item.description || item.content || 'Read more on Substack.'),
        platform: 'Substack',
        platformShort: 'substack',
        url: item.link
    }));
}

function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanDescription(description) {
    let cleaned = cleanText(description);
    
    if (cleaned.length > 150) {
        cleaned = cleaned.substring(0, 147).trim() + '...';
    }
    
    return cleaned;
}

async function updateArticles() {
    try {
        console.log('Fetching Substack RSS feed...');
        const substackArticles = await fetchSubstackArticles();
        console.log(`Found ${substackArticles.length} articles in RSS feed`);
        
        // Read existing articles
        const existingArticles = JSON.parse(fs.readFileSync(ARTICLES_JSON_PATH, 'utf-8'));
        console.log(`Existing articles.json has ${existingArticles.length} articles`);
        
        // Get existing Substack URLs for comparison
        const existingSubstackUrls = new Set(
            existingArticles
                .filter(a => a.platformShort === 'substack')
                .map(a => a.url)
        );
        
        // Find new articles not already in the list
        const newArticles = substackArticles.filter(
            article => !existingSubstackUrls.has(article.url)
        );
        
        if (newArticles.length === 0) {
            console.log('No new Substack articles found.');
            return;
        }
        
        console.log(`Found ${newArticles.length} new article(s):`);
        newArticles.forEach(a => console.log(`  - ${a.title}`));
        
        // Separate existing articles by platform
        const existingSubstack = existingArticles.filter(a => a.platformShort === 'substack');
        const existingOthers = existingArticles.filter(a => a.platformShort !== 'substack');
        
        // Merge: new Substack articles first, then existing Substack, then others
        const updatedArticles = [
            ...newArticles,
            ...existingSubstack,
            ...existingOthers
        ];
        
        // Write updated articles
        fs.writeFileSync(
            ARTICLES_JSON_PATH, 
            JSON.stringify(updatedArticles, null, 2) + '\n',
            'utf-8'
        );
        
        console.log(`Successfully updated articles.json with ${newArticles.length} new article(s)`);
        
    } catch (error) {
        console.error('Error updating articles:', error);
        process.exit(1);
    }
}

updateArticles();
