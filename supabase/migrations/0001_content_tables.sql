-- HandySolver content tables (run in Supabase Dashboard -> SQL Editor -> New query).
-- Creates case_studies, testimonials, team_members with public read access
-- and seeds them with the application's current content.

-- ============ TABLES ============

create table if not exists public.case_studies (
  id text primary key,
  sort_order integer not null default 0,
  icon text not null,
  label text not null,
  metric text not null,
  title text not null,
  before_text text not null,
  changed text not null,
  result text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id text primary key,
  sort_order integer not null default 0,
  name text not null,
  initials text not null,
  label text not null default '',
  quote text not null,
  avatar_url text,
  video_url text,
  source text not null default '',
  source_label text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id text primary key,
  sort_order integer not null default 0,
  name text not null default '',
  photo_url text not null default '',
  created_at timestamptz not null default now()
);

-- ============ PUBLIC READ (app reads with the anon key) ============

alter table public.case_studies enable row level security;
alter table public.testimonials enable row level security;
alter table public.team_members enable row level security;

drop policy if exists "Public read access" on public.case_studies;
drop policy if exists "Public read access" on public.testimonials;
drop policy if exists "Public read access" on public.team_members;

create policy "Public read access" on public.case_studies for select to anon using (true);
create policy "Public read access" on public.testimonials for select to anon using (true);
create policy "Public read access" on public.team_members for select to anon using (true);

-- ============ SEED: CASE STUDIES (10) ============

insert into public.case_studies (id, sort_order, icon, label, metric, title, before_text, changed, result, tags) values
('nudges', 0, 'bell-ring', 'Community', '80 personal nudges in minutes', 'The right prompt reached everyone on time.', 'Contribution scores were pulled from spreadsheets and WhatsApp nudges were written and sent one person at a time.', 'A lightweight tool reads the score sheet and sends each member a personal action plan automatically.', 'Reliable twice-monthly outreach replaced irregular manual rounds, with clear visibility into who needs which nudge.', array['WhatsApp','Reports','Automation']),
('job-cost', 1, 'boxes', 'Fabrication', 'Every job cost, one view', 'Material usage stopped hiding in spreadsheets.', 'Clients, jobs and inventory lived in separate sheets, making true material usage and job cost difficult to confirm.', 'Clients, jobs and stock now share one system, with material assigned directly to each job.', 'The team sees total area and cost from one dashboard and catches material wastage before it becomes a surprise.', array['Inventory','Job costing','Visibility']),
('orders', 2, 'shopping-bag', 'Online retail', '1 week → a few hours', 'Month-end stopped taking all week.', 'Orders, payments and courier remittances sat in separate exports. The accounts team matched every order ID by hand.', 'The team uploads the exports and the system matches orders, status changes and remittances automatically.', 'Reconciliation dropped from roughly a full week each month to a few hours, with one current view of every order.', array['Reconciliation','Accounts','Automation']),
('attendance', 3, 'building-2', 'Construction', 'Every site, live attendance', 'Head Office no longer waits two weeks.', 'Attendance was recorded on paper and consolidated every fortnight, making timings difficult to verify or trust.', 'Biometric punches now feed a central dashboard while leave remains manageable and punch records stay protected.', 'Attendance is visible in real time across sites, with fewer disputes and far more reliable records.', array['Attendance','Biometrics','Multi-site']),
('materials', 4, 'hard-hat', 'Construction', 'BOQ → delivery, one view', 'Material stopped disappearing between steps.', 'Approvals, purchase orders, invoices and delivery records moved through paper and disconnected sheets.', 'A connected workflow tracks every quantity from approved BOQ to site delivery, with documents and permissions built in.', 'Site teams, Head Office and leadership now work from the same live quantities and can catch over-ordering earlier.', array['Approvals','Purchasing','Visibility']),
('tools', 5, 'factory', 'Manufacturing', 'Shortages spotted before work stops', 'Every tool has an owner and a threshold.', 'Paper records could not reliably show who had each tool or when stock had fallen too low.', 'A central inventory dashboard connects orders, balances and assignments, with weekly reorder alerts.', 'Stock is replenished ahead of need and work is less likely to stall because a tool is missing or depleted.', array['Inventory','Alerts','Accountability']),
('people', 6, 'heart-pulse', 'People operations', '30 minutes → 2 minutes', 'We untangled our own HR work first.', 'Leave, meetings, reimbursements, payroll and performance reviews depended on WhatsApp and manual follow-ups.', 'One platform connects leave, attendance, payroll, approvals, goals, reimbursements and notifications.', 'Leave and payroll tasks fell from about an hour to 10 minutes, while reimbursement work fell from 30 minutes to 2.', array['HR','Payroll','Goals']),
('crm', 7, 'briefcase-business', 'B2B sales', 'Lead → order, one journey', 'Sales stopped living across calls and chats.', 'Leads arrived by phone, email, WhatsApp and web, then relied on manual entry, reminders and quotation handoffs.', 'Every enquiry is captured and assigned automatically, with follow-ups, quotations, history and operations connected.', 'The team responds more consistently while management sees the live pipeline, follow-ups and performance.', array['CRM','Quotations','Sales']),
('bookings', 8, 'hotel', 'Hospitality', '~85% less booking admin', 'Every room, booking and season in one place.', 'Bookings lived in Google Calendar, pricing changed by season and the financial picture was difficult to trust.', 'One platform connects online bookings, room availability, seasonal pricing, access controls and monthly reporting.', 'The project recorded about 85% less booking admin, about 65% more revenue and about 90% fewer booking and reporting errors.', array['Bookings','Reporting','Integration']),
('hr-platform', 9, 'users', 'Professional services', 'Up to ~80% efficiency gain', 'Attendance, payroll and performance finally agree.', 'Paper, spreadsheets and an existing ERP created repeated corrections before attendance could even reach payroll.', 'A single hub now connects leave, attendance, payroll, performance, learning, inventory and documents.', 'Different workflows recorded roughly 50% to 80% efficiency gains, while manual attendance and payroll work was removed.', array['Payroll','Performance','Learning'])
on conflict (id) do update set
  sort_order = excluded.sort_order, icon = excluded.icon, label = excluded.label,
  metric = excluded.metric, title = excluded.title, before_text = excluded.before_text,
  changed = excluded.changed, result = excluded.result, tags = excluded.tags;

-- ============ SEED: TESTIMONIALS (4) ============

insert into public.testimonials (id, sort_order, name, initials, label, quote, avatar_url, video_url, source, source_label) values
('vikas-suri', 0, 'Vikas Suri', 'VS', 'Custom sales CRM client', 'My team immediately accepted the software, started using it, and we are already analysing data.', null, null, 'https://in.linkedin.com/company/handysolver', 'Client stories on LinkedIn'),
('mischa-diender', 1, 'Mischa Diender', 'MD', 'Client testimonial · excerpt', 'I''m very satisfied!', null, null, 'https://handysolver.com/#customers-testimonials2', 'Read the full testimonial'),
('shawn-snyder', 2, 'Shawn Snyder', 'SS', 'Client testimonial · excerpt', 'They are flexible and true technical experts.', null, null, 'https://handysolver.com/#customers-testimonials2', 'Read the full testimonial'),
('renjith-nair', 3, 'Renjith Nair', 'RN', 'Client testimonial · excerpt', 'They have been very polite and courteous, also flexible…', null, null, 'https://handysolver.com/#customers-testimonials2', 'Read the full testimonial')
on conflict (id) do update set
  sort_order = excluded.sort_order, name = excluded.name, initials = excluded.initials,
  label = excluded.label, quote = excluded.quote, avatar_url = excluded.avatar_url,
  video_url = excluded.video_url, source = excluded.source, source_label = excluded.source_label;

-- ============ SEED: TEAM MEMBERS (14) ============

insert into public.team_members (id, sort_order, name, photo_url) values
('manmohan', 0, 'Manmohan', 'https://handysolver.com/assets/images/employees/manmohan-bw.jpg'),
('abhishek', 1, 'Abhishek', 'https://handysolver.com/assets/images/employees/abhishek-bw.jpg'),
('kanchan', 2, 'Kanchan', 'https://handysolver.com/assets/images/employees/Kanchan.jpg'),
('rahul', 3, 'Rahul', 'https://handysolver.com/assets/images/employees/Rahul.jpg'),
('sufiyan', 4, 'Sufiyan', 'https://handysolver.com/assets/images/employees/Sufiyan.jpg'),
('yashwant', 5, 'Yashwant', 'https://handysolver.com/assets/images/employees/Yashwant.jpg'),
('meena', 6, 'Meena', 'https://handysolver.com/assets/images/employees/Meena.jpg'),
('lakshay', 7, 'Lakshay', 'https://handysolver.com/assets/images/employees/Lakshay.jpg'),
('ashi', 8, 'Ashi', 'https://handysolver.com/assets/images/employees/ashi-bw.jpg'),
('neerad', 9, 'Neerad', 'https://handysolver.com/assets/images/employees/neerad-bw.jpg'),
('isa', 10, 'Isa', 'https://handysolver.com/assets/images/employees/isa-bw.jpg'),
('paranay', 11, 'Paranay', 'https://handysolver.com/assets/images/employees/paranay-bw.png'),
('sourabh', 12, 'Sourabh', 'https://handysolver.com/assets/images/employees/sourabh-bw.png'),
('neha', 13, 'Neha', 'https://handysolver.com/assets/images/employees/neha-bw.jpg')
on conflict (id) do update set
  sort_order = excluded.sort_order, name = excluded.name, photo_url = excluded.photo_url;
