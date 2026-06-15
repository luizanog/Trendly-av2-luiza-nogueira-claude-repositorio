/* modals.jsx — AddTrendModal, TrendDetail, AIBanner, Dashboard, EmptyState, Toast */
const { useState: useS2, useRef: useR2, useEffect: useE2 } = React;

/* ---------- add a trend ---------- */
function AddTrendModal({ onClose, onCreate }) {
  const [title, setTitle] = useS2("");
  const [category, setCategory] = useS2(window.CATEGORIES[0]);
  const [desc, setDesc] = useS2("");
  const [briefing, setBriefing] = useS2("");
  const [image, setImage] = useS2(null);
  const [cover, setCover] = useS2(0);
  const [drag, setDrag] = useS2(false);
  const [busy, setBusy] = useS2(false);
  const [aiBusy, setAiBusy] = useS2(false);
  const [aiPrev, setAiPrev] = useS2(null);
  const [aiNote, setAiNote] = useS2("");
  const fileRef = useR2(null);

  const refineDesc = async () => {
    const base = desc.trim();
    if (base.length < 4) { setAiNote("Escreva uma ideia básica primeiro ✦"); return; }
    setAiNote(""); setAiBusy(true);
    try {
      const prompt = `Você é um editor especialista em design. Reescreva a descrição de uma tendência de design de forma clara, concisa e inspiradora, em português do Brasil. No máximo 2 frases curtas, até 175 caracteres no total. Não use aspas, emojis nem títulos. Mantenha o sentido da ideia original.\n\nTítulo: ${title.trim() || "(sem título)"}\nCategoria: ${category}\nIdeia básica do autor: ${base}\n\nResponda apenas com a descrição melhorada, sem comentários.`;
      let out = "";
      if (window.claude && window.claude.complete) {
        // Ambiente de preview (Claude embutido)
        out = await window.claude.complete(prompt);
      } else {
        // Site publicado → chama a função serverless /api/refine
        const resp = await fetch("/api/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), category, desc: base }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          if (resp.status === 404) { setAiNote("IA indisponível (função /api/refine não encontrada)."); return; }
          setAiNote("Erro " + resp.status + ": " + (data.error || "?") + (data.detail ? " — " + data.detail : ""));
          return;
        }
        out = data.text || "";
      }
      const clean = (out || "").trim().replace(/^["'\s]+|["'\s]+$/g, "").slice(0, 180);
      if (clean) { setAiPrev(base); setDesc(clean); setAiNote(""); }
      else setAiNote("Não consegui refinar. Tente de novo.");
    } catch (e) { setAiNote("Falha de rede: " + ((e && e.message) || "desconhecida")); }
    finally { setAiBusy(false); }
  };
  const undoAi = () => { if (aiPrev != null) { setDesc(aiPrev); setAiPrev(null); } };

  const pick = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try { setImage(await window.fileToDataURL(file)); } finally { setBusy(false); }
  };

  const valid = title.trim().length > 1 && desc.trim().length > 1;
  const submit = () => {
    if (!valid) return;
    onCreate({
      id: "t" + Date.now().toString(36),
      title: title.trim(), category, desc: desc.trim(),
      briefing: briefing.trim() || "Sem briefing de aplicação ainda — adicione orientações de uso.",
      image, cover, author: "Você", saves: 0, created: Date.now(),
    });
  };

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal card" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <div>
            <span className="mono modal__eyebrow">NOVA TENDÊNCIA</span>
            <h2 className="modal__title">Adicione sua ideia</h2>
          </div>
          <button className="icon-btn icon-btn--ghost" onClick={onClose} aria-label="Fechar"><IconClose size={22} /></button>
        </header>

        <div className="modal__body addgrid">
          {/* left: image */}
          <div className="addgrid__media">
            <div
              className={"drop " + (drag ? "is-drag " : "") + (image ? "has-img" : "")}
              onClick={() => fileRef.current && fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
              style={image ? { backgroundImage: `url(${image})` } : { background: window.coverFor(cover) }}
            >
              {!image && (
                <div className="drop__inner">
                  <span className="drop__ico"><IconImage size={26} /></span>
                  <p className="drop__t">{busy ? "Processando…" : "Arraste uma imagem"}</p>
                  <p className="drop__s mono">ou clique para enviar</p>
                </div>
              )}
              {image && <button className="drop__clear" onClick={(e) => { e.stopPropagation(); setImage(null); }}><IconClose size={16} /></button>}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
            </div>
            {!image && (
              <div className="covers">
                <span className="covers__cap mono">CAPA GERADA</span>
                <div className="covers__row">
                  {window.COVERS.map((g, i) => (
                    <button key={i} className={"swatch " + (cover === i ? "is-on" : "")} style={{ background: g }} onClick={() => setCover(i)} aria-label={`Capa ${i + 1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* right: fields */}
          <div className="addgrid__form">
            <label className="field">
              <span className="field__label">Título</span>
              <input className="input" value={title} maxLength={60} placeholder="ex. Gradientes aurora" onChange={(e) => setTitle(e.target.value)} />
            </label>

            <div className="field">
              <span className="field__label">Categoria</span>
              <div className="chips">
                {window.CATEGORIES.map((c) => (
                  <button key={c} className={"chip " + (category === c ? "is-sel" : "")} onClick={() => setCategory(c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="field">
              <div className="field__top">
                <span className="field__label">Descrição</span>
                <button type="button" className={"ai-mini " + (aiBusy ? "is-busy" : "")} onClick={refineDesc} disabled={aiBusy}>
                  <span className={"ai-mini__ico " + (aiBusy ? "spin" : "")}>{aiBusy ? <span className="dot-loader" /> : <IconSparkle size={13} />}</span>
                  {aiBusy ? "Refinando…" : "Refinar com IA"}
                </button>
              </div>
              <textarea className={"input input--area " + (aiBusy ? "is-ai" : "")} rows={2} value={desc} maxLength={180} placeholder="Escreva sua ideia — depois refine com a IA se quiser" onChange={(e) => { setDesc(e.target.value); setAiPrev(null); }} />
              <div className="ai-foot">
                {aiPrev != null && !aiBusy && <button type="button" className="ai-undo" onClick={undoAi}><IconArrowL size={13} /> desfazer refinamento</button>}
                {aiNote && <span className="ai-note">{aiNote}</span>}
                {!aiNote && aiPrev == null && <span className="ai-hint mono">opcional — escreva à mão ou peça ajuda à IA</span>}
              </div>
            </div>

            <label className="field">
              <span className="field__label">Briefing de aplicação <span className="field__hint">como o time deve usar</span></span>
              <textarea className="input input--area" rows={3} value={briefing} maxLength={280} placeholder="Onde aplicar, cuidados, do's & don'ts…" onChange={(e) => setBriefing(e.target.value)} />
            </label>
          </div>
        </div>

        <footer className="modal__foot">
          <span className="mono modal__save-note">salvo automaticamente neste navegador</span>
          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
            <button className={"btn btn--primary " + (valid ? "" : "is-disabled")} onClick={submit}>Publicar tendência</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ---------- trend detail ---------- */
function TrendDetail({ trend, saved, onClose, onToggleSave, onDelete }) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal card detail" onMouseDown={(e) => e.stopPropagation()}>
        <button className="icon-btn icon-btn--ghost detail__x" onClick={onClose} aria-label="Fechar"><IconClose size={22} /></button>
        <div className="detail__grid">
          <div className="detail__media"><Cover trend={trend} className="cover--full" /></div>
          <div className="detail__content">
            <div className="detail__top">
              <span className="tag tag--cat tag--static">{trend.category}</span>
              {trend.example && <span className="tag tag--ex mono">exemplo</span>}
            </div>
            <h2 className="detail__title">{trend.title}</h2>
            <div className="detail__by">
              <span className="who__dot">{(trend.author || "?")[0]}</span>
              <span>{trend.author}</span><span className="dot-sep">·</span>
              <span className="muted-txt"><IconClock size={14} /> {window.timeAgo(trend.created)}</span>
            </div>
            <p className="detail__desc">{trend.desc}</p>

            <div className="brief">
              <span className="mono brief__label"><IconLayers size={15} /> BRIEFING DE APLICAÇÃO</span>
              <p className="brief__text">{trend.briefing}</p>
            </div>

            <div className="detail__actions">
              <button className={"btn " + (saved ? "btn--primary" : "btn--ghost")} onClick={() => onToggleSave(trend.id)}>
                {saved ? <IconHeartFill size={18} /> : <IconHeart size={18} />} {saved ? "Salva" : "Salvar"}
              </button>
              <button className="btn btn--ghost"><IconShare size={18} /> Compartilhar</button>
              <button className="icon-btn icon-btn--danger" onClick={() => { onDelete(trend.id); onClose(); }} aria-label="Excluir"><IconTrash size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- AI assist banner (on search) ---------- */
function AIBanner({ query, count, onClear }) {
  return (
    <div className="card aibanner">
      <span className="aibanner__ico"><IconSparkle size={20} /></span>
      <div className="aibanner__txt">
        <p className="aibanner__line">Busca assistida por <strong>“{query}”</strong></p>
        <p className="aibanner__sub mono">{count} tendência{count === 1 ? "" : "s"} interpretada{count === 1 ? "" : "s"} pela IA · refine com filtros</p>
      </div>
      <button className="btn btn--ghost btn--sm" onClick={onClear}>Limpar</button>
    </div>
  );
}

/* ---------- empty state ---------- */
function EmptyState({ title, sub, action, onAction }) {
  return (
    <div className="empty">
      <span className="empty__ico"><IconCompass size={30} /></span>
      <h3 className="empty__t">{title}</h3>
      <p className="empty__s">{sub}</p>
      {action && <button className="btn btn--primary" onClick={onAction}>{action}</button>}
    </div>
  );
}

/* ---------- dashboard ---------- */
function Dashboard({ trends, savedIds, onAdd, onOpen }) {
  const total = trends.length;
  const saved = savedIds.length;
  const mine = trends.filter((t) => t.author === "Você").length;
  const byCat = {};
  trends.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + 1; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...cats.map((c) => c[1]));
  const recent = [...trends].sort((a, b) => b.created - a.created).slice(0, 4);

  const stats = [
    ["Tendências", total, IconLayers],
    ["Na coleção", saved, IconBookmark],
    ["Suas ideias", mine, IconSparkle],
    ["Categorias", cats.length, IconGrid],
  ];

  return (
    <div className="dash">
      <div className="dash__stats">
        {stats.map(([label, val, Icon]) => (
          <div key={label} className="card stat">
            <span className="stat__ico"><Icon size={20} /></span>
            <span className="stat__val">{val}</span>
            <span className="stat__label">{label}</span>
          </div>
        ))}
      </div>
      <div className="dash__cols">
        <div className="card panel">
          <h3 className="panel__title">Tendências por categoria</h3>
          <div className="bars">
            {cats.length === 0 && <p className="muted-txt">Sem dados ainda.</p>}
            {cats.map(([c, n], i) => (
              <div key={c} className="bar">
                <span className="bar__label">{c}</span>
                <span className="bar__track"><span className="bar__fill" style={{ width: `${(n / maxCat) * 100}%`, background: window.coverFor(i) }} /></span>
                <span className="bar__n mono">{n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card panel">
          <h3 className="panel__title">Adicionadas recentemente</h3>
          <div className="recent">
            {recent.map((t) => (
              <button key={t.id} className="recent__row" onClick={() => onOpen(t)}>
                <span className="recent__thumb"><Cover trend={t} /></span>
                <span className="recent__meta">
                  <span className="recent__t">{t.title}</span>
                  <span className="recent__s mono">{t.category} · {window.timeAgo(t.created)}</span>
                </span>
                <IconChevR size={18} />
              </button>
            ))}
          </div>
          <button className="btn btn--primary dash__add" onClick={onAdd}><IconPlus size={18} /> Nova tendência</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AddTrendModal, TrendDetail, AIBanner, EmptyState, Dashboard });
