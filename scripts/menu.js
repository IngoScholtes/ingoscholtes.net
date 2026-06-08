function selectCurrentMenuItem() {
    var windowHref = window.location.href.replace(/^.*?\/\/[^\/]*/, '');
    document.querySelectorAll('.menu a').forEach(function (a) {
        if (windowHref === a.getAttribute('href')) {
            a.parentNode.classList.add('selected');
        }
    });
}
