(function () {
    // Apply saved theme immediately — before body renders — to prevent flash
    var saved = localStorage.getItem('theme');
    if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        saved = 'dark';
    }
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    function makeBtn(id) {
        var btn = document.createElement('button');
        btn.id = id;
        btn.setAttribute('aria-label', 'Toggle dark mode');
        function update() {
            var dark = document.documentElement.getAttribute('data-theme') === 'dark';
            btn.textContent = dark ? '☀' : '☽';
            btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
        }
        update();
        btn.addEventListener('click', function () {
            var dark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (dark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
            // Sync both button icons
            ['dark-toggle', 'dark-toggle-mobile'].forEach(function (bid) {
                var b = document.getElementById(bid);
                if (b) {
                    var d = document.documentElement.getAttribute('data-theme') === 'dark';
                    b.textContent = d ? '☀' : '☽';
                    b.title = d ? 'Switch to light mode' : 'Switch to dark mode';
                }
            });
        });
        return btn;
    }

    function appendToMenu(ulId, btnId) {
        var ul = document.getElementById(ulId);
        if (!ul || document.getElementById(btnId)) return;
        var btn = makeBtn(btnId);
        function insert() {
            var li = document.createElement('li');
            li.appendChild(btn);
            ul.appendChild(li);
        }
        if (ul.children.length > 0) {
            insert();
        } else {
            var obs = new MutationObserver(function (_, o) {
                if (ul.children.length > 0) { o.disconnect(); insert(); }
            });
            obs.observe(ul, { childList: true });
        }
    }

    function injectToggle() {
        appendToMenu('nav_menu_main',   'dark-toggle');
        appendToMenu('nav_menu_small',  'dark-toggle-mobile');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectToggle);
    } else {
        injectToggle();
    }
})();
