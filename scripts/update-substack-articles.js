const fs = require('fs');
const path = require('path');

const RSS_FEED_URL = 'https://aryanshourie.substack.com/feed';
const ARTICLES_JSON_PATH = path.join(__dirname, '..', 'js', 'articles.json');

async function fetchSubstackArticles() {
    // Use native fetch with browser-like headers
    const response = await fetch(RSS_FEED_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    
    // Parse RSS XML manually
    const articles = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];
        
        const title = extractTag(itemContent, 'title');
        const link = extractTag(itemContent, 'link');
        const description = extractTag(itemContent, 'description');
        
        if (title && link) {
            articles.push({
                title: cleanText(title),
                description: cleanDescription(description || 'Read more on Substack.'),
                platform: 'Substack',
                platformShort: 'substack',
                url: link.trim()
            });
        }
    }

    return articles;
}

function extractTag(content, tagName) {
    // Handle CDATA sections
    const cdataRegex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i');
    const cdataMatch = content.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1];

    // Handle regular tags
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = content.match(regex);
    return match ? match[1] : null;
}

function cleanText(text) {
    return text
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
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
