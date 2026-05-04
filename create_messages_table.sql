-- Supabase SQL Editor'de bu SQL'i çalıştırın
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_name text NOT NULL,
  sender_dorm text,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS (Row Level Security) - herkese okuma/yazma izni ver
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);

-- Realtime aboneliğinin çalışması için tabloyu yayına ekleyin
ALTER publication supabase_realtime ADD TABLE messages;
