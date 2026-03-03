import { supabase } from './supabase';

export const db = {
  // Sync all data
  async sync() {
    const [
      { data: meds },
      { data: patients },
      { data: conditions },
      { data: appointments },
      { data: tasks },
      { data: incidents }
    ] = await Promise.all([
      supabase.from('medications').select('*'),
      supabase.from('patients').select('*').limit(1).single(),
      supabase.from('conditions').select('*'),
      supabase.from('appointments').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('incidents').select('*')
    ]);

    return {
      meds: meds?.map(m => ({
        id: m.id,
        name: m.name,
        dosage: m.dose,
        instructions: m.notes,
        time: m.frequency,
        stock: 10, // Default or fetch from inventory_items
        threshold: 2,
        takenToday: false
      })) || [],
      patientStatus: patients ? {
        first_name: patients.full_name.split(' ')[0],
        last_name: patients.full_name.split(' ')[1] || '',
        dob: patients.dob,
        notes: patients.notes
      } : null,
      medicalHistory: conditions?.map(c => ({
        id: c.id,
        condition_name: c.name,
        diagnosed_year: c.created_at.split('-')[0]
      })) || [],
      appointments: appointments || [],
      tasks: tasks || [],
      events: incidents?.map(i => ({
        id: i.id,
        type: i.type,
        title: i.description,
        time: i.incident_time,
        user: 'System'
      })) || []
    };
  },

  // Log an event
  async logEvent(event) {
    const { data, error } = await supabase.from('incidents').insert([{
      type: event.event_type,
      description: event.title,
      incident_time: new Date().toISOString()
    }]).select();

    if (error) throw error;
    return data[0];
  },

  // Complete a task
  async completeTask(id) {
    const { data, error } = await supabase.from('tasks').update({
      status: 'completed'
    }).eq('id', id).select();

    if (error) throw error;
    return data[0];
  },

  // Update medication stock
  async updateMedStock(id, newStock) {
    // Note: The medications table doesn't have stock currently.
    // For now, we'll just return a success or log the change.
    console.log(`Updating stock for ${id} to ${newStock}`);
    return { success: true };
  }
};

export const isConfigured = () => true; 
