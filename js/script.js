var typed = new Typed(".typing" , {
    strings : ["Frontend Developer", "Software Developer", "Programmer", "Software Engineer"],
    typeSpeed : 100,
    BackSpeed : 60,
    loop:true
});

// Active Nav Link Functionality
const navLinks = document.querySelectorAll('.nav a');
const sections = document.querySelectorAll('.section');

// Function to remove active class from all links
function removeActiveClasses() {
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
}

// Add click event to nav links
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        removeActiveClasses();
        this.classList.add('active');
    });
});

// Add scroll event to highlight nav based on scroll position
window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

// Load Articles Dynamically
async function loadArticles() {
    try {
        const response = await fetch('js/articles.json');
        const articles = await response.json();
        const articlesContainer = document.getElementById('articles-container');
        
        articles.forEach(article => {
            const articleCard = document.createElement('div');
            articleCard.className = 'article-item padd-15';
            
            const platformClass = article.platformShort;
            
            // Platform icon images
            const devIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z"/></svg>`;
            
            const gfgIcon = `<img src="https://media.geeksforgeeks.org/gfg-gg-logo.svg" alt="GFG" width="20" height="20" style="filter: brightness(0) invert(1);">`;
            
            const platformIcon = platformClass === 'dev' ? devIcon : gfgIcon;
            
            articleCard.innerHTML = `
                <div class="article-card">
                    <span class="platform-badge ${platformClass}">
                        ${platformIcon}
                        <span>${article.platform}</span>
                    </span>
                    <h3>${article.title}</h3>
                    <p>${article.description}</p>
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-more">
                        Read article <i class="fa fa-arrow-right"></i>
                    </a>
                </div>
            `;
            
            articlesContainer.appendChild(articleCard);
        });
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

// Load articles when DOM is ready
document.addEventListener('DOMContentLoaded', loadArticles);