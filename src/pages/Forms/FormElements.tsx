import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

const members = [
  { id: 'U1', name: 'Amine Belhadj', role: 'Chef de projet' },
  { id: 'U2', name: 'Sara Mansouri', role: 'Employé' },
  { id: 'U3', name: 'Karim Ouali', role: 'Chef de projet' },
  { id: 'U4', name: 'Nadia Bouzid', role: 'Employé' },
  { id: 'U5', name: 'Mehdi Rahali', role: 'Employé' },
];

const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

export default function FormElements() {
  const navigate = useNavigate();
  const { isChef, isAdmin } = useAuth();

  const [form, setForm] = useState({
    name: '',
    description: '',
    chef: '',
    priority: 'moyenne',
    startDate: '',
    endDate: '',
    team: [] as string[],
    budget: '',
    status: 'en_attente',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Accès refusé si ni chef ni admin
  if (!isChef && !isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛔</div>
        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Accès refusé
        </p>
        <p style={{ fontSize: '0.875rem' }}>
          Vous n'avez pas les droits pour créer un projet.
        </p>
      </div>
    );
  }

  const handleTeamToggle = (id: string) => {
    setForm((prev) => ({
      ...prev,
      team: prev.team.includes(id)
        ? prev.team.filter((m) => m !== id)
        : [...prev.team, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.chef || !form.startDate || !form.endDate) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError('La date de fin doit être après la date de début.');
      return;
    }
    setError('');
    setSuccess(true);
    setTimeout(() => navigate('/projects'), 2000);
  };

  return (
    <div>
      <PageMeta
        title="Nouveau projet | Maison du Web"
        description="Créer un nouveau projet"
      />
      <PageBreadcrumb pageTitle="Nouveau projet" />

      <div className="max-w-3xl mx-auto">
        {/* Success */}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            <span className="text-lg">✅</span>
            <span className="text-sm font-medium">Projet créé avec succès ! Redirection...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <span className="text-lg">⚠️</span>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Informations générales */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-5 text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-sm">1</span>
              Informations générales
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Nom du projet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Refonte site e-commerce"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Décrivez les objectifs du projet..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Chef de projet <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.chef}
                    onChange={(e) => setForm((p) => ({ ...p, chef: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">-- Sélectionner --</option>
                    {members.filter((m) => m.role === 'Chef de projet').map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Statut initial</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="en_attente">En attente</option>
                    <option value="en_cours">En cours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Budget (DZD)</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
                  placeholder="Ex: 500000"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Priorité */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-5 text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-sm">2</span>
              Priorité du projet
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'haute', label: 'Haute', desc: 'Urgent', icon: '🔴', activeClass: 'border-red-500 bg-red-50 ring-2 ring-red-200', textClass: 'text-red-700' },
                { value: 'moyenne', label: 'Moyenne', desc: 'Normal', icon: '🟡', activeClass: 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200', textClass: 'text-yellow-700' },
                { value: 'basse', label: 'Basse', desc: 'Faible', icon: '🟢', activeClass: 'border-green-500 bg-green-50 ring-2 ring-green-200', textClass: 'text-green-700' },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, priority: p.value }))}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all cursor-pointer ${
                    form.priority === p.value
                      ? p.activeClass
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className={`text-sm font-semibold ${form.priority === p.value ? p.textClass : 'text-gray-600'}`}>
                    {p.label}
                  </span>
                  <span className="text-xs text-gray-400">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-5 text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-sm">3</span>
              Dates du projet
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Date de fin prévue <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Équipe */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-5 text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-sm">4</span>
              Membres de l'équipe
              {form.team.length > 0 && (
                <span className="ml-auto text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {form.team.length} sélectionné{form.team.length > 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <div className="space-y-2">
              {members.map((m) => {
                const selected = form.team.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                      selected
                        ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => handleTeamToggle(m.id)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-900 to-blue-600 text-white font-bold text-sm flex-shrink-0">
                      {m.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.role}</p>
                    </div>
                    {selected && <span className="text-blue-500 text-lg">✓</span>}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pb-6">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 py-3 text-sm font-semibold text-white hover:from-blue-800 hover:to-blue-600 transition-all shadow-lg shadow-blue-900/25"
            >
              Créer le projet →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}