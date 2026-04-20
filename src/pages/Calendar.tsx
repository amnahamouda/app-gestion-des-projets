import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import Select from "react-select";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
  };
}

interface User {
  id: number;
  nom_complet: string;
  email: string;
  role: string;
  departement: string;
}

interface Department {
  name: string;
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");

  // Vérifier si l'utilisateur peut modifier des événements
  const canModifyEvents = () => {
    return userRole === 'admin' || userRole === 'chef_projet';
  };

  // Fonction pour récupérer le token
  const getToken = () => {
    return localStorage.getItem('mdw-token');
  };

  // Récupérer tous les utilisateurs
  const fetchUsers = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/calendar/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
    }
  };

  // Récupérer les départements
  const fetchDepartments = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/calendar/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('❌ Erreur chargement départements:', error);
    }
  };

  // Récupérer les événements
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/calendar/events', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        setEvents([]);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.events) {
        const formattedEvents = data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          extendedProps: {
            ...event.extendedProps,
            calendar: event.extendedProps?.visibility === 'private' ? 'Danger' : 
                      event.extendedProps?.visibility === 'department' ? 'Warning' : 'Success'
          },
          backgroundColor: event.backgroundColor,
          borderColor: event.borderColor
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('❌ Erreur chargement événements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Créer ou mettre à jour un événement
  const handleAddOrUpdateEvent = async () => {
    // Vérifier si l'utilisateur a le droit
    if (!canModifyEvents()) {
      alert("Vous n'avez pas le droit de créer ou modifier des événements");
      return;
    }

    try {
      const token = getToken();
      
      if (!token) {
        alert('Vous devez être connecté pour ajouter un événement');
        return;
      }

      let visibility = 'public';
      if (eventLevel === 'Danger') visibility = 'private';
      else if (eventLevel === 'Warning') visibility = 'department';
      else if (eventLevel === 'Primary' || eventLevel === 'Success') visibility = 'public';

      const eventData: any = {
  title: eventTitle,
  description: `Événement ${eventTitle}`,
  start_date: eventStartDate,
  end_date: eventEndDate || eventStartDate,
  start_time: eventStartTime,
  end_time: eventEndTime,
  visibility: visibility,
  all_day: false,
  color: eventLevel === 'Danger' ? '#ef4444' :
         eventLevel === 'Warning' ? '#f59e0b' :
         eventLevel === 'Success' ? '#10b981' : '#5b6cff'
};

      // Ajouter le département si visibilité = department
      if (visibility === 'department' && selectedDepartment) {
        eventData.department = selectedDepartment;
      }

      // Ajouter les participants si visibilité = private
      if (visibility === 'private' && selectedParticipants.length > 0) {
        eventData.participants = selectedParticipants;
      }

      console.log('📤 Envoi données:', eventData);

      let url = 'http://localhost:5000/api/calendar/events';
      let method = 'POST';

      if (selectedEvent) {
        url = `http://localhost:5000/api/calendar/events/${selectedEvent.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      if (response.status === 401) {
        alert('Session expirée, veuillez vous reconnecter');
        return;
      }

      if (response.ok) {
        console.log('✅ Événement sauvegardé avec succès');
        await fetchEvents();
        closeModal();
        resetModalFields();
      } else {
        const error = await response.json();
        alert('Erreur: ' + (error.message || 'Impossible de sauvegarder l\'événement'));
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Vérifier si l'utilisateur a le droit
    if (!canModifyEvents()) {
      alert("Vous n'avez pas le droit de supprimer des événements");
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('✅ Événement supprimé');
        await fetchEvents();
        closeModal();
        resetModalFields();
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // Seuls les admins et chefs peuvent ajouter des événements
    if (!canModifyEvents()) {
      alert("Vous n'avez pas le droit d'ajouter des événements");
      return;
    }
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    
    const visibility = event.extendedProps?.visibility;
    if (visibility === 'private') setEventLevel('Danger');
    else if (visibility === 'department') setEventLevel('Warning');
    else setEventLevel('Success');
    
    openModal();
  };

  const resetModalFields = () => {
  setEventTitle("");
  setEventStartDate("");
  setEventEndDate("");
  setEventStartTime("");
  setEventEndTime("");
  setEventLevel("");
  setSelectedEvent(null);
  setSelectedParticipants([]);
  setSelectedDepartment("");
};

  useEffect(() => {
    // Récupérer le rôle de l'utilisateur depuis localStorage
    const userStr = localStorage.getItem('mdw-user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        console.log("👤 Rôle utilisateur:", user.role);
      } catch (e) {
        console.error("Erreur parsing user:", e);
      }
    }
    
    fetchUsers();
    fetchDepartments();
    fetchEvents();
  }, []);

  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="event-fc-color flex fc-event-main p-1 rounded-sm">
        <div className="fc-daygrid-event-dot"></div>
        <div className="fc-event-time">{eventInfo.timeText}</div>
        <div className="fc-event-title">{eventInfo.event.title}</div>
      </div>
    );
  };

  // Options pour React Select
  const userOptions = allUsers.map(user => ({
    value: user.id,
    label: `${user.nom_complet} (${user.role === 'chef_projet' ? 'Chef' : user.role === 'admin' ? 'Admin' : 'Employé'}) - ${user.departement || 'Aucun département'}`
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Calendrier | Tableau de bord"
        description="Gestion des événements du calendrier"
      />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: canModifyEvents() ? "prev,next addEventButton" : "prev,next",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            events={events}
            selectable={canModifyEvents()}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={canModifyEvents() ? {
              addEventButton: {
                text: "+ Ajouter un événement",
                click: () => {
                  resetModalFields();
                  openModal();
                }
              }
            } : {}}
            height="auto"
          />
        </div>

        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Détails de l'événement" : canModifyEvents() ? "Ajouter un événement" : "Détails de l'événement"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {canModifyEvents() ? "Planifiez votre prochain événement" : "Informations de l'événement"}
              </p>
            </div>
<div className="mt-8">
  {/* Titre */}
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
      Titre de l'événement
    </label>
    <input
      type="text"
      value={eventTitle}
      onChange={(e) => setEventTitle(e.target.value)}
      disabled={!canModifyEvents()}
      className="..."
      placeholder="Ex: Réunion d'équipe"
    />
  </div>

  {/* Visibilité */}
  <div className="mt-6">
    <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
      Visibilité
    </label>
    <div className="flex flex-wrap items-center gap-4 sm:gap-5">
      {/* Admin options */}
      {userRole === 'admin' && (
        <>
          <label className="flex items-center">
            <input type="radio" name="event-level" value="Success" checked={eventLevel === "Success"}
              onChange={() => { setEventLevel("Success"); setSelectedParticipants([]); setSelectedDepartment(""); }}
              disabled={!canModifyEvents()} className="mr-2 disabled:opacity-50" />
            <span className="text-sm">🌍 Public (tout le monde)</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="event-level" value="Warning" checked={eventLevel === "Warning"}
              onChange={() => { setEventLevel("Warning"); setSelectedParticipants([]); }}
              disabled={!canModifyEvents()} className="mr-2 disabled:opacity-50" />
            <span className="text-sm">🏢 Département (équipe)</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="event-level" value="Danger" checked={eventLevel === "Danger"}
              onChange={() => { setEventLevel("Danger"); setSelectedDepartment(""); }}
              disabled={!canModifyEvents()} className="mr-2 disabled:opacity-50" />
            <span className="text-sm">🔒 Privé (participants uniquement)</span>
          </label>
        </>
      )}

      {/* Chef options - pas de Public */}
      {userRole === 'chef_projet' && (
        <>
          <label className="flex items-center">
            <input type="radio" name="event-level" value="Warning" checked={eventLevel === "Warning"}
              onChange={() => { setEventLevel("Warning"); setSelectedParticipants([]); }}
              disabled={!canModifyEvents()} className="mr-2 disabled:opacity-50" />
            <span className="text-sm">🏢 Département (équipe)</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="event-level" value="Danger" checked={eventLevel === "Danger"}
              onChange={() => { setEventLevel("Danger"); setSelectedDepartment(""); }}
              disabled={!canModifyEvents()} className="mr-2 disabled:opacity-50" />
            <span className="text-sm">🔒 Privé (participants uniquement)</span>
          </label>
        </>
      )}
    </div>
  </div>

  {/* 🏢 Sélection du département - pour "Département" */}
  {eventLevel === "Warning" && canModifyEvents() && (
    <div className="mt-6">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        🏢 Sélectionner le département
      </label>
      <select
        value={selectedDepartment}
        onChange={(e) => setSelectedDepartment(e.target.value)}
        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
      >
        <option value="">-- Choisir un département --</option>
        {departments.map((dept: Department) => (
          <option key={dept.name} value={dept.name}>{dept.name}</option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-2">
        ✉️ Tous les membres de ce département recevront une notification par email
      </p>
    </div>
  )}

  {/* 👥 Sélection des participants - pour "Privé" */}
  {eventLevel === "Danger" && canModifyEvents() && (
    <div className="mt-6">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        👥 Sélectionner les participants
      </label>
      <Select
        isMulti
        options={userOptions}
        onChange={(selected) => setSelectedParticipants(selected.map(s => s.value))}
        className="react-select-container"
        classNamePrefix="react-select"
        placeholder="Choisir les participants..."
        styles={{
          control: (base) => ({
            ...base,
            minHeight: '44px',
            borderRadius: '8px',
            borderColor: '#e2e8f0',
          })
        }}
      />
      <p className="text-xs text-gray-500 mt-2">
        ✉️ Ces personnes recevront une invitation par email
      </p>
    </div>
  )}

  {/* Dates */}
  <div className="mt-6">
    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
      Date de début
    </label>
    <input type="date" value={eventStartDate} onChange={(e) => setEventStartDate(e.target.value)}
      disabled={!canModifyEvents()} className="..." />
  </div>

  <div className="mt-6">
    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
      Heure de début
    </label>
    <input type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)}
      disabled={!canModifyEvents()} className="..." />
  </div>

  <div className="mt-6">
    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
      Heure de fin (optionnel)
    </label>
    <input type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)}
      disabled={!canModifyEvents()} className="..." />
  </div>
</div>

            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Fermer
              </button>
              {canModifyEvents() && selectedEvent && (
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id as string)}
                  type="button"
                  className="flex w-full justify-center rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 sm:w-auto"
                >
                  Supprimer
                </button>
              )}
              {canModifyEvents() && (
                <button
                  onClick={handleAddOrUpdateEvent}
                  type="button"
                  className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                >
                  {selectedEvent ? "Mettre à jour" : "Ajouter"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Calendar;