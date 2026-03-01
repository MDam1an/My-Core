/* ================================================================
   db.js — Data Layer (localStorage, per-user)
   ================================================================ */

const DB = (() => {

  let _key = null;
  let _data = null;

  const DEFAULTS = () => ({
    transactions: [],
    goals: [],
    habits: [],
    skills: [],
    diary: [],
    achievements: [],
    config: {
      name: '',
      phrase: '"A disciplina é a ponte entre objetivos e conquistas."',
      metaMensal: 0,
      memberSince: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    },
    radarValues: { fin: 60, car: 60, sau: 60, rel: 60, con: 60 }
  });

  function initForUser(email, name) {
    const key = Auth.getDataKey(email);
    const def = DEFAULTS();
    def.config.name = name || '';
    localStorage.setItem(key, JSON.stringify(def));
  }

  function load(email) {
    _key = Auth.getDataKey(email);
    const raw = localStorage.getItem(_key);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        _data = Object.assign(DEFAULTS(), saved);
        // deep-merge config
        _data.config = Object.assign(DEFAULTS().config, saved.config || {});
      } catch(e) { _data = DEFAULTS(); }
    } else {
      _data = DEFAULTS();
    }
    return _data;
  }

  function save() {
    if (_key && _data) {
      localStorage.setItem(_key, JSON.stringify(_data));
    }
  }

  function get() { return _data; }

  function set(newData) {
    _data = newData;
    save();
  }

  function update(fn) {
    fn(_data);
    save();
  }

  return { load, save, get, set, update, initForUser };
})();
