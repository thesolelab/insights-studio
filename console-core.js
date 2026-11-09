(function (root) {
  'use strict';
  const D = typeof module === 'object' && module.exports ? require('./chart-data.js') : root.ChartData;
  const id = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  function project(name) {
    return { id: id(), name: String(name).trim().slice(0, 100) || 'Untitled project', notes: '', tasks: [], datasets: [], charts: [], scenarios: [], decisions: [], workflows: [] };
  }
  function table(rows) {
    if (!Array.isArray(rows) || rows.length < 2 || rows.length > 10001) throw new Error('Use a header and 1–10,000 data rows.');
    if (!Array.isArray(rows[0]) || !rows[0].length || rows[0].length > 100) throw new Error('Use 1–100 columns.');
    const headers = rows[0].map(String).map(s => s.trim());
    if (headers.some(s => !s || s.length > 80) || new Set(headers).size !== headers.length) throw new Error('Use unique, nonblank headers of up to 80 characters.');
    if (rows.length * headers.length > 200000) throw new Error('Use at most 200,000 cells.');
    return [headers, ...rows.slice(1).map((r, i) => {
      if (!Array.isArray(r) || r.length > headers.length) throw new Error('Too many cells in row ' + (i + 2));
      return headers.map((_, c) => { const v = String(r[c] ?? ''); if (v.length > 20000) throw new Error('A cell is too long.'); return v; });
    })];
  }
  function clean(rows) {
    rows = table(rows);
    const seen = new Set();
    return table([rows[0], ...rows.slice(1).map(r => r.map(s => s.trim())).filter(r => {
      const key = JSON.stringify(r);
      if (!r.some(Boolean) || seen.has(key)) return false;
      seen.add(key); return true;
    })]);
  }
  function derive(rows, spec) {
    rows = table(rows);
    const a = rows[0].indexOf(spec.a), b = rows[0].indexOf(spec.b);
    const ops = { difference: (x,y) => x-y, sum: (x,y) => x+y, product: (x,y) => x*y, ratio: (x,y) => y === 0 ? NaN : x/y, change: (x,y) => y === 0 ? NaN : (x-y)/Math.abs(y) };
    if (a < 0 || b < 0 || !Object.hasOwn(ops, spec.op)) throw new Error('Choose two columns and a supported calculation.');
    const name = String(spec.name || '').trim();
    if (!name || name.length > 80 || rows[0].includes(name)) throw new Error('Choose a new, unique result column name.');
    return table([[...rows[0], name], ...rows.slice(1).map((r,i) => {
      const x = D.numberCell(r[a]), y = D.numberCell(r[b]);
      if (x === null || y === null) throw new Error('Nonnumeric input in row ' + (i+2));
      const v = ops[spec.op](x,y);
      if (!Number.isFinite(v)) throw new Error('Division by zero in row ' + (i+2));
      return [...r, String(v)];
    })]);
  }
  function keyed(rows, key) {
    rows = table(rows); const index = rows[0].indexOf(key), map = new Map();
    if (index < 0) throw new Error('Key column not found.');
    for (const r of rows.slice(1)) {
      const k = r[index].trim();
      if (!k || map.has(k)) throw new Error('Keys must be nonblank and unique: ' + k);
      map.set(k, r);
    }
    return { rows, index, map };
  }
  function compare(left, right, key) {
    const a = keyed(left,key), b = keyed(right,key);
    if (JSON.stringify(a.rows[0]) !== JSON.stringify(b.rows[0])) throw new Error('Comparison requires identical headers in the same order.');
    const changes = [['Change','Key','Column','Before','After']];
    for (const [k,r] of a.map) {
      if (!b.map.has(k)) changes.push(['Removed',k,'',JSON.stringify(r),'']);
      else r.forEach((v,c) => { if (v !== b.map.get(k)[c]) changes.push(['Changed',k,a.rows[0][c],v,b.map.get(k)[c]]); });
    }
    for (const [k,r] of b.map) if (!a.map.has(k)) changes.push(['Added',k,'','',JSON.stringify(r)]);
    return changes.length > 1 ? table(changes) : changes;
  }
  function join(left, right, key) {
    const a = keyed(left,key), b = keyed(right,key);
    const extra = b.rows[0].map((_,i) => i).filter(i => i !== b.index), headers = a.rows[0].slice();
    for (const i of extra) {
      let name = b.rows[0][i], suffix = 2;
      while (headers.includes(name)) name = b.rows[0][i] + ' (' + suffix++ + ')';
      headers.push(name);
    }
    return table([headers, ...a.rows.slice(1).map(row => {
      const match = b.map.get(row[a.index].trim());
      return [...row, ...extra.map(i => match ? match[i] : '')];
    })]);
  }
  function scenario(values) {
    const v = ['units','price','variable','fixed'].map(k => Number(values[k]));
    if (v.some(n => !Number.isFinite(n) || n < 0) || !Number.isInteger(v[0])) throw new Error('Use nonnegative values and whole units.');
    const [units,price,variable,fixed] = v, revenue = units*price, cost = units*variable+fixed;
    if (![revenue,cost].every(Number.isFinite)) throw new Error('Values are too large.');
    return { revenue, cost, profit: revenue-cost, margin: revenue ? (revenue-cost)/revenue : null, breakEven: price > variable ? Math.ceil(fixed/(price-variable)) : null };
  }
  function csv(rows) {
    return D.serializeTable(rows.map(r => r.map(v => /^[\s]*[=+@-]/.test(String(v)) && D.numberCell(v) === null ? "'" + v : v)));
  }
  function run(rows, steps) {
    if (!Array.isArray(steps) || steps.length > 30) throw new Error('Use at most 30 workflow steps.');
    return steps.reduce((r,s) => {
      if (s.type === 'clean') return clean(r);
      if (s.type === 'derive') return derive(r,s);
      throw new Error('Unsupported workflow step.');
    }, table(rows));
  }
  function importProject(text) {
    if (typeof text !== 'string' || text.length > 5*1024*1024) throw new Error('Project files must be under 5 MB.');
    const data = JSON.parse(text);
    if (data.version !== 1 || !data.project || typeof data.project.name !== 'string') throw new Error('Unsupported Stat Console project file.');
    const src = data.project, out = project(src.name);
    const string = v => { if (typeof v !== 'string' || v.length > 100000) throw new Error('Invalid project text.'); return v; };
    out.notes = string(src.notes || '');
    const lists = {
      tasks: ['title','owner','due','status'], datasets: ['name','rows'], charts: ['name','snapshot'],
      scenarios: ['name','values'], decisions: ['title','rationale','owner','review','next','status'], workflows: ['name','steps']
    };
    for (const [key, fields] of Object.entries(lists)) {
      if (!Array.isArray(src[key]) || src[key].length > 500) throw new Error('Invalid project collection: ' + key);
      out[key] = src[key].map(item => {
        if (!item || typeof item !== 'object') throw new Error('Invalid project record.');
        const record = { id: id() };
        for (const field of fields) {
          if (field === 'rows') record.rows = table(item.rows);
          else if (field === 'values') { scenario(item.values); record.values = Object.fromEntries(['units','price','variable','fixed'].map(k => [k,Number(item.values[k])])); }
          else if (field === 'snapshot') {
            const s = item.snapshot;
            if (!s || typeof s !== 'object' || !Array.isArray(s.rows)) throw new Error('Invalid chart.');
            table(s.rows); record.snapshot = JSON.parse(JSON.stringify(s));
          } else if (field === 'steps') {
            if (!Array.isArray(item.steps) || item.steps.length > 30) throw new Error('Invalid workflow.');
            record.steps = item.steps.map(s => {
              if (s.type === 'clean') return {type:'clean'};
              if (s.type !== 'derive') throw new Error('Invalid workflow operation.');
              return {type:'derive', a:string(s.a), b:string(s.b), op:string(s.op), name:string(s.name)};
            });
          } else record[field] = string(item[field] || '');
        }
        return record;
      });
    }
    return out;
  }
  const api = { id, project, table, clean, derive, compare, join, scenario, csv, run, importProject };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.ConsoleCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
