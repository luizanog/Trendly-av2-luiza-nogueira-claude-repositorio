/* auth.jsx — tela de login / criar conta (Supabase) */
const { useState: useAuthState } = React;

function translateAuthError(msg) {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid login")) return "Email ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Esse email já tem conta. Tente entrar.";
  if (m.includes("password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "Email inválido.";
  if (m.includes("email not confirmed")) return "Confirme seu email pelo link que enviamos antes de entrar.";
  if (m.includes("rate limit")) return "Muitas tentativas. Espere um pouquinho e tente de novo.";
  return msg || "Algo deu errado. Tente novamente.";
}

function AuthScreen({ sb }) {
  const [mode, setMode] = useAuthState("in"); // "in" | "up"
  const [name, setName] = useAuthState("");
  const [email, setEmail] = useAuthState("");
  const [pw, setPw] = useAuthState("");
  const [busy, setBusy] = useAuthState(false);
  const [err, setErr] = useAuthState("");
  const [info, setInfo] = useAuthState("");

  const switchMode = (m) => { setMode(m); setErr(""); setInfo(""); };

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setInfo("");
    if (!email.trim() || pw.length < 6) {
      setErr("Informe um email e uma senha de pelo menos 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const res = mode === "in"
        ? await sb.signIn(email.trim(), pw)
        : await sb.signUp(email.trim(), pw, name.trim());
      if (res.error) {
        setErr(translateAuthError(res.error));
      } else if (mode === "up" && !res.session) {
        // confirmação de email ativada no Supabase
        setInfo("Conta criada! Confirme pelo link enviado ao seu email e depois entre.");
        setMode("in");
      }
      // Em caso de sucesso com sessão, o onAuthStateChange leva ao app.
    } catch (e2) {
      setErr("Algo deu errado. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="authpage">
      <div className="authpage__glow" aria-hidden="true" />
      <div className="auth-card card">
        <div className="auth-brand">
          <span className="brand__mark"><IconSparkle size={20} /></span>
          <span className="brand__name">Trendly</span>
        </div>

        <h1 className="auth-title">{mode === "in" ? "Bem-vinda de volta" : "Crie sua conta"}</h1>
        <p className="auth-sub">
          {mode === "in"
            ? "Entre para descobrir e compartilhar tendências de design."
            : "Junte-se e compartilhe tendências com todo mundo."}
        </p>

        <div className="auth-tabs">
          <button className={mode === "in" ? "is-on" : ""} onClick={() => switchMode("in")}>Entrar</button>
          <button className={mode === "up" ? "is-on" : ""} onClick={() => switchMode("up")}>Criar conta</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "up" && (
            <label className="field">
              <span className="field__label">Nome</span>
              <input className="input" value={name} maxLength={40} placeholder="Como você quer aparecer" onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label className="field">
            <span className="field__label">Email</span>
            <input className="input" type="email" value={email} placeholder="voce@email.com" autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Senha</span>
            <input className="input" type="password" value={pw} placeholder="mínimo 6 caracteres" autoComplete={mode === "in" ? "current-password" : "new-password"} onChange={(e) => setPw(e.target.value)} />
          </label>

          {err && <div className="auth-msg auth-msg--err">{err}</div>}
          {info && <div className="auth-msg auth-msg--ok">{info}</div>}

          <button className="btn btn--primary auth-submit" disabled={busy}>
            {busy ? (mode === "in" ? "Entrando…" : "Criando…") : (mode === "in" ? "Entrar" : "Criar conta")}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "in" ? (
            <>Ainda não tem conta? <button onClick={() => switchMode("up")}>Criar agora</button></>
          ) : (
            <>Já tem conta? <button onClick={() => switchMode("in")}>Entrar</button></>
          )}
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { AuthScreen });
