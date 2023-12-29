(game = {}),
  (function (e) {
    agentX = 0;
    agentY = 0;
    goldPosX = 0;
    goldPosY = 0;
    function t(e, t, r) {
      for (; t; ) {
        var l = (Math.random() * (j - 2) + 1) >> 0,
          i = (Math.random() * (z - 2) + 1) >> 0;
        
        d[i][l].type == m && ((d[i][l] = new n(e, r)), t--);
      }
    }
    function setAgentStarting(c, d) {
        agentX = c;
        agentY = d;
    }
    function setTreasureStarting(h, f) {
        goldPosX = h;
        goldPosY = f;
    }
    function n(e, t) {
      (this.type = e), (this.level = t);
    }
    function r() {
      (x[v.y][v.x] = !0),
        (x[v.y - 1][v.x] = !0),
        (x[v.y + 1][v.x] = !0),
        (x[v.y][v.x - 1] = !0),
        (x[v.y][v.x + 1] = !0);
    }
    function l(t, n) {
      var l = d[v.y + n][v.x + t];
      return l.type == T || Math.abs(l.level - v.level) > 1
        ? !1
        : ((v.x += t),
          (v.y += n),
          (v.level = l.level),
          r(),
          p++,
          l.type == S && (s = !0),
          (s || !g) && e.draw(),
          !0);
    }
    function i(e, t, n, r, l) {
      e.save(),
        (e.fillStyle = l ? l : "#333"),
        (e.font = "12px Arial"),
        (e.textAlign = "center"),
        e.fillText(r, t, n + 5),
        e.restore();
    }
    var f,
      o,
      a,
      u,
      y,
      c,
      h,
      p,
      v,
      s,
      d = [],
      x = [],
      w = {},
      g = !1,
      m = 0,
      T = 1,
      M = 2,
      S = 3,
      k = 4,
      C = 0,
      D = 1,
      I = 2,
      A = 3,
      R = 50,
      b = 50,
      q = 8,
      E = "#4d4d4d",
      J = ["#0cf", "#3f0", "#af0", "#ff0", "#fa0", "#f70", "#f42"],
      W = "#f0a",
      Y = "#331700",
      j = 18,
      z = 18,
      B = 50;
    !(function (e) {
      function l() {
        h = {
          left: { type: d[v.y][v.x - 1].type, level: d[v.y][v.x - 1].level },
          up: { type: d[v.y - 1][v.x].type, level: d[v.y - 1][v.x].level },
          right: { type: d[v.y][v.x + 1].type, level: d[v.y][v.x + 1].level },
          down: { type: d[v.y + 1][v.x].type, level: d[v.y + 1][v.x].level },
          type: d[v.y][v.x].type,
          level: d[v.y][v.x].level,
        };
        var e = O.turn(h, d);
        return w[e](), s ? (i(), !0) : (g || (f = setTimeout(l, B)), !1);
      }
      function i() {
        (Q = new Date().getTime()),
          ee.push(Q - P),
          _.push(p),
          $("h2").html("You Won! Turns: " + p + " Javascript Time: " + (Q - P)),
          _.length > 1 && J(),
          Z.fillRect(0, 0, (++U / V) * 400, 18),
          V > U ? setTimeout(E, 0) : J();
      }
      function E() {
        clearTimeout(f),
          e.init(),
          (P = new Date().getTime()),
          (O = new Stacker(agentX, agentY, goldPosX, goldPosY)),
          (g = $("#ultrafast").prop("checked"));
        for (var t = l(); g && !t; ) t = l();
      }
      function J() {
        $("h3").html(
          "Average for " +
            _.length +
            " runs: " +
            W(_) +
            " turns, " +
            W(ee) +
            "ms"
        );
      }
      function W(e) {
        for (var t = 0, n = 0; t < e.length; n += e[t++]);
        return Math.round(n / e.length);
      }
      function Y(e, t, n, r) {
        return H(new F(e, t), new F(n, r)) ? !0 : !1;
      }
      function F(e, t, n, r) {
        (this.x = e), (this.y = t), (this.dist = n), (this.level = r);
      }
      function G(e, t) {
        for (var n = 0; n < e.length; n++)
          if (t.x === e[n].x && t.y === e[n].y) return n;
        return -1;
      }
      function H(e, t) {
        var n = [];
        n.push(new F(e.x, e.y, 0, d[e.y][e.x].level));
        for (var r, l, i = 0, f = n[i]; f.x != t.x || f.y != t.y; ) {
          r = N(f);
          for (var o = 0; o < r.length; o++)
            (l = G(n, r[o])),
              -1 === l ? n.push(r[o]) : n[l].dist > r[o].dist && (n[l] = r[o]);
          if (i == n.length - 1) return !1;
          f = n[++i];
        }
        return !0;
      }
      function K(e, t) {
        return t == C || t == I ? e : t == A ? e - 1 : e + 1;
      }
      function L(e, t) {
        return t == A || t == D ? e : t == C ? e - 1 : e + 1;
      }
      function N(e) {
        for (var t, n = [], r = 0; 4 > r; r++)
          (t = d[L(e.y, r)][K(e.x, r)]),
            t.type != k &&
              t.type != T &&
              n.push(new F(K(e.x, r), L(e.y, r), e.dist + 1, t.level));
        return n;
      }
      var O,
        P,
        Q,
        U,
        V,
        X,
        Z = $("#progress")[0].getContext("2d"),
        _ = [],
        ee = [];
      (e.init = function () {
        (d = []), (x = []);
        for (var l = 0; z > l; l++) {
          (d[l] = []), (x[l] = []);
          for (var i = 0; j > i; i++)
            (x[l][i] = !1),
              0 == l || l == z - 1 || 0 == i || i == j - 1
                ? (d[l][i] = new n(T, 0))
                : (d[l][i] = new n(m, 0));
        }
        t(M, b, 1), t(T, R, 0);
        var f = (Math.random() * (j - 6) + 3) >> 0,
          h = (Math.random() * (z - 6) + 3) >> 0;
        d[h][f] = new n(S, q);
        setTreasureStarting(h, f)
        for (var l = 0; 5 > l; l++)
          for (var i = 0; 5 > i; i++)
            d[h - 2 + i][f - 2 + l].type == T &&
              (d[h - 2 + i][f - 2 + l] = new n(m, 0));
        for (var w = 0, g = 0; d[g][w].type != m || !Y(w, g, f, h); )
          (w = (Math.random() * (j - 2) + 1) >> 0),
            (g = (Math.random() * (z - 2) + 1) >> 0);
        (v = { x: w, y: g, level: 0 }),
          r(),
          setAgentStarting(v.x, v.y),
          (o = $("#field")),
          (u = o[0].getContext("2d")),
          (y = (o.width() / j) >> 0),
          (c = (o.height() / z) >> 0),
          (p = 0),
          (s = !1);
        var k = new Image();
        (a = document.createElement("canvas")),
          (a.width = y),
          (a.height = c),
          (k.onload = function () {
            a.getContext("2d").drawImage(k, 0, 0, 100, 100, 0, 0, y, c),
              e.draw();
          }),
          (k.src = "minitroll.png"),
          k.complete &&
            (a.getContext("2d").drawImage(k, 0, 0, 100, 100, 0, 0, y, c),
            e.draw()),
          e.draw();
      }),
        (e.run = function (e) {
          $("h2").html("Running Trials...."),
            ($("#progress")[0].width = $("#progress")[0].width),
            (Z.fillStyle = "#09f"),
            (V = e),
            (U = 0),
            (_ = []),
            (ee = []),
            E();
        }),
        (e.pause = function () {
          f && (X ? ((X = !1), l()) : ((X = !0), clearTimeout(f)));
        }),
        (F.prototype.equals = function (e) {
          return e.x == this.x && e.y == this.y;
        });
    })(e),
      (e.draw = function () {
        o[0].width = o[0].width;
        for (var e = $("#reveal-map").prop("checked"), t = 0; z > t; t++)
          for (var n = 0; j > n; n++) {
            if (((h = d[t][n]), e || x[t][n]))
              if (h.type == T) u.fillStyle = E;
              else if (h.type == M) u.fillStyle = J[h.level - 1];
              else {
                if (h.type != S) continue;
                u.fillStyle = W;
              }
            else u.fillStyle = Y;
            u.fillRect(n * y, t * c, y, c),
              h.level &&
                (e || x[t][n]) &&
                i(u, n * y + y / 2, t * c + c / 2, h.level);
          }
        u.drawImage(a, 0, 0, y, c, v.x * y, v.y * c, y, c),
          (u.fillStyle = "#fff"),
          i(u, y * j - 100, 12, "Turns: " + p, "#fff");
      }),
      (w.left = function () {
        l(-1, 0);
      }),
      (w.up = function () {
        l(0, -1);
      }),
      (w.right = function () {
        l(1, 0);
      }),
      (w.down = function () {
        l(0, 1);
      }),
      (w.pickup = function () {
        return v.carrying || d[v.y][v.x].type != M
          ? !1
          : ((v.carrying = !0),
            (d[v.y][v.x].type = --d[v.y][v.x].level > 0 ? M : m),
            v.level--,
            p++,
            g || e.draw(),
            !0);
      }),
      (w.drop = function () {
        return v.carrying
          ? ((v.carrying = !1),
            (d[v.y][v.x].type = M),
            d[v.y][v.x].level++,
            v.level++,
            p++,
            g || e.draw(),
            !0)
          : !1;
      }),
      (e.setDelay = function (e) {
        B = e;
      }),
      (e.getDelay = function () {
        return B;
      }),
      (e.test = function (e) {
        37 == e.which
          ? l(-1, 0)
          : 38 == e.which
          ? l(0, -1)
          : 39 == e.which
          ? l(1, 0)
          : 40 == e.which
          ? l(0, 1)
          : 32 == e.which && (w.pickup() || w.drop());
      });
  })(game);
