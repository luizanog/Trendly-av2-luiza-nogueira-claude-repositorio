/* app.jsx — state, routing, auth, persistence, tweaks, mount */
const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "a",
  "dark": false,
  "accent": ["oklch(55% 0.205 295)", "oklch(49% 0.215 294)"]
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const sb = window.SB || { enabled: false };

  // phase: "loading" (checando login) | "auth" (deslogado) | "app"
  const [phase, setPhase] = useState(sb.enabled ? "loading" : "app");
  const [user, setUser] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  const [trends, setTrends] = useState(() => (sb.enabled ? [] : window.loadTrends()));
  const [savedIds, setSavedIds] = useState(() => (sb.enabled ? [] : window.loadSaved()));
  const [view, setView] = useState("discover");
  const [sidebar, setSidebar] = useState(false);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [filters, setFilters] = useState({ cats: [], sort: "recent", withImage: false });
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = (msg) => { setToast(msg); clearTimeout(window.__tt); window.__tt = setTimeout(() => setToast(null), 2200); };

  /* ---- auth bootstrap ---- */
  useEffect(() => {
    if (!sb.enabled) return;
    let alive = true;
    sb.currentUser().then((u) => {
      if (!alive) return;
      if (u) { setUser(u); setPhase("app"); }
      else setPhase("auth");
    }).catch(() => { if (alive) setPhase("auth"); });
    sb.onAuth((u) => { setUser(u); setPhase(u ? "app" : "auth"); });
    return () => { alive = false; };
  }, []);

  /* ---- load shared data once logged in ---- */
  useEffect(() => {
    if (!sb.enabled || phase !== "app" || !user) return;
    setDataLoading(true);
    Promise.all([sb.fetchTrends(user.id), sb.fetchFavorites(user.id)])
      .then(([tr, fav]) => { setTrends(tr); setSavedIds(fav); })
      .catch(() => flash("Não foi possível carregar as tendências"))
      .finally(() => setDataLoading(false));
  }, [phase, user]);

  /* ---- guest mode persistence (localStorage) ---- */
  useEffect(() => { if (!sb.enabled) window.persistTrends(trends); }, [trends]);
  useEffect(() => { if (!sb.enabled) window.persistSaved(savedIds); }, [savedIds]);

  /* theme */
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-dir", t.direction);
    r.setAttribute("data-theme", t.dark ? "dark" : "light");
    if (Array.isArray(t.accent)) {
      r.style.setProperty("--purple", t.accent[0]);
      r.style.setProperty("--purple-600", t.accent[1]);
    }
  }, [t.direction, t.dark, t.accent]);

  /* ---- actions ---- */
  const createTrend = async (draft) => {
    if (sb.enabled) {
      try {
        const row = await sb.insertTrend(draft, user);
        setTrends((list) => [row, ...list]);
      } catch (e) {
        flash("Erro ao publicar: " + ((e && e.message) || "tente de novo"));
        return false;
      }
    } else {
      const local = {
        ...draft, id: "t" + Date.now().toString(36),
        author: "Você", saves: 0, created: Date.now(), mine: true,
      };
      setTrends((list) => [local, ...list]);
    }
    setAddOpen(false); setView("discover"); setActiveQuery(""); setQuery("");
    flash("Tendência publicada ✦");
    return true;
  };

  const deleteTrend = async (id) => {
    if (sb.enabled) {
      try { await sb.deleteTrend(id); }
      catch (e) { flash("Não foi possível remover"); return; }
    }
    setTrends((list) => list.filter((x) => x.id !== id));
    setSavedIds((s) => s.filter((x) => x !== id));
    flash("Removida");
  };

  const toggleSave = async (id) => {
    const has = savedIds.includes(id);
    setSavedIds((s) => (has ? s.filter((x) => x !== id) : [...s, id])); // otimista
    if (sb.enabled && user) {
      try { has ? await sb.removeFavorite(user.id, id) : await sb.addFavorite(user.id, id); }
      catch (e) { setSavedIds((s) => (has ? [...s, id] : s.filter((x) => x !== id))); flash("Não foi possível atualizar o favorito"); }
    }
  };

  const logout = async () => { try { await sb.signOut(); } catch (e) {} };
  const runSearch = (q) => { setActiveQuery(q.trim()); if (q.trim()) setView("discover"); };

  /* derived list */
  const filtered = useMemo(() => {
    let list = trends.slice();
    if (view === "collections") list = list.filter((x) => savedIds.includes(x.id));
    if (filters.cats.length) list = list.filter((x) => filters.cats.includes(x.category));
    if (filters.withImage) list = list.filter((x) => !!x.image);
    if (activeQuery) {
      const q = activeQuery.toLowerCase();
      list = list.filter((x) => (x.title + " " + x.desc + " " + x.category + " " + x.briefing).toLowerCase().includes(q));
    }
    if (filters.sort === "popular") list.sort((a, b) => b.saves - a.saves);
    else if (filters.sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => b.created - a.created);
    return list;
  }, [trends, savedIds, view, filters, activeQuery]);

  const canDelete = (tr) => !sb.enabled || tr.mine;

  /* ---- gated screens ---- */
  if (phase === "loading") {
    return (
      <div className="app-loader">
        <span className="brand__mark app-loader__mark"><IconSparkle size={26} /></span>
        <span className="app-loader__spin" />
      </div>
    );
  }
  if (phase === "auth") {
    return <AuthScreen sb={sb} />;
  }

  const counts = { total: trends.length, saved: savedIds.length };
  const heads = {
    discover: ["Descobrir tendências", "Explore, salve e compartilhe direções de design do time."],
    collections: ["Minha coleção", "Tudo que você salvou para revisitar."],
    dashboard: ["Painel", "Uma visão do acervo de tendências."],
  };
  const [hTitle, hSub] = heads[view];

  return (
    <div className="app">
      <TopBar
        onMenu={() => setSidebar(true)} onHome={() => { setView("discover"); setActiveQuery(""); setQuery(""); }}
        query={query} setQuery={setQuery} onSearch={runSearch}
        filters={filters} setFilters={setFilters} resultCount={filtered.length}
        onAdd={() => setAddOpen(true)} user={user} onLogout={logout}
      />
      <Sidebar open={sidebar} view={view} setView={(v) => { setView(v); setActiveQuery(""); }} onAdd={() => setAddOpen(true)} counts={counts} onClose={() => setSidebar(false)} cloud={sb.enabled} />

      <main className="main">
        <div className="main__head">
          <div>
            <h1 className="main__title">{hTitle}</h1>
            <p className="main__sub">{hSub}</p>
          </div>
          {view !== "dashboard" && (
            <div className="seg seg--top">
              <button className={"seg__btn seg__btn--fav " + (view === "collections" ? "is-on" : "")}
                onClick={() => { setView("collections"); setActiveQuery(""); }}>
                {view === "collections" ? <IconHeartFill size={15} /> : <IconHeart size={15} />}
                Favoritos{counts.saved > 0 && <span className="seg__count">{counts.saved}</span>}
              </button>
              <span className="seg__div" />
              <button className={"seg__btn " + (view === "discover" && filters.cats.length === 0 ? "is-on" : "")}
                onClick={() => { setView("discover"); setFilters((f) => ({ ...f, cats: [] })); }}>Tudo</button>
              {window.CATEGORIES.map((c) => (
                <button key={c} className={"seg__btn " + (view === "discover" && filters.cats.length === 1 && filters.cats[0] === c ? "is-on" : "")}
                  onClick={() => { setView("discover"); setFilters((f) => ({ ...f, cats: f.cats.length === 1 && f.cats[0] === c ? [] : [c] })); }}>{c}</button>
              ))}
            </div>
          )}
        </div>

        {activeQuery && view !== "dashboard" && (
          <AIBanner query={activeQuery} count={filtered.length} onClear={() => { setActiveQuery(""); setQuery(""); }} />
        )}

        {dataLoading ? (
          <div className="grid">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card skel" />)}
          </div>
        ) : view === "dashboard" ? (
          <Dashboard trends={trends} savedIds={savedIds} onAdd={() => setAddOpen(true)} onOpen={setDetail} />
        ) : (
          <div className="grid">
            {view === "discover" && !activeQuery && <AddCard onAdd={() => setAddOpen(true)} />}
            {filtered.map((tr) => (
              <TrendCard key={tr.id} trend={tr} saved={savedIds.includes(tr.id)} canDelete={canDelete(tr)}
                onOpen={setDetail} onToggleSave={toggleSave} onDelete={deleteTrend} />
            ))}
            {filtered.length === 0 && view === "collections" && (
              <div className="grid__empty"><EmptyState title="Nada salvo ainda" sub="Toque no coração de uma tendência para guardá-la aqui." action="Descobrir" onAction={() => setView("discover")} /></div>
            )}
            {filtered.length === 0 && view === "discover" && activeQuery && (
              <div className="grid__empty"><EmptyState title="Sem resultados" sub={`Nada para “${activeQuery}”. Tente outros termos ou ajuste os filtros.`} action="Limpar busca" onAction={() => { setActiveQuery(""); setQuery(""); }} /></div>
            )}
          </div>
        )}
      </main>

      {addOpen && <AddTrendModal onClose={() => setAddOpen(false)} onCreate={createTrend} cloud={sb.enabled} />}
      {detail && <TrendDetail trend={detail} saved={savedIds.includes(detail.id)} canDelete={canDelete(detail)} onClose={() => setDetail(null)} onToggleSave={toggleSave} onDelete={deleteTrend} />}

      <div className={"toast " + (toast ? "is-on" : "")}>{toast}</div>

      <TweaksPanel>
        <TweakSection label="Direção visual" />
        <TweakRadio label="Estilo" value={t.direction} options={[{ value: "a", label: "Aurora" }, { value: "b", label: "Canvas" }]} onChange={(v) => setTweak("direction", v)} />
        <TweakSection label="Tema" />
        <TweakToggle label="Modo escuro" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakColor label="Acento" value={t.accent} options={[
          ["oklch(55% 0.205 295)", "oklch(49% 0.215 294)"],
          ["oklch(60% 0.16 252)", "oklch(53% 0.17 255)"],
          ["oklch(66% 0.17 32)", "oklch(59% 0.18 30)"],
        ]} onChange={(v) => setTweak("accent", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
