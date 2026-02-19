-- Set search path to simplify the script
SET search_path TO qihealth, public;

-- Create the Patient
INSERT INTO qihealth.patients (full_name, dob, notes) VALUES
  ('QiHealth Client', '1955-01-01', 'Oxygen dependent, PTSD, Anxiety, ADHD');

-- Insert Medications
INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Famotidine', '20 mg', 'Once Daily', 'Oral', true, 'Acid reducer' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Lisinopril/HCTZ', '20-25 mg', 'Once Daily', 'Oral', true, 'Blood pressure' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Metoprolol ER', '100 mg', 'Once Daily', 'Oral', true, 'Heart/Blood pressure' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Omeprazole', '40 mg', 'Once Daily', 'Oral', true, 'GERD/Stomach' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Atorvastatin', '20 mg', 'Once Daily', 'Oral', true, 'Cholesterol' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Vitamin D', 'Supplement', 'Once Daily', 'Oral', true, '' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Baby Aspirin', '81 mg', 'Once Daily', 'Oral', true, 'CV Protection' FROM qihealth.patients LIMIT 1;

-- Bedtime Meds
INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Cyclobenzaprine', '5 mg', 'Bedtime', 'Oral', true, 'Muscle relaxer' FROM qihealth.patients LIMIT 1;

-- Pulmonary Specific
INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Roflumilast (Daliresp)', '500 mcg', 'Daily', 'Oral', true, 'COPD prevention. Started 1/29/2026. Expires 1/29/2027.' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Azithromycin', '250 mg', 'Mon/Wed/Fri', 'Oral', true, 'Long-term for COPD (not HIV)' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Prednisone', '5 mg', 'Taper', 'Oral', true, 'Started 2/7/2026. Flare-up control.' FROM qihealth.patients LIMIT 1;

-- PRN Meds
INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Acetaminophen', '500 mg', 'PRN', 'Oral', true, 'Pain/Inflammation. Usually once daily PRN.' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Ibuprofen', '800 mg', 'PRN', 'Oral', true, 'Inflammation/Pain' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Gabapentin', '600 mg', 'PRN (up to 3x/day)', 'Oral', true, 'Nerve Pain' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Benadryl', 'Standard', 'PRN', 'Oral', true, 'Allergy/Sleep' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Maalox/Mylanta', 'Standard', 'PRN', 'Oral', true, 'GI/Stomach relief' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Mucinex Liquid', 'Standard', 'PRN', 'Oral', true, 'Mucus' FROM qihealth.patients LIMIT 1;

-- Respiratory Treatments
INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Oxygen', '3L Day / 2.5-3L Night', 'Continuous', 'Inhalation', true, '24/7 Oxygen Therapy' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Albuterol Solution', '0.083% (2.5mg/3ml)', 'Up to 6x/day', 'Nebulizer', true, '' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Ipratropium Bromide', '0.06% Nasal Spray', '2x Daily', 'Nasal', true, 'Likely 2x daily' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.medications (patient_id, name, dose, frequency, route, active, notes) 
SELECT id, 'Saline Nasal Mist', 'Mist', 'As Needed', 'Nasal', true, '' FROM qihealth.patients LIMIT 1;


-- Insert Conditions
INSERT INTO qihealth.conditions (patient_id, name, status, notes)
SELECT id, 'COPD', 'Active', 'Oxygen Dependent' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.conditions (patient_id, name, status, notes)
SELECT id, 'PTSD', 'Active', '' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.conditions (patient_id, name, status, notes)
SELECT id, 'Anxiety', 'Active', '' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.conditions (patient_id, name, status, notes)
SELECT id, 'ADHD', 'Active', '' FROM qihealth.patients LIMIT 1;

-- Insert Inventory
INSERT INTO qihealth.inventory_items (patient_id, name, quantity, notes)
SELECT id, 'Empty Oxygen Tanks', 5, 'Need Refill' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.inventory_items (patient_id, name, quantity, notes)
SELECT id, 'Spare Tanks', 2, 'With Regulators Attached (Ready)' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.inventory_items (patient_id, name, quantity, notes)
SELECT id, 'Tank in Use', 1, 'Active' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.inventory_items (patient_id, name, quantity, notes)
SELECT id, 'Double-D Tank', 1, 'In Medical Bag (Ready)' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.inventory_items (patient_id, name, quantity, notes)
SELECT id, 'E Tanks', 2, 'In Back Room (Confirmed)' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.inventory_items (patient_id, name, quantity, notes)
SELECT id, 'Oxygen Regulator (Cracked)', 1, 'Damaged at gauge. REPLACE ON NEXT ORDER.' FROM qihealth.patients LIMIT 1;

INSERT INTO qihealth.inventory_items (patient_id, name, quantity, notes)
SELECT id, 'Spare Hose', 1, 'Dirty - Needs washing + drying' FROM qihealth.patients LIMIT 1;
