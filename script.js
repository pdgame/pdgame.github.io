// ================= GLOBAL INIT =================
document.getElementById('year').textContent = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", async () => {
  const info = await fetchCompanyInfo();

  // ================= BRAND & SEO =================
  const siteTitle = info.title || `${info.name} - Play Free Online Games | 1000+ Browser Games`;
  document.title = siteTitle;
  
  // Update meta description dynamically
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && info.description) {
    metaDesc.setAttribute("content", info.description);
  }
  
  document.querySelectorAll(".company-name").forEach(el => el.textContent = info.name);
  document.querySelectorAll(".company-owner").forEach(el => el.textContent = info.company);
  document.querySelectorAll(".company-logo").forEach(c => {
    c.innerHTML = `<img src="${info.logo}" alt="${info.name} Logo - Free Online Games Portal" class="logo-img">`;
  });

  // Favicon
  if (info.favicon) {
    const fav = document.createElement("link");
    fav.rel = "icon"; fav.href = info.favicon; fav.type = "image/png";
    document.head.appendChild(fav);
  }

  // ================= SOCIALS =================
  const socials = info.socials || {};
  const socialContainer = document.querySelector(".footer-socials");
  socialContainer.innerHTML = "";
  const iconCDN = {
    facebook: "https://cdn-icons-png.flaticon.com/512/733/733547.png",
    twitter: "https://cdn-icons-png.flaticon.com/512/733/733579.png",
    linkedin: "https://cdn-icons-png.flaticon.com/512/145/145807.png",
    instagram: "https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
  };
  Object.entries(socials).forEach(([platform, url]) => {
    const link = document.createElement("a");
    link.href = url; link.target = "_blank"; link.rel = "noopener";
    link.innerHTML = `<img src="${iconCDN[platform] || iconCDN.facebook}" alt="${platform}" class="social-icon">`;
    socialContainer.appendChild(link);
  });

  // ================= GAMES =================
  const games = await fetchGames(info.apis?.games);
  const mainContainer = document.getElementById("games").querySelector(".games-container");
  
  // Show loading state
  mainContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Loading games...</div>';
  
  // Add games with animation
  setTimeout(() => {
    mainContainer.innerHTML = "";
    games.forEach((game, index) => {
      const card = createGameCard(game);
      // Stagger animation for visual appeal
      card.style.animationDelay = `${index * 0.03}s`;
      mainContainer.appendChild(card);
    });
  }, 100);

  // ================= RECENTLY PLAYED =================
  renderRecentlyPlayed(); // fills #recent-container


  // ================= SEARCH =================
  const searchInput = document.getElementById("gameSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterGames(e.target.value);
    });
    
    // Add enter key support
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const firstCard = document.querySelector(".game-card[style*='block'], .game-card:not([style*='none'])");
        if (firstCard) {
          firstCard.click();
        }
      }
    });
  }

});

// ================= GAME CARD =================
function createGameCard(game) {
  const card = document.createElement("div");
  card.className = "game-card";
  card.setAttribute("role", "listitem");
  card.setAttribute("aria-label", `Play ${game.title}`);
  
  // SEO-friendly alt text with keywords
  const altText = `${game.title} - Free Online Game - Play Now on DPgames`;
  
  card.innerHTML = `
    <img src="${game.thumbnail}" alt="${altText}" loading="lazy" onerror="this.src='assets/logo.png'" title="${game.title}">
    <h4>${game.title}</h4>
  `;
  
  // Add click handler with smooth transition
  card.addEventListener("click", () => {
    addToRecentlyPlayed(game);
    // Add a subtle animation before navigation
    card.style.transform = "scale(0.95)";
    setTimeout(() => {
      window.location.href = game.page;
    }, 150);
  });

  // Keyboard accessibility
  card.setAttribute("tabindex", "0");
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });

  // Add hover effect
  card.addEventListener("mouseenter", () => {
    card.style.transition = "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  });

  return card;
}

// ================= SEARCH FILTER =================
function filterGames(query) {
  query = query.trim().toLowerCase();
  let visibleCount = 0;
  
  document.querySelectorAll(".game-card").forEach((card, index) => {
    const title = card.querySelector("h4").textContent.toLowerCase();
    const isVisible = query === "" || title.includes(query);
    
    if (isVisible) {
      card.style.display = "block";
      // Add staggered animation
      card.style.animationDelay = `${visibleCount * 0.05}s`;
      card.style.opacity = "1";
      visibleCount++;
    } else {
      card.style.opacity = "0";
      card.style.transform = "scale(0.8)";
      setTimeout(() => {
        card.style.display = "none";
      }, 300);
    }
  });
  
  // Show "no results" message if needed
  const gamesSection = document.getElementById("games");
  let noResultsMsg = document.getElementById("no-results");
  
  if (query && visibleCount === 0) {
    if (!noResultsMsg) {
      noResultsMsg = document.createElement("p");
      noResultsMsg.id = "no-results";
      noResultsMsg.style.textAlign = "center";
      noResultsMsg.style.color = "var(--text-muted)";
      noResultsMsg.style.padding = "2rem";
      noResultsMsg.style.fontSize = "1.2rem";
      gamesSection.appendChild(noResultsMsg);
    }
    noResultsMsg.textContent = `No games found matching "${query}"`;
  } else if (noResultsMsg) {
    noResultsMsg.remove();
  }
}

// ================= TOGGLE SEARCH (Mobile) =================
function toggleSearch() {
  const searchBar = document.querySelector(".search-bar");
  searchBar.classList.toggle("active");
  
  // Focus on input when opened
  if (searchBar.classList.contains("active")) {
    setTimeout(() => {
      const input = document.getElementById("gameSearch");
      if (input) input.focus();
    }, 100);
  }
}

// Testing
// ================= RECENTLY PLAYED =================
function addToRecentlyPlayed(game) {
  const key = "recentlyPlayedGames";
  let stored = JSON.parse(localStorage.getItem(key)) || [];

  // Remove if already exists
  stored = stored.filter(g => g.page !== game.page);

  // Add to beginning
  stored.unshift(game);

  // Keep only last 5
  if (stored.length > 5) stored = stored.slice(0, 5);

  localStorage.setItem(key, JSON.stringify(stored));
}

function renderRecentlyPlayed() {
  const key = "recentlyPlayedGames";
  const section = document.getElementById("recently-played");
  const container = document.getElementById("recent-container");
  const stored = JSON.parse(localStorage.getItem(key));

  // Hide section if no data or first-time user
  if (!stored || stored.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";
  container.innerHTML = "";

  stored.forEach((game, index) => {
    const card = createGameCard(game);
    // Add staggered animation for recently played
    card.style.animationDelay = `${index * 0.1}s`;
    container.appendChild(card);
  });
}
