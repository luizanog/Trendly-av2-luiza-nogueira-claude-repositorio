/* app.jsx — state, routing, persistence, tweaks, mount */
const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "a",
  "dark": false,
  "accent": ["oklch(55% 0.205 295)", "oklch(49% 0.215 294)"]
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [trends, setTrends] = useState(() => window.loadTrends());
  const [savedIds, setSavedIds] = useState(() => window.loadSaved());
  const [view, setView] = useState("discover");
  const [sidebar, setSidebar] = useState(false);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [filters, setFilters] = useState({ cats: [], sort: "recent", withImage: false });
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);

  /* persist */
  useEffect(() => { window.persistTrends(trends); }, [trends]);
  useEffect(() => { window.persistSaved(savedIds); }, [savedIds]);

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

  const flash = (msg) => { setToast(msg); clearTimeout(window.__tt); window.__tt = setTimeout(() => setToast(null), 2200); };

  /* actions */
  const createTrend = (trend) => {
    setTrends((list) => [trend, ...list]);
    setAddOpen(false);
    setView("discover");
    setActiveQuery(""); setQuery("");
    flash("Tendência publicada ✦");
  };
  const deleteTrend = (id) => {
    setTrends((list) => list.filter((x) => x.id !== id));
    setSavedIds((s) => s.filter((x) => x !== id));
    flash("Removida");
  };
  const toggleSave = (id) => {
    setSavedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };
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
        onAdd={() => setAddOpen(true)}
      />
      <Sidebar open={sidebar} view={view} setView={(v) => { setView(v); setActiveQuery(""); }} onAdd={() => setAddOpen(true)} counts={counts} onClose={() => setSidebar(false)} />

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

        {view === "dashboard" ? (
          <Dashboard trends={trends} savedIds={savedIds} onAdd={() => setAddOpen(true)} onOpen={setDetail} />
        ) : (
          <div className="grid">
            {view === "discover" && !activeQuery && <AddCard onAdd={() => setAddOpen(true)} />}
            {filtered.map((tr) => (
              <TrendCard key={tr.id} trend={tr} saved={savedIds.includes(tr.id)}
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

      {addOpen && <AddTrendModal onClose={() => setAddOpen(false)} onCreate={createTrend} />}
      {detail && <TrendDetail trend={detail} saved={savedIds.includes(detail.id)} onClose={() => setDetail(null)} onToggleSave={toggleSave} onDelete={deleteTrend} />}

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
