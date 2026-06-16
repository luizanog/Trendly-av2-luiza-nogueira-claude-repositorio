/* supabase.js — cliente Supabase + auxiliares de login e dados.
   Carregado como script normal, DEPOIS do CDN do supabase e do config.js.
   Se as chaves não estiverem preenchidas, window.SB.enabled = false e o app
   cai no modo visitante (localStorage), sem quebrar nada. */

(function () {
  var URL = window.SUPABASE_URL;
  var KEY = window.SUPABASE_ANON_KEY;
  var ENABLED = !!(URL && KEY && window.supabase && window.supabase.createClient);
  var client = ENABLED ? window.supabase.createClient(URL, KEY) : null;

  function mapRow(r, userId) {
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      desc: r.description || "",
      briefing: r.briefing || "",
      image: r.image || null,
      cover: r.cover || 0,
      author: r.author || "Anônimo",
      saves: r.saves || 0,
      created: r.created_at ? Date.parse(r.created_at) : Date.now(),
      example: !r.user_id,
      mine: !!(userId && r.user_id === userId),
    };
  }

  function nameOf(user) {
    if (!user) return "Anônimo";
    var n = user.user_metadata && user.user_metadata.full_name;
    if (n && n.trim()) return n.trim();
    return (user.email || "Anônimo").split("@")[0];
  }

  var SB = {
    enabled: ENABLED,
    client: client,

    async currentUser() {
      if (!client) return null;
      var res = await client.auth.getUser();
      return (res.data && res.data.user) || null;
    },

    onAuth(cb) {
      if (!client) return;
      client.auth.onAuthStateChange(function (_e, session) {
        cb(session && session.user ? session.user : null);
      });
    },

    async signUp(email, password, name) {
      if (!client) return { error: "Supabase não configurado." };
      var res = await client.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: name || "" } },
      });
      if (res.error) return { error: res.error.message };
      return { user: res.data.user, session: res.data.session };
    },

    async signIn(email, password) {
      if (!client) return { error: "Supabase não configurado." };
      var res = await client.auth.signInWithPassword({ email: email, password: password });
      if (res.error) return { error: res.error.message };
      return { user: res.data.user, session: res.data.session };
    },

    async signOut() {
      if (client) await client.auth.signOut();
    },

    async fetchTrends(userId) {
      var res = await client.from("trends").select("*").order("created_at", { ascending: false });
      if (res.error) throw res.error;
      return (res.data || []).map(function (r) { return mapRow(r, userId); });
    },

    async insertTrend(draft, user) {
      var payload = {
        title: draft.title,
        category: draft.category,
        description: draft.desc,
        briefing: draft.briefing,
        image: draft.image || null,
        cover: draft.cover || 0,
        author: nameOf(user),
        user_id: user.id,
      };
      var res = await client.from("trends").insert(payload).select().single();
      if (res.error) throw res.error;
      return mapRow(res.data, user.id);
    },

    async deleteTrend(id) {
      var res = await client.from("trends").delete().eq("id", id);
      if (res.error) throw res.error;
    },

    async fetchFavorites(userId) {
      var res = await client.from("favorites").select("trend_id").eq("user_id", userId);
      if (res.error) throw res.error;
      return (res.data || []).map(function (r) { return r.trend_id; });
    },

    async addFavorite(userId, trendId) {
      var res = await client.from("favorites").insert({ user_id: userId, trend_id: trendId });
      if (res.error) throw res.error;
    },

    async removeFavorite(userId, trendId) {
      var res = await client.from("favorites").delete().eq("user_id", userId).eq("trend_id", trendId);
      if (res.error) throw res.error;
    },
  };

  window.SB = SB;
})();
