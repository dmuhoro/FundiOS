-- ============================================================
-- FundiOS seed — Quickstop Garage (pilot tenant)
-- PRD v0.1 § F2 — realistic demo data for the phase-1 skeleton
-- Deterministic IDs so commands stay stable across reseeds.
-- Run: npm run db:reset  (or apply directly in the DB console)
-- ============================================================

-- ── Tenant: Quickstop Garage ──────────────────────────────────
insert into tenants (id, name, slug, phone, email, address, plan_tier, wa_phone_id, meta_verified)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Quickstop Garage',
  'quickstop',
  '+254700000000',
  'bookings@quickstopgarage.co.ke',
  'Kiambu Road, Nairobi',
  'starter',
  '100000000000000',
  false
) on conflict (id) do nothing;

-- ── Owner login (password: pilot-pass-2026) ──────────────────
insert into auth.users (id, email, encrypted_password, email_confirmed_at)
values (
  '11111111-1111-1111-1111-111111111111',
  'owner@quickstopgarage.co.ke',
  crypt('pilot-pass-2026', gen_salt('bf')),
  now()
) on conflict (id) do nothing;

insert into users (id, garage_id, name, phone, role)
values (
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Daniel Kitungu',
  '+254700000000',
  'owner'
) on conflict (id) do nothing;

-- ── Customers (15, deterministic ids 0001…0015) ──────────────
insert into customers (id, garage_id, name, phone, wa_opt_in, created_at) values
  ('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John Kamau',      '+254722111001', true,  now() - interval '150 days'),
  ('00000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Faith Wanjiku',   '+254733111002', true,  now() - interval '140 days'),
  ('00000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Peter Omondi',    '+254711111003', true,  now() - interval '135 days'),
  ('00000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Grace Achieng',   '+254721111004', false, now() - interval '120 days'),
  ('00000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Samuel Njoroge',  '+254722111005', true,  now() - interval '110 days'),
  ('00000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Diana Muthoni',   '+254733111006', true,  now() - interval '100 days'),
  ('00000000-0000-0000-0000-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Brian Otieno',    '+254711111007', true,  now() - interval '95 days'),
  ('00000000-0000-0000-0000-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mercy Wambui',    '+254721111008', false, now() - interval '80 days'),
  ('00000000-0000-0000-0000-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kevin Mwangi',    '+254722111009', true,  now() - interval '70 days'),
  ('00000000-0000-0000-0000-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Esther Njeri',    '+254733111010', true,  now() - interval '60 days'),
  ('00000000-0000-0000-0000-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Michael Kimani',  '+254711111011', true,  now() - interval '50 days'),
  ('00000000-0000-0000-0000-000000000012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lucy Wairimu',    '+254721111012', false, now() - interval '40 days'),
  ('00000000-0000-0000-0000-000000000013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Francis Chege',   '+254722111013', true,  now() - interval '30 days'),
  ('00000000-0000-0000-0000-000000000014', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Catherine Akinyi','+254733111014', true,  now() - interval '20 days'),
  ('00000000-0000-0000-0000-000000000015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'David Koech',     '+254711111015', true,  now() - interval '10 days');

-- ── Vehicles (20, deterministic ids 200001…200020) ────────────
insert into vehicles (id, garage_id, customer_id, make, model, year, plate_number, color, mileage_km) values
  ('00000000-0000-0000-0000-000000200001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 'Toyota',   'Fielder',       2015, 'KDA 123A', 'White',    124500),
  ('00000000-0000-0000-0000-000000200002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 'Subaru',   'Forester',      2018, 'KCX 456B', 'Blue',     82000),
  ('00000000-0000-0000-0000-000000200003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000002', 'Mazda',    'Demio',         2016, 'KDD 789C', 'Grey',     96000),
  ('00000000-0000-0000-0000-000000200004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000003', 'Nissan',   'X-Trail',       2014, 'KBB 321D', 'Black',    145000),
  ('00000000-0000-0000-0000-000000200005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000004', 'Toyota',   'Land Cruiser',  2019, 'KCZ 654E', 'Silver',   118000),
  ('00000000-0000-0000-0000-000000200006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000005', 'Toyota',   'Fielder',       2017, 'KDA 987F', 'Red',      88000),
  ('00000000-0000-0000-0000-000000200007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000006', 'Subaru',   'Forester',      2016, 'KCX 246G', 'Green',    132000),
  ('00000000-0000-0000-0000-000000200008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000007', 'Mazda',    'Demio',         2019, 'KDD 135H', 'Black',    54000),
  ('00000000-0000-0000-0000-000000200009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000008', 'Nissan',   'X-Trail',       2015, 'KBB 864I', 'White',    121000),
  ('00000000-0000-0000-0000-000000200010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000009', 'Toyota',   'Fielder',       2018, 'KDA 753J', 'Silver',   76500),
  ('00000000-0000-0000-0000-000000200011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000010', 'Toyota',   'Land Cruiser',  2017, 'KCZ 642K', 'White',    156000),
  ('00000000-0000-0000-0000-000000200012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000011', 'Subaru',   'Forester',      2020, 'KCX 531L', 'Black',    61000),
  ('00000000-0000-0000-0000-000000200013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000012', 'Mazda',    'Demio',         2014, 'KDD 420M', 'Red',      167000),
  ('00000000-0000-0000-0000-000000200014', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000013', 'Toyota',   'Fielder',       2019, 'KDA 309N', 'Grey',     67000),
  ('00000000-0000-0000-0000-000000200015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000014', 'Nissan',   'X-Trail',       2018, 'KBB 198O', 'Silver',   93000),
  ('00000000-0000-0000-0000-000000200016', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000015', 'Toyota',   'Land Cruiser',  2016, 'KCZ 087P', 'White',    188000),
  ('00000000-0000-0000-0000-000000200017', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 'Mazda',    'Demio',         2020, 'KDD 876Q', 'Blue',     48000),
  ('00000000-0000-0000-0000-000000200018', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000003', 'Toyota',   'Fielder',       2016, 'KDA 765R', 'Black',    112000),
  ('00000000-0000-0000-0000-000000200019', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000005', 'Subaru',   'Forester',      2015, 'KCX 654S', 'Silver',   172000),
  ('00000000-0000-0000-0000-000000200020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000007', 'Nissan',   'X-Trail',       2019, 'KBB 543T', 'Grey',     79000);

-- ── Services (30, deterministic ids 300001…300030, spread over 6 months) ──
-- statuses: pending / in_progress / completed / cancelled
insert into services (id, garage_id, customer_id, vehicle_id, description, status, amount_kes, paid, payment_method, appointment_at, completed_at, next_service_at, reminder_sent, created_at) values
  ('00000000-0000-0000-0000-000000300001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000200001', 'Full service + oil change',              'completed', 18500, true,  'mpesa',  now() - interval '160 days', now() - interval '159 days', now() + interval '10 days',  false, now() - interval '160 days'),
  ('00000000-0000-0000-0000-000000300002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000200001', 'Brake pads replacement',               'completed', 9500,  true,  'cash',   now() - interval '100 days', now() - interval '99 days',  now() + interval '50 days',  false, now() - interval '100 days'),
  ('00000000-0000-0000-0000-000000300003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000200002', 'Full service + oil change',            'completed', 22000, true,  'mpesa',  now() - interval '40 days',  now() - interval '39 days',  now() + interval '90 days',  false, now() - interval '40 days'),
  ('00000000-0000-0000-0000-000000300004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000200003', 'Shock absorber replacement',          'completed', 16000, true,  'mpesa',  now() - interval '130 days', now() - interval '129 days', now() + interval '8 days',   false, now() - interval '130 days'),
  ('00000000-0000-0000-0000-000000300005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000200003', 'Oil change',                          'completed', 4500,  true,  'cash',   now() - interval '20 days',  now() - interval '18 days',  now() + interval '65 days',  false, now() - interval '20 days'),
  ('00000000-0000-0000-0000-000000300006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000200004', 'Full service + oil change',            'completed', 19000, true,  'card',   now() - interval '150 days', now() - interval '148 days', now() + interval '5 days',   false, now() - interval '150 days'),
  ('00000000-0000-0000-0000-000000300007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000200004', 'Clutch repair',                        'completed', 45000, false, 'mpesa',  now() - interval '55 days',  now() - interval '53 days',  now() + interval '120 days', false, now() - interval '55 days'),
  ('00000000-0000-0000-0000-000000300008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000200005', 'Full service + oil change',            'completed', 26000, true,  'mpesa',  now() - interval '110 days', now() - interval '108 days', now() + interval '7 days',   false, now() - interval '110 days'),
  ('00000000-0000-0000-0000-000000300009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000200006', 'Oil change + filter',                  'completed', 6500,  true,  'cash',   now() - interval '90 days',  now() - interval '88 days',  now() + interval '12 days',  false, now() - interval '90 days'),
  ('00000000-0000-0000-0000-000000300010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000200019', 'Radiator flush',                       'completed', 8000,  true,  'mpesa',  now() - interval '30 days',  now() - interval '28 days',  now() + interval '80 days',  false, now() - interval '30 days'),
  ('00000000-0000-0000-0000-000000300011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000200007', 'Full service + oil change',            'completed', 21000, true,  'mpesa',  now() - interval '145 days', now() - interval '143 days', now() + interval '6 days',   false, now() - interval '145 days'),
  ('00000000-0000-0000-0000-000000300012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000200008', 'Tyre replacement (4)',                 'completed', 36000, true,  'mpesa',  now() - interval '75 days',  now() - interval '74 days',  now() + interval '200 days', false, now() - interval '75 days'),
  ('00000000-0000-0000-0000-000000300013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000200020', 'Oil change',                          'completed', 4800,  true,  'cash',   now() - interval '12 days',  now() - interval '10 days',  now() + interval '70 days',  false, now() - interval '12 days'),
  ('00000000-0000-0000-0000-000000300014', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000200009', 'Battery replacement',                  'completed', 14000, true,  'mpesa',  now() - interval '65 days',  now() - interval '64 days',  now() + interval '150 days', false, now() - interval '65 days'),
  ('00000000-0000-0000-0000-000000300015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000200010', 'Full service + oil change',            'completed', 17500, true,  'card',   now() - interval '105 days', now() - interval '103 days', now() + interval '9 days',   false, now() - interval '105 days'),
  ('00000000-0000-0000-0000-000000300016', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000200010', 'Wheel alignment + balancing',          'completed', 3500,  true,  'cash',   now() - interval '3 days',   now() - interval '2 days',   now() + interval '95 days',  false, now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000300017', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000200011', 'Full service + oil change',            'in_progress', 24000, false, null,   now() + interval '0 days',  null,                null,                     false, now() - interval '1 days'),
  ('00000000-0000-0000-0000-000000300018', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000200012', 'Full service + oil change',            'pending',    20000, false, null,   now() + interval '2 days',  null,                now() + interval '90 days', false, now() - interval '0 days'),
  ('00000000-0000-0000-0000-000000300019', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000200013', 'Suspension overhaul',                  'pending',    72000, false, null,   now() + interval '4 days',  null,                null,                     false, now() - interval '0 days'),
  ('00000000-0000-0000-0000-000000300020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000200014', 'Full service + oil change',            'completed',  16500, true,  'mpesa',  now() - interval '15 days', now() - interval '13 days',  now() + interval '40 days',  false, now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000300021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000200015', 'AC service + regas',                   'completed',  12000, true,  'mpesa',  now() - interval '35 days', now() - interval '34 days',  now() + interval '180 days', false, now() - interval '35 days'),
  ('00000000-0000-0000-0000-000000300022', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000200016', 'Full service + oil change',            'completed',  28000, true,  'card',   now() - interval '25 days', now() - interval '23 days',  now() + interval '60 days',  false, now() - interval '25 days'),
  ('00000000-0000-0000-0000-000000300023', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000200017', 'Timing belt replacement',              'completed',  18000, true,  'cash',   now() - interval '5 days',   now() - interval '4 days',   now() + interval '30 days',  false, now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000300024', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000200018', 'Diagnostic scan (OBD)',                'completed',  2000,  true,  'cash',   now() - interval '21 days', now() - interval '20 days',  null,                     false, now() - interval '21 days'),
  ('00000000-0000-0000-0000-000000300025', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000200006', 'Brake discs replacement',              'in_progress', 22000, false, null,   now() + interval '0 days',  null,                null,                     false, now() - interval '0 days'),
  ('00000000-0000-0000-0000-000000300026', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000200020', 'Full service + oil change',            'pending',     17500, false, null,   now() + interval '3 days',  null,                now() + interval '95 days', false, now() - interval '0 days'),
  ('00000000-0000-0000-0000-000000300027', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000200003', 'Oil change',                          'cancelled',    4500,  false, null,   null,                     null,                null,                     false, now() - interval '14 days'),
  ('00000000-0000-0000-0000-000000300028', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000200005', 'Full service + oil change',            'completed',   25500, true,  'mpesa',  now() - interval '8 days',   now() - interval '6 days',   now() + interval '75 days',  false, now() - interval '8 days'),
  ('00000000-0000-0000-0000-000000300029', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000200012', 'Engine tune-up',                       'completed',    9500, true,  'cash',   now() - interval '45 days', now() - interval '44 days',  now() + interval '85 days',  false, now() - interval '45 days'),
  ('00000000-0000-0000-0000-000000300030', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000200014', 'Shock absorber replacement',           'pending',     14800, false, null,   now() + interval '5 days',  null,                null,                     false, now() - interval '0 days');

-- ── Leads (8, deterministic ids 100001…100008, various statuses) ──
insert into leads (id, garage_id, name, phone, vehicle_make, vehicle_model, message, source, status, created_at) values
  ('00000000-0000-0000-0000-000000100001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'James Mwangi',   '+254722331001', 'Toyota',   'Prado',    'Hi, how much for a full service on a Prado?',              'whatsapp', 'new',       now() - interval '3 hours'),
  ('00000000-0000-0000-0000-000000100002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rose Kemunto',   '+254733331002', 'Mazda',    'CX-5',     'My CX-5 AC is not cooling. Can you fix?',                 'whatsapp', 'new',       now() - interval '45 minutes'),
  ('00000000-0000-0000-0000-000000100003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tom Mutua',      '+254711331003', 'Subaru',   'Outback',  'Need brake pads. How long does it take?',                 'whatsapp', 'contacted', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000100004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mary Auma',      '+254721331004', null,       null,       'Walk-in enquiry about car wash service.',                 'walk_in',  'contacted', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000100005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Felix Odhiambo', '+254722331005', 'Nissan',   'Navara',   'Referred by John Kamau. Need a suspension check.',        'referral', 'converted',    now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000100006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Irene Wanjiru',  '+254733331006', 'Toyota',   'Fielder',  'Full service quote for 2015 Fielder KDA 456Z.',           'google',      'converted',    now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000100007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Patrick Kilonzo','+254711331007', null,       null,       'Google Maps customer — asked for opening hours.',          'google',      'lost',      now() - interval '10 days'),
  ('00000000-0000-0000-0000-000000100008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dennis Ochieng', '+254721331008', 'Toyota',   'Vitz',     'How much for an oil change and battery check?',           'whatsapp', 'new',       now() - interval '5 hours');