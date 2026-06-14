function selectCurrentMenuItem() {
    var windowHref = window.location.href.replace(/^.*?\/\/[^\/]*/, '');
    document.querySelectorAll('.menu a').forEach(function (a) {
        if (windowHref === a.getAttribute('href')) {
            a.parentNode.classList.add('selected');
        }
    });
}

// Event delegation — works regardless of when the menu HTML is injected.
// Toggles from 'block' not '' so the CSS-hidden initial state is handled correctly.
document.addEventListener('click', function (e) {
    var li = e.target.closest('.menu.dropdown > ul > li');
    if (!li) return;
    var sub = li.querySelector('ul');
    if (sub) sub.style.display = sub.style.display === 'block' ? 'none' : 'block';
});
