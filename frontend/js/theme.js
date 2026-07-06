// Immediate execution block to set the class on the html/documentElement element and avoid visual flashing
(function () {
    const currentTheme = localStorage.getItem("theme") || "light";
    if (currentTheme === "dark") {
        document.documentElement.classList.add("dark");
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initMobileNav();
});

function initThemeToggle() {
    const headerNav = document.querySelector("header nav");
    
    // Create button element
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "theme-toggle-btn";
    toggleBtn.setAttribute("aria-label", "Toggle theme");
    
    // Update button icon based on current theme
    const updateIcon = (theme) => {
        toggleBtn.innerHTML = theme === "dark" 
            ? `<i class="fa-solid fa-sun"></i>` 
            : `<i class="fa-solid fa-moon"></i>`;
    };
    
    const getTheme = () => document.documentElement.classList.contains("dark") ? "dark" : "light";
    updateIcon(getTheme());
    
    // Determine placement
    if (headerNav) {
        // Append to navigation bar
        headerNav.appendChild(toggleBtn);
    } else {
        // Append as a floating action button on top-right
        toggleBtn.classList.add("floating");
        document.body.appendChild(toggleBtn);
    }
    
    // Click listener
    toggleBtn.addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        const newTheme = isDark ? "dark" : "light";
        localStorage.setItem("theme", newTheme);
        updateIcon(newTheme);
    });
}

function initMobileNav() {
    const header = document.querySelector("header");
    const nav = document.querySelector("header nav");
    
    if (header && nav) {
        // Create menu toggle button
        const menuToggle = document.createElement("button");
        menuToggle.className = "menu-toggle";
        menuToggle.setAttribute("aria-label", "Toggle navigation");
        menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        
        // Insert it into the header (before nav)
        header.insertBefore(menuToggle, nav);
        
        // Listen to clicks
        menuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            nav.classList.toggle("open");
            if (nav.classList.contains("open")) {
                menuToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            } else {
                menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
            }
        });
        
        // Close menu if clicking outside
        document.addEventListener("click", (e) => {
            if (nav.classList.contains("open") && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
                nav.classList.remove("open");
                menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
            }
        });
    }
}
