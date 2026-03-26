import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

interface Configurations {
    assignation_enabled: string;
    rappel_deadline_enabled: string;
    alerte_risque_enabled: string;
    delai_rappel_jours: string;
    seuil_risque: string;
    canal_notification: string;
}

export default function NotificationConfig() {
    const { token, user } = useAuth();
    const [config, setConfig] = useState<Configurations>({
        assignation_enabled: 'true',
        rappel_deadline_enabled: 'true',
        alerte_risque_enabled: 'true',
        delai_rappel_jours: '2',
        seuil_risque: '50',
        canal_notification: 'interne,email'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

    // Vérifier que l'utilisateur est admin
    if (user?.role !== 'admin') {
        return (
            <div className="text-center py-12">
                <div className="text-4xl mb-4">⛔</div>
                <h2 className="text-xl font-bold text-gray-900">Accès refusé</h2>
                <p className="text-gray-500">Vous n'avez pas les droits administrateur</p>
            </div>
        );
    }

    // Charger les configurations
    const fetchConfig = async () => {
        try {
            const response = await fetch(`${API_URL}/notifications/configurations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setConfig(data.configurations);
            }
        } catch (error) {
            console.error('Erreur chargement config:', error);
        } finally {
            setLoading(false);
        }
    };

    // Sauvegarder les configurations
    const saveConfig = async () => {
        setSaving(true);
        setMessage(null);
        
        // Validation
        const delai = parseInt(config.delai_rappel_jours);
        if (delai < 0) {
            setMessage({ type: 'error', text: 'Le délai de rappel ne peut pas être négatif' });
            setSaving(false);
            return;
        }
        
        const seuil = parseInt(config.seuil_risque);
        if (seuil < 0 || seuil > 100) {
            setMessage({ type: 'error', text: 'Le seuil de risque doit être entre 0 et 100' });
            setSaving(false);
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/notifications/configurations`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: '✅ Configurations sauvegardées avec succès' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Erreur lors de la sauvegarde' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    if (loading) {
        return <div className="text-center py-12">Chargement...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">⚙️ Configuration des notifications</h1>
            <p className="text-gray-500 mb-6">Personnalisez le comportement des notifications du système</p>
            
            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}
            
            <div className="space-y-6 bg-white rounded-xl border p-6">
                
                {/* Activation/Désactivation */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Activation des notifications</h3>
                    
                    <label className="flex items-center justify-between">
                        <span>📋 Notification d'assignation</span>
                        <input
                            type="checkbox"
                            checked={config.assignation_enabled === 'true'}
                            onChange={(e) => setConfig({ ...config, assignation_enabled: e.target.checked ? 'true' : 'false' })}
                            className="w-5 h-5 text-blue-600"
                        />
                    </label>
                    
                    <label className="flex items-center justify-between">
                        <span>⏰ Rappel avant deadline</span>
                        <input
                            type="checkbox"
                            checked={config.rappel_deadline_enabled === 'true'}
                            onChange={(e) => setConfig({ ...config, rappel_deadline_enabled: e.target.checked ? 'true' : 'false' })}
                            className="w-5 h-5 text-blue-600"
                        />
                    </label>
                    
                    <label className="flex items-center justify-between">
                        <span>⚠️ Alerte de risque élevé</span>
                        <input
                            type="checkbox"
                            checked={config.alerte_risque_enabled === 'true'}
                            onChange={(e) => setConfig({ ...config, alerte_risque_enabled: e.target.checked ? 'true' : 'false' })}
                            className="w-5 h-5 text-blue-600"
                        />
                    </label>
                </div>
                
                {/* Paramètres */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Paramètres</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Délai de rappel (jours avant deadline)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="30"
                            value={config.delai_rappel_jours}
                            onChange={(e) => setConfig({ ...config, delai_rappel_jours: e.target.value })}
                            className="w-full p-2 border rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">Ex: 2 = rappel envoyé 2 jours avant la deadline</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Seuil de risque (%) pour alerte
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={config.seuil_risque}
                            onChange={(e) => setConfig({ ...config, seuil_risque: e.target.value })}
                            className="w-full p-2 border rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">Alerte envoyée si risque &gt; {config.seuil_risque}%</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Canal de notification
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={config.canal_notification.includes('interne')}
                                    onChange={(e) => {
                                        let newCanal = config.canal_notification;
                                        if (e.target.checked) {
                                            newCanal = newCanal.includes('interne') ? newCanal : `${newCanal},interne`;
                                        } else {
                                            newCanal = newCanal.replace('interne', '').replace(/,,/g, ',').replace(/^,|,$/g, '');
                                        }
                                        setConfig({ ...config, canal_notification: newCanal });
                                    }}
                                />
                                <span>🔔 Interne (dashboard)</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={config.canal_notification.includes('email')}
                                    onChange={(e) => {
                                        let newCanal = config.canal_notification;
                                        if (e.target.checked) {
                                            newCanal = newCanal.includes('email') ? newCanal : `${newCanal},email`;
                                        } else {
                                            newCanal = newCanal.replace('email', '').replace(/,,/g, ',').replace(/^,|,$/g, '');
                                        }
                                        setConfig({ ...config, canal_notification: newCanal });
                                    }}
                                />
                                <span>📧 Email</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div className="pt-4 border-t">
                    <button
                        onClick={saveConfig}
                        disabled={saving}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Sauvegarde...' : '💾 Sauvegarder les configurations'}
                    </button>
                </div>
            </div>
        </div>
    );
}