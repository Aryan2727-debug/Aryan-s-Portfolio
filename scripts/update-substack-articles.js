const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const RSS_FEED_URL = 'https://aryanshourie.substack.com/feed';
const ARTICLES_JSON_PATH = path.join(__dirname, '..', 'js', 'articles.json');

async function fetchSubstackArticles() {
    const parser = new Parser({
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0; +https://www.aryanshourie.dev)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        timeout: 10000
    });
    const feed = await parser.parseURL(RSS_FEED_URL);
    
    return feed.items.map(item => ({
        title: item.title,
        description: item.contentSnippet 
            ? item.contentSnippet.substring(0, 150).trim() + '...'
            : item.content 
                ? item.content.replace(/<[^>]*>/g, '').substring(0, 150).trim() + '...'
                : 'Read more on Substack.',
        platform: 'Substack',
        platformShort: 'substack',
        url: item.link
    }));
}

function cleanDescription(description) {
    // Remove HTML tags, normalize whitespace, and limit length
    let cleaned = description
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Limit to ~150 chars and add ellipsis if needed
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
