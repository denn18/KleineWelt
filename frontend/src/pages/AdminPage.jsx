import { useMemo, useState } from 'react';
import axios from 'axios';

const tabs = { pending: 'In Prüfung', missing: 'Nachweis fehlt', approved: 'Freigegeben', rejected: 'Abgelehnt' };

export default function AdminPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [auth, setAuth] = useState('');
  const [caregivers, setCaregivers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('pending');
  const [reason, setReason] = useState('');
  const headers = useMemo(() => (auth ? { Authorization: auth } : {}), [auth]);

  async function login(event) {
    event.preventDefault();
    const nextAuth = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
    const response = await axios.get('/api/admin/caregivers/verifications', { headers: { Authorization: nextAuth } });
    setAuth(nextAuth); setCaregivers(response.data);
  }
  async function refresh() { const response = await axios.get('/api/admin/caregivers/verifications', { headers }); setCaregivers(response.data); }
  async function review(id, verificationStatus) {
    await axios.patch(`/api/admin/caregivers/${id}/verification`, { verificationStatus, verificationRejectionReason: reason }, { headers });
    setReason(''); setSelected(null); await refresh();
  }
  if (!auth) return <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow"><h1 className="text-2xl font-semibold text-brand-700">Admin</h1><form onSubmit={login} className="mt-6 grid gap-4"><input className="rounded-xl border p-3" placeholder="Benutzername" value={credentials.username} onChange={(e)=>setCredentials({...credentials, username:e.target.value})}/><input className="rounded-xl border p-3" type="password" placeholder="Passwort" value={credentials.password} onChange={(e)=>setCredentials({...credentials, password:e.target.value})}/><button className="rounded-full bg-brand-500 px-5 py-3 font-semibold text-white">Einloggen</button></form></section>;
  const visible = caregivers.filter((c) => (c.verificationStatus || 'missing') === tab);
  return <section className="mx-auto max-w-6xl rounded-3xl bg-white/90 p-8 shadow-xl"><h1 className="text-3xl font-semibold text-brand-700">Pflegeerlaubnis prüfen</h1><div className="mt-6 flex flex-wrap gap-2">{Object.entries(tabs).map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`rounded-full px-4 py-2 ${tab===key?'bg-brand-500 text-white':'bg-brand-50 text-brand-700'}`}>{label}</button>)}</div><div className="mt-6 grid gap-3">{visible.map(c=><article key={c.id} className="rounded-2xl border p-4"><div className="grid gap-2 md:grid-cols-6"><strong>{c.name}</strong><span>{c.daycareName}</span><span>{c.email}</span><span>{c.postalCode} {c.city}</span><span>{c.carePermissionUploadedAt ? new Date(c.carePermissionUploadedAt).toLocaleString('de-DE') : '—'}</span><button className="font-semibold text-brand-700" onClick={()=>setSelected(c)}>Prüfen</button></div></article>)}</div>{selected && <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5"><h2 className="text-xl font-semibold">{selected.daycareName || selected.name}</h2><p>{selected.name} · {selected.email} · {selected.postalCode} {selected.city}</p><p className="mt-2">Datei: {selected.carePermissionOriginalName || 'Keine Datei'} · Status: {selected.verificationStatus}</p>{selected.carePermissionDocumentUrl && <a className="mt-3 inline-block font-semibold text-brand-700" href={`/api/admin/caregivers/${selected.id}/care-permission`} target="_blank" rel="noreferrer">Pflegeerlaubnis öffnen</a>}<textarea className="mt-4 w-full rounded-xl border p-3" placeholder="Ablehnungsgrund / Interne Notiz" value={reason} onChange={(e)=>setReason(e.target.value)} /><div className="mt-4 flex gap-3"><button onClick={()=>review(selected.id,'approved')} className="rounded-full bg-emerald-600 px-5 py-2 font-semibold text-white">Freigeben</button><button onClick={()=>review(selected.id,'rejected')} className="rounded-full bg-rose-600 px-5 py-2 font-semibold text-white">Ablehnen</button><button onClick={()=>review(selected.id,'rejected')} className="rounded-full border px-5 py-2 font-semibold">Nachweis erneut anfordern</button></div></div>}</section>;
}
