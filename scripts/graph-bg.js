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
        var W, H, CX, CY, DR;

        function resize() {
            W  = cvs.width  = document.documentElement.clientWidth;
            H  = cvs.height = window.innerHeight;
            CX = W / 2;
            CY = H / 2;
            DR = Math.min(W, H) * 0.46;
        }
        window.addEventListener('resize', resize);
        resize();

        var N        = 55;
        var MIN_SPD  = 0.003;    // radians / frame
        var MAX_SPD  = 0.009;
        var DRIFT    = 0.0003;
        var CONN_ANG = 0.50;     // angular distance threshold for edges (≈ 28°)
        var ROT_SPD  = 0.0015;   // slow auto-rotation around y-axis (rad/frame)
        var rotAngle = 0;

        // ── Uniform random point on S² ──────────────────────────────────────
        function randSphere() {
            var th = Math.random() * Math.PI * 2;
            var ph = Math.acos(2 * Math.random() - 1);
            return [Math.sin(ph)*Math.cos(th), Math.sin(ph)*Math.sin(th), Math.cos(ph)];
        }

        // ── Random unit tangent vector at p ─────────────────────────────────
        function randTangent(p) {
            var ref = Math.abs(p[0]) < 0.9 ? [1,0,0] : [0,1,0];
            var d   = ref[0]*p[0] + ref[1]*p[1] + ref[2]*p[2];
            var e1  = [ref[0]-d*p[0], ref[1]-d*p[1], ref[2]-d*p[2]];
            var l   = Math.sqrt(e1[0]*e1[0]+e1[1]*e1[1]+e1[2]*e1[2]);
            e1      = [e1[0]/l, e1[1]/l, e1[2]/l];
            var e2  = [p[1]*e1[2]-p[2]*e1[1], p[2]*e1[0]-p[0]*e1[2], p[0]*e1[1]-p[1]*e1[0]];
            var a   = Math.random() * Math.PI * 2;
            return [Math.cos(a)*e1[0]+Math.sin(a)*e2[0],
                    Math.cos(a)*e1[1]+Math.sin(a)*e2[1],
                    Math.cos(a)*e1[2]+Math.sin(a)*e2[2]];
        }

        var nodes = [];
        for (var i = 0; i < N; i++) {
            var p   = randSphere();
            var spd = MIN_SPD + Math.random() * (MAX_SPD - MIN_SPD);
            var tv  = randTangent(p);
            nodes.push({ p: p, v: [tv[0]*spd, tv[1]*spd, tv[2]*spd] });
        }

        function tick() {
            rotAngle += ROT_SPD;

            for (var i = 0; i < N; i++) {
                var n = nodes[i];
                var p = n.p, v = n.v;

                // Random drift projected onto the tangent plane at p
                var dx = (Math.random()-0.5)*DRIFT;
                var dy = (Math.random()-0.5)*DRIFT;
                var dz = (Math.random()-0.5)*DRIFT;
                var dd = dx*p[0]+dy*p[1]+dz*p[2];
                v[0] += dx-dd*p[0]; v[1] += dy-dd*p[1]; v[2] += dz-dd*p[2];

                // Numerical re-projection: keep v tangent at p
                var vd = v[0]*p[0]+v[1]*p[1]+v[2]*p[2];
                v[0] -= vd*p[0]; v[1] -= vd*p[1]; v[2] -= vd*p[2];

                // Speed clamping
                var spd = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
                if (spd > MAX_SPD) { v[0]*=MAX_SPD/spd; v[1]*=MAX_SPD/spd; v[2]*=MAX_SPD/spd; }
                if (spd < MIN_SPD) { v[0]*=MIN_SPD/spd; v[1]*=MIN_SPD/spd; v[2]*=MIN_SPD/spd; }
                spd = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);

                // Geodesic step on S² with parallel-transported velocity:
                //   p' = p·cos(s) + v̂·sin(s)
                //   v' = v·cos(s) − p·s·sin(s)
                var c   = Math.cos(spd);
                var soc = Math.sin(spd) / spd;
                var ss  = Math.sin(spd);
                var np  = [p[0]*c+v[0]*soc, p[1]*c+v[1]*soc, p[2]*c+v[2]*soc];
                var nv  = [v[0]*c-p[0]*spd*ss, v[1]*c-p[1]*spd*ss, v[2]*c-p[2]*spd*ss];

                // Renormalise np to unit sphere (float cleanup)
                var nr  = Math.sqrt(np[0]*np[0]+np[1]*np[1]+np[2]*np[2]);
                np      = [np[0]/nr, np[1]/nr, np[2]/nr];

                // Keep nv tangent at np (float cleanup)
                var nvd = nv[0]*np[0]+nv[1]*np[1]+nv[2]*np[2];
                nv[0]  -= nvd*np[0]; nv[1] -= nvd*np[1]; nv[2] -= nvd*np[2];

                n.p = np; n.v = nv;
            }
        }

        // ── Rotate around y-axis, then orthographic projection to screen ────
        function proj(p) {
            var cy = Math.cos(rotAngle), sy = Math.sin(rotAngle);
            var rx =  p[0]*cy + p[2]*sy;
            var ry =  p[1];
            var rz = -p[0]*sy + p[2]*cy;
            return [CX + rx*DR, CY - ry*DR, rz];   // [sx, sy, depth ∈ [-1,1]]
        }

        // ── Great-circle arc via spherical linear interpolation ─────────────
        function slerpArc(p1, p2) {
            var dot   = p1[0]*p2[0]+p1[1]*p2[1]+p1[2]*p2[2];
            dot       = Math.max(-1, Math.min(1, dot));
            var d     = Math.acos(dot);
            if (d < 1e-6) return;
            var sinD  = Math.sin(d);
            var steps = Math.max(3, Math.ceil(d * DR / 12));
            var sc1   = proj(p1);
            ctx.moveTo(sc1[0], sc1[1]);
            for (var k = 1; k <= steps; k++) {
                var t  = k / steps;
                var a  = Math.sin((1-t)*d) / sinD;
                var b  = Math.sin(t*d) / sinD;
                var sc = proj([a*p1[0]+b*p2[0], a*p1[1]+b*p2[1], a*p1[2]+b*p2[2]]);
                ctx.lineTo(sc[0], sc[1]);
            }
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            var dark  = document.documentElement.getAttribute('data-theme') === 'dark';
            var edgeC = dark ? 'rgba(96,165,250,0.45)'  : 'rgba(41,128,185,0.08)';
            var limbC = dark ? 'rgba(96,165,250,0.12)'  : 'rgba(41,128,185,0.05)';

            // Sphere silhouette circle (always a circle under orthographic projection)
            ctx.strokeStyle = limbC;
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.arc(CX, CY, DR, 0, Math.PI * 2);
            ctx.stroke();

            // Geodesic edges
            ctx.strokeStyle = edgeC;
            ctx.lineWidth   = 0.9;
            ctx.beginPath();
            for (var i = 0; i < N; i++)
                for (var j = i+1; j < N; j++) {
                    var p1  = nodes[i].p, p2 = nodes[j].p;
                    var dot = p1[0]*p2[0]+p1[1]*p2[1]+p1[2]*p2[2];
                    if (dot > Math.cos(CONN_ANG)) slerpArc(p1, p2);
                }
            ctx.stroke();

            // Nodes — depth-based alpha and size to reinforce 3-D feel
            for (var i = 0; i < N; i++) {
                var sc  = proj(nodes[i].p);
                var t   = (sc[2] + 1) * 0.5;   // 0 = back hemisphere, 1 = front
                var alp = dark ? (0.10 + 0.25 * t) : (0.05 + 0.15 * t);
                var sz  = sc[2] > 0 ? 5 : 3.5;
                ctx.fillStyle = dark
                    ? 'rgba(96,165,250,' + alp + ')'
                    : 'rgba(41,128,185,' + alp + ')';
                ctx.beginPath();
                ctx.arc(sc[0], sc[1], sz, 0, Math.PI * 2);
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
