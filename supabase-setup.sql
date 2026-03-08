-- ============================================================
--  Supabase Setup — Charles Shalua Personal Site
--  Run this in the Supabase SQL Editor
-- ============================================================

-- ============================================================
--  1. TABLES
-- ============================================================

-- contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text DEFAULT '',
  message     text NOT NULL,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- articles table
CREATE TABLE IF NOT EXISTS public.articles (
  id          text PRIMARY KEY,
  title       text NOT NULL,
  excerpt     text DEFAULT '',
  tag         text DEFAULT '',
  content     text DEFAULT '',
  read_time   text DEFAULT '5 min read',
  published   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
--  2. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- ============================================================
--  3. RLS POLICIES — contacts
-- ============================================================

-- Allow anonymous visitors to submit contact messages
CREATE POLICY "anon_insert_contacts"
  ON public.contacts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users (admin) to read all contacts
CREATE POLICY "auth_select_contacts"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users (admin) to update contacts (e.g. mark read)
CREATE POLICY "auth_update_contacts"
  ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users (admin) to delete contacts
CREATE POLICY "auth_delete_contacts"
  ON public.contacts
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
--  4. RLS POLICIES — articles
-- ============================================================

-- Allow anonymous visitors to read published articles only
CREATE POLICY "anon_select_published_articles"
  ON public.articles
  FOR SELECT
  TO anon
  USING (published = true);

-- Allow authenticated users full access to all articles
CREATE POLICY "auth_all_articles"
  ON public.articles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
--  5. SEED — existing articles
-- ============================================================

INSERT INTO public.articles (id, title, excerpt, tag, read_time, published, created_at, updated_at, content)
VALUES (
  'rise-of-autonomous-ai-agents',
  'The Rise of Autonomous AI Agents: What You Need to Know',
  'Autonomous AI agents are changing the way we think about software. From planning to execution, these systems can operate independently — and they''re just getting started.',
  'AI Agents',
  '6 min read',
  true,
  '2026-03-08',
  '2026-03-08',
  $$<h2>What Are Autonomous AI Agents?</h2>
<p>
  Autonomous AI agents are software systems capable of perceiving their environment, making decisions, and taking actions to achieve specific goals — all without continuous human intervention. Unlike traditional software that follows rigid, predefined rules, these agents can adapt, learn, and operate independently in complex, dynamic environments.
</p>

<h2>Why This Matters Now</h2>
<p>
  The convergence of several technological breakthroughs has made autonomous agents more viable than ever before. Large Language Models (LLMs) provide unprecedented natural language understanding and generation capabilities. Advances in reinforcement learning enable agents to learn optimal strategies through trial and error. And modern cloud infrastructure provides the computational resources needed to run these systems at scale.
</p>

<h3>Key Capabilities of Modern AI Agents</h3>
<ul>
  <li><strong>Planning &amp; Reasoning</strong> — Breaking complex tasks into manageable subtasks and determining the best sequence of actions.</li>
  <li><strong>Tool Use</strong> — Interacting with external APIs, databases, and services to gather information and execute actions.</li>
  <li><strong>Memory &amp; Context</strong> — Maintaining context across interactions and learning from past experiences.</li>
  <li><strong>Self-Correction</strong> — Evaluating their own outputs and adjusting their approach when things don't go as planned.</li>
</ul>

<h2>Real-World Applications</h2>
<p>
  Autonomous agents are already being deployed across industries. In software engineering, coding agents can write, test, and debug code with minimal human oversight. In customer service, AI agents handle complex queries that previously required human intervention. In healthcare, agents assist with diagnosis and treatment planning by analyzing vast amounts of medical data.
</p>

<h2>Challenges Ahead</h2>
<p>
  Despite the exciting progress, significant challenges remain. Reliability and safety are paramount — agents must be predictable and safe in their actions. Alignment ensures agents pursue intended goals rather than finding unintended shortcuts. And as these systems become more capable, questions of accountability and governance become increasingly important.
</p>

<blockquote>
  "The most interesting AI systems of the next decade won't just answer questions — they'll take action, make decisions, and solve problems autonomously." — Industry sentiment, 2025
</blockquote>

<h2>What's Next?</h2>
<p>
  The future of autonomous agents lies in multi-agent systems where specialized agents collaborate to solve complex problems. Imagine a team of AI agents working together: one handles research, another writes code, a third tests and validates. This collaborative approach mirrors how human teams operate, and it's already being implemented in cutting-edge AI labs.
</p>
<p>
  As a student focused on AI and software development, I'm deeply excited about this space. Building systems that can think, plan, and act independently is one of the most fascinating challenges in computer science — and we're just getting started.
</p>$$
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.articles (id, title, excerpt, tag, read_time, published, created_at, updated_at, content)
VALUES (
  'why-system-design-matters-in-ai',
  'Why System Design Matters More Than Ever in AI Development',
  'Building AI isn''t just about models — it''s about the architecture that supports them. Here''s why strong system design is the backbone of scalable AI products.',
  'System Architecture',
  '5 min read',
  true,
  '2026-03-01',
  '2026-03-01',
  $$<h2>Why System Design Matters</h2><p>As AI systems grow in complexity, the need for robust system design becomes critical. The architecture that surrounds your AI model is just as important as the model itself.</p>$$
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.articles (id, title, excerpt, tag, read_time, published, created_at, updated_at, content)
VALUES (
  'machine-learning-pipeline-essentials',
  'Building Your First Machine Learning Pipeline: A Beginner Guide',
  'From data collection to deployment — learn the essential components of an ML pipeline and how they fit together to create working AI systems.',
  'Machine Learning',
  '7 min read',
  true,
  '2026-02-22',
  '2026-02-22',
  $$<h2>What is an ML Pipeline?</h2><p>A machine learning pipeline is a structured workflow that automates the process of training and deploying ML models, from raw data to production predictions.</p>$$
)
ON CONFLICT (id) DO NOTHING;
