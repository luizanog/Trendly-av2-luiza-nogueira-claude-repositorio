/* ui.jsx — TopBar, Sidebar, FilterPanel, Cover, TrendCard, AddCard, Grid */
const { useState, useRef, useEffect } = React;

/* ---------- shared cover renderer ---------- */
function Cover({ trend, className = "", style = {} }) {
  if (trend.image) {
    return <div className={"cover " + className} style={{ ...style, backgroundImage: `url(${trend.image})` }} />;
  }
  const grad = window.coverFor(trend.cover ?? 0);
  return (
    <div className={"cover cover--gen " + className} style={{ ...style, background: grad }}>
      <div className="cover__mesh" />
      <span className="cover__tag mono">{trend.category}</span>
    </div>
  );
}

/* ---------- brand mark ---------- */
function Logo({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="Trendly início">
      <span className="brand__mark"><IconSparkle size={18} /></span>
      <span className="brand__name">Trendly</span>
    </button>
  );
}

/* ---------- top bar with AI search ---------- */
function TopBar({ onMenu, query, setQuery, onSearch, filters, setFilters, onAdd, onHome, resultCount }) {
  const [open, setOpen] = useState(false);          // filter dropdown
  const [listening, setListening] = useState(false);
  const [focus, setFocus] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const activeFilters = filters.cats.length + (filters.sort !== "recent" ? 1 : 0) + (filters.withImage ? 1 : 0);

  useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const startVoice = () => {
    if (listening) { setListening(false); clearTimeout(timerRef.current); return; }
    setListening(true);
    timerRef.current = setTimeout(() => {
      const phrase = "gradientes calmos para onboarding";
      setQuery(phrase);
      setListening(false);
      onSearch(phrase);
      inputRef.current && inputRef.current.focus();
    }, 2200);
  };

  return (
    <header className="topbar glass">
      <div className="topbar__row">
        <button className="icon-btn icon-btn--ghost menu-btn" onClick={onMenu} aria-label="Menu">
          <IconMenu size={22} />
        </button>
        <Logo onClick={onHome} />

        <div className={"search " + (focus ? "is-focus " : "") + (listening ? "is-listening" : "")} ref={wrapRef}>
          <span className="search__ai" title="Busca assistida por IA">
            <IconSparkle size={18} />
          </span>
          <input
            ref={inputRef}
            className="search__input"
            value={query}
            placeholder={listening ? "Ouvindo…" : "Descreva uma tendência, estilo ou ideia…"}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onKeyDown={(e) => { if (e.key === "Enter") { onSearch(query); setOpen(false); } }}
          />
          {listening && (
            <span className="wave" aria-hidden="true">
              {[0,1,2,3,4].map((i) => <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />)}
            </span>
          )}
          <div className="search__tools">
            <button className={"chip-btn " + (open || activeFilters ? "is-on" : "")} onClick={() => setOpen((v) => !v)} aria-label="Filtros">
              <IconSliders size={18} />
              {activeFilters > 0 && <span className="chip-btn__count">{activeFilters}</span>}
            </button>
            <button className={"chip-btn mic " + (listening ? "is-rec" : "")} onClick={startVoice} aria-label="Busca por voz">
              <IconMic size={18} />
            </button>
          </div>
          {open && (
            <FilterPanel filters={filters} setFilters={setFilters} resultCount={resultCount} onClose={() => setOpen(false)} />
          )}
        </div>

        <button className="btn btn--primary add-top" onClick={onAdd}>
          <IconPlus size={18} /> <span className="add-top__txt">Adicionar</span>
        </button>
        <button className="avatar" aria-label="Perfil">VC</button>
      </div>
    </header>
  );
}

/* ---------- filter dropdown ---------- */
function FilterPanel({ filters, setFilters, resultCount, onClose }) {
  const toggleCat = (c) =>
    setFilters((f) => ({ ...f, cats: f.cats.includes(c) ? f.cats.filter((x) => x !== c) : [...f.cats, c] }));
  const SORTS = [["recent", "Recentes"], ["popular", "Populares"], ["az", "A–Z"]];
  return (
    <div className="filters glass" onMouseDown={(e) => e.stopPropagation()}>
      <div className="filters__head">
        <span className="mono filters__label">FILTRAR</span>
        <button className="link-clear" onClick={() => setFilters({ cats: [], sort: "recent", withImage: false })}>Limpar</button>
      </div>
      <div className="filters__group">
        <span className="filters__cap">Categorias</span>
        <div className="chips">
          {window.CATEGORIES.map((c) => (
            <button key={c} className={"chip " + (filters.cats.includes(c) ? "is-sel" : "")} onClick={() => toggleCat(c)}>
              {filters.cats.includes(c) && <IconCheck size={14} />} {c}
            </button>
          ))}
        </div>
      </div>
      <div className="filters__group">
        <span className="filters__cap">Ordenar</span>
        <div className="seg">
          {SORTS.map(([k, label]) => (
            <button key={k} className={"seg__btn " + (filters.sort === k ? "is-on" : "")} onClick={() => setFilters((f) => ({ ...f, sort: k }))}>{label}</button>
          ))}
        </div>
      </div>
      <label className="switch-row">
        <span>Somente com imagem</span>
        <button className={"switch " + (filters.withImage ? "is-on" : "")} onClick={() => setFilters((f) => ({ ...f, withImage: !f.withImage }))}>
          <span className="switch__dot" />
        </button>
      </label>
      <button className="btn btn--primary filters__apply" onClick={onClose}>Ver {resultCount} resultados</button>
    </div>
  );
}

/* ---------- sidebar nav ---------- */
function Sidebar({ open, view, setView, onAdd, counts, onClose }) {
  const items = [
    ["discover", "Descobrir", IconCompass],
    ["collections", "Minha coleção", IconBookmark],
    ["dashboard", "Painel", IconGrid],
  ];
  return (
    <>
      <div className={"scrim " + (open ? "is-on" : "")} onClick={onClose} />
      <aside className={"sidebar glass " + (open ? "is-open" : "")}>
        <nav className="sidebar__nav">
          {items.map(([k, label, Icon]) => (
            <button key={k} className={"nav-item " + (view === k ? "is-active" : "")} onClick={() => { setView(k); onClose(); }}>
              <Icon size={20} />
              <span>{label}</span>
              {k === "collections" && counts.saved > 0 && <span className="nav-item__badge">{counts.saved}</span>}
            </button>
          ))}
        </nav>
        <button className="btn btn--primary sidebar__add" onClick={() => { onAdd(); onClose(); }}>
          <IconPlus size={18} /> Adicionar tendência
        </button>
        <div className="sidebar__foot">
          <p className="mono sidebar__hint">{counts.total} tendências · salvas no seu navegador</p>
        </div>
      </aside>
    </>
  );
}

/* ---------- trend card ---------- */
function TrendCard({ trend, saved, onOpen, onToggleSave, onDelete }) {
  return (
    <article className="card tcard" onClick={() => onOpen(trend)} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(trend); }}>
      <div className="tcard__cover">
        <Cover trend={trend} />
        <div className="tcard__tags">
          <span className="tag tag--cat">{trend.category}</span>
          {trend.example && <span className="tag tag--ex mono">exemplo</span>}
        </div>
        <button className={"save " + (saved ? "is-saved" : "")} onClick={(e) => { e.stopPropagation(); onToggleSave(trend.id); }} aria-label="Salvar">
          {saved ? <IconHeartFill size={18} /> : <IconHeart size={18} />}
        </button>
        <button className="del" onClick={(e) => { e.stopPropagation(); onDelete(trend.id); }} aria-label="Excluir">
          <IconTrash size={16} />
        </button>
      </div>
      <div className="tcard__body">
        <h3 className="tcard__title">{trend.title}</h3>
        <p className="tcard__desc">{trend.desc}</p>
        <div className="tcard__foot">
          <span className="who"><span className="who__dot">{(trend.author || "?")[0]}</span>{trend.author}</span>
          <span className="meta"><IconHeart size={14} /> {trend.saves + (saved ? 1 : 0)}</span>
        </div>
      </div>
    </article>
  );
}

/* ---------- explanatory add card ---------- */
function AddCard({ onAdd }) {
  return (
    <button className="card addcard" onClick={onAdd}>
      <span className="addcard__plus"><IconPlus size={26} /></span>
      <h3 className="addcard__title">Adicione sua ideia</h3>
      <p className="addcard__desc">Encontrou uma tendência? Publique com uma imagem de capa e um briefing de aplicação para o time.</p>
      <span className="addcard__cta">Começar <IconChevR size={16} /></span>
      <span className="addcard__decor" aria-hidden="true" />
    </button>
  );
}

Object.assign(window, { Cover, Logo, TopBar, FilterPanel, Sidebar, TrendCard, AddCard });
