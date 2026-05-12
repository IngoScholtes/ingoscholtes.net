(function () {
    function init() {
        if (!document.getElementById('graph-bg-style')) {
            var s = document.createElement('style');
            s.id = 'graph-bg-style';
            s.textContent = '#graph-bg{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none}';
            document.head.appendChild(s);
        }

        var cvs = document.getElementById('graph-bg');
        if (!cvs) {
            cvs = document.createElement('canvas');
            cvs.id = 'graph-bg';
            document.body.insertBefore(cvs, document.body.firstChild);
        }
        var ctx = cvs.getContext('2d');
        var W, H;

        var R, R2;
        function resize() {
            W  = cvs.width  = document.documentElement.clientWidth;
            H  = cvs.height = window.innerHeight;
            R  = 100;
            R2 = R * R;
        }
        window.addEventListener('resize', resize);
        resize();

        var N       = 55;
        var MIN_SPD = 0.06;
        var MAX_SPD = 0.20;
        var DRIFT   = 0.007;

        var nodes = [];
        for (var i = 0; i < N; i++) {
            var angle = Math.random() * Math.PI * 2;
            var spd   = MIN_SPD + Math.random() * (MAX_SPD - MIN_SPD);
            nodes.push({ x: Math.random() * W, y: Math.random() * H,
                         vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd });
        }

        function tick() {
            for (var i = 0; i < N; i++) {
                var n = nodes[i];
                n.vx += (Math.random() - 0.5) * DRIFT;
                n.vy += (Math.random() - 0.5) * DRIFT;
                var spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
                if (spd > MAX_SPD) { n.vx *= MAX_SPD / spd; n.vy *= MAX_SPD / spd; }
                if (spd < MIN_SPD) { n.vx *= MIN_SPD / spd; n.vy *= MIN_SPD / spd; }
                n.x += n.vx; n.y += n.vy;
                if (n.x <= 0) { n.x = 0; n.vx =  Math.abs(n.vx); }
                if (n.x >= W) { n.x = W; n.vx = -Math.abs(n.vx); }
                if (n.y <= 0) { n.y = 0; n.vy =  Math.abs(n.vy); }
                if (n.y >= H) { n.y = H; n.vy = -Math.abs(n.vy); }
            }
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            var dark = document.documentElement.getAttribute('data-theme') === 'dark';
            var edgeColor = dark ? 'rgba(96,165,250,0.45)'  : 'rgba(41,128,185,0.08)';
            var nodeColor = dark ? 'rgba(96,165,250,0.35)'  : 'rgba(41,128,185,0.15)';
            ctx.strokeStyle = edgeColor;
            ctx.lineWidth   = 0.9;
            ctx.beginPath();
            for (var i = 0; i < N; i++) {
                for (var j = i + 1; j < N; j++) {
                    var dx = nodes[j].x - nodes[i].x;
                    var dy = nodes[j].y - nodes[i].y;
                    if (dx * dx + dy * dy < R2) {
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                    }
                }
            }
            ctx.stroke();
            ctx.fillStyle = nodeColor;
            for (var i = 0; i < N; i++) {
                ctx.beginPath();
                ctx.arc(nodes[i].x, nodes[i].y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        (function loop() { tick(); draw(); requestAnimationFrame(loop); })();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
