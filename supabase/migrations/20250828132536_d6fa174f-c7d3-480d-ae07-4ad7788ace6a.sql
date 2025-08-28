-- =============================================
-- BDG BETTING SYSTEM - DATABASE EXTENSION V1.0
-- Phase 1: Add betting tables alongside existing voting system
-- =============================================

-- ===== USERS & PROFILES =====
-- Extended user profiles (complement to auth.users)
CREATE TABLE app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- Reference to auth.users.id
  handle TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  birthdate DATE,
  kyc_level SMALLINT DEFAULT 0, -- 0:none, 1:basic, 2:enhanced  
  birthdate_verified_at TIMESTAMPTZ,
  beber_loyalty_id UUID,
  country TEXT DEFAULT 'HN',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== WALLET SYSTEM =====
-- Multi-currency wallet support
CREATE TABLE wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  currency TEXT NOT NULL, -- 'XP', 'BDG_CREDIT', 'USD' (future)
  balance NUMERIC(18,6) NOT NULL DEFAULT 0,
  hold NUMERIC(18,6) NOT NULL DEFAULT 0, -- Reserved for pending bets
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Wallet transaction history  
CREATE TABLE wallet_tx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallet(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- DEPOSIT, WITHDRAWAL, BET_STAKE, BET_PAYOUT, REFUND, BONUS, TRANSFER
  amount NUMERIC(18,6) NOT NULL,
  reference_id UUID, -- bet_ticket.id, settlement.id, etc.
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== BETTING EVENTS =====  
-- Betting events (can reference existing events)
CREATE TABLE bdg_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Link to existing event system
  source_event_id UUID REFERENCES events(id), -- Optional: reuse existing events
  discipline TEXT NOT NULL, -- boxing, rap, chess, esports
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  venue TEXT,
  state TEXT NOT NULL DEFAULT 'draft', -- draft, live, finished, canceled
  meta JSONB DEFAULT '{}', -- Additional event data
  created_by UUID, -- References auth.users.id
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== BETTING MARKETS =====
-- Betting markets within events
CREATE TABLE market (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES bdg_event(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- 'Fight Winner', 'Round 1 Winner', 'Method of Victory'
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'PARIMUTUEL', -- PARIMUTUEL, FIXED_ODDS, PREDICTION
  state TEXT NOT NULL DEFAULT 'preopen', -- preopen, open, suspended, closed, settled, voided
  rake NUMERIC(5,4) DEFAULT 0.08, -- 8% default rake
  min_stake NUMERIC(18,6) DEFAULT 1,
  max_stake NUMERIC(18,6),
  settlement_delay_seconds INTEGER DEFAULT 30, -- Delay before auto-settlement
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Market outcomes/options
CREATE TABLE outcome (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- 'Fighter A', 'Round 1-3', 'KO/TKO'
  description TEXT,
  price NUMERIC(10,4), -- For FIXED_ODDS (decimal odds like 2.50)
  pool NUMERIC(18,6) DEFAULT 0, -- For PARIMUTUEL (total staked on this outcome)
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== BETTING TICKETS =====
-- User betting tickets
CREATE TABLE bet_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  outcome_id UUID NOT NULL REFERENCES outcome(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'SINGLE', -- SINGLE, MULTI (future), SYSTEM (future)
  stake NUMERIC(18,6) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XP',
  price_locked NUMERIC(10,4), -- Fixed odds snapshot at bet time
  potential_payout NUMERIC(18,6), -- Calculated potential return
  status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, WON, LOST, VOID, REFUNDED, PARTIALLY_WON
  payout_amount NUMERIC(18,6) DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ
);

-- ===== SETTLEMENTS =====
-- Market settlement records
CREATE TABLE settlement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  winning_outcome_id UUID REFERENCES outcome(id),
  result_type TEXT DEFAULT 'WIN', -- WIN, VOID, DEAD_HEAT
  result_meta JSONB DEFAULT '{}', -- Evidence, notes, etc.
  settled_by UUID, -- Admin who settled (auth.users.id)
  confirmed_by UUID, -- Second admin for dual confirmation
  total_pool NUMERIC(18,6) DEFAULT 0,
  total_rake NUMERIC(18,6) DEFAULT 0,
  total_payout NUMERIC(18,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== AUDIT & COMPLIANCE =====
-- Market state change log
CREATE TABLE market_state_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  reason TEXT,
  actor UUID, -- Admin who made the change (auth.users.id)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User limits and compliance
CREATE TABLE user_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- DAILY, WEEKLY, MONTHLY
  limit_type TEXT NOT NULL, -- STAKE, LOSS, DEPOSIT
  max_amount NUMERIC(18,6) NOT NULL,
  current_amount NUMERIC(18,6) DEFAULT 0,
  reset_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period, limit_type)
);

-- ===== INDEXES FOR PERFORMANCE =====
-- Betting queries
CREATE INDEX idx_bet_ticket_user_status ON bet_ticket(user_id, status);
CREATE INDEX idx_bet_ticket_market_status ON bet_ticket(market_id, status);
CREATE INDEX idx_market_event_state ON market(event_id, state);
CREATE INDEX idx_outcome_market_active ON outcome(market_id, active);
CREATE INDEX idx_wallet_user_currency ON wallet(user_id, currency);
CREATE INDEX idx_wallet_tx_wallet_created ON wallet_tx(wallet_id, created_at DESC);

-- ===== TRIGGERS FOR UPDATED_AT =====
CREATE TRIGGER update_app_user_updated_at
  BEFORE UPDATE ON app_user
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_updated_at
  BEFORE UPDATE ON wallet
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bdg_event_updated_at
  BEFORE UPDATE ON bdg_event
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_updated_at
  BEFORE UPDATE ON market
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outcome_updated_at
  BEFORE UPDATE ON outcome
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== ROW LEVEL SECURITY =====
-- Enable RLS on all tables
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_tx ENABLE ROW LEVEL SECURITY;
ALTER TABLE bdg_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE market ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_ticket ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_state_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_limit ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====

-- App User: Users can read/update their own profile
CREATE POLICY "Users can view their own profile" ON app_user
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON app_user
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "System can insert user profiles" ON app_user
  FOR INSERT WITH CHECK (true);

-- Wallet: Users can only see their own wallets
CREATE POLICY "Users can view their own wallets" ON wallet
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_user 
      WHERE app_user.id = wallet.user_id 
      AND app_user.auth_user_id = auth.uid()
    )
  );

-- Wallet Transactions: Users can view their own transaction history
CREATE POLICY "Users can view their own wallet transactions" ON wallet_tx
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallet w
      JOIN app_user u ON u.id = w.user_id
      WHERE w.id = wallet_tx.wallet_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- BDG Events: Public events visible to all, admins can manage
CREATE POLICY "Public events visible to all" ON bdg_event
  FOR SELECT USING (state IN ('live', 'finished'));

CREATE POLICY "Event creators can manage their events" ON bdg_event
  FOR ALL USING (auth.uid() = created_by);

-- Markets: Public markets visible, event owners can manage
CREATE POLICY "Public markets visible to all" ON market
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bdg_event e 
      WHERE e.id = market.event_id 
      AND e.state IN ('live', 'finished')
    )
  );

CREATE POLICY "Event owners can manage markets" ON market
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bdg_event e 
      WHERE e.id = market.event_id 
      AND e.created_by = auth.uid()
    )
  );

-- Outcomes: Public outcomes visible, market owners can manage
CREATE POLICY "Public outcomes visible to all" ON outcome
  FOR SELECT USING (active = true);

CREATE POLICY "Market owners can manage outcomes" ON outcome
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM market m
      JOIN bdg_event e ON e.id = m.event_id
      WHERE m.id = outcome.market_id 
      AND e.created_by = auth.uid()
    )
  );

-- Bet Tickets: Users can only see their own bets
CREATE POLICY "Users can view their own bets" ON bet_ticket
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_user u 
      WHERE u.id = bet_ticket.user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bets during open markets" ON bet_ticket
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_user u 
      WHERE u.id = bet_ticket.user_id 
      AND u.auth_user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM market m 
      WHERE m.id = bet_ticket.market_id 
      AND m.state = 'open'
    )
  );

-- Settlement: Event owners can settle, all can read results
CREATE POLICY "Public settlement results visible" ON settlement
  FOR SELECT USING (true);

CREATE POLICY "Event owners can create settlements" ON settlement
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM market m
      JOIN bdg_event e ON e.id = m.event_id
      WHERE m.id = settlement.market_id 
      AND e.created_by = auth.uid()
    )
  );

-- Market State Log: Event owners can log changes, admins can read
CREATE POLICY "Event owners can log market changes" ON market_state_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM market m
      JOIN bdg_event e ON e.id = m.event_id
      WHERE m.id = market_state_log.market_id 
      AND e.created_by = auth.uid()
    )
  );

-- User Limits: Users can view their own limits
CREATE POLICY "Users can view their own limits" ON user_limit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_user u 
      WHERE u.id = user_limit.user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- ===== BETTING HELPER FUNCTIONS =====

-- Function to calculate parimutuel payout
CREATE OR REPLACE FUNCTION calculate_parimutuel_payout(
  p_market_id UUID,
  p_outcome_id UUID,
  p_stake NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  total_pool NUMERIC;
  winning_pool NUMERIC;
  rake_rate NUMERIC;
  net_pool NUMERIC;
  payout NUMERIC;
BEGIN
  -- Get market rake
  SELECT rake INTO rake_rate 
  FROM market 
  WHERE id = p_market_id;
  
  -- Get total pool across all outcomes
  SELECT COALESCE(SUM(pool), 0) INTO total_pool
  FROM outcome 
  WHERE market_id = p_market_id;
  
  -- Get winning outcome pool
  SELECT COALESCE(pool, 0) INTO winning_pool
  FROM outcome 
  WHERE id = p_outcome_id;
  
  -- Calculate net pool after rake
  net_pool := total_pool * (1 - rake_rate);
  
  -- Calculate payout ratio
  IF winning_pool > 0 THEN
    payout := p_stake * (net_pool / winning_pool);
  ELSE
    payout := p_stake; -- Return stake if no other bets
  END IF;
  
  RETURN GREATEST(payout, p_stake); -- Minimum return is stake
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update outcome pools when bet is placed
CREATE OR REPLACE FUNCTION update_outcome_pool() RETURNS TRIGGER AS $$
BEGIN
  -- Add stake to outcome pool
  UPDATE outcome 
  SET pool = pool + NEW.stake
  WHERE id = NEW.outcome_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update pools when bets are placed
CREATE TRIGGER update_pools_on_bet
  AFTER INSERT ON bet_ticket
  FOR EACH ROW
  EXECUTE FUNCTION update_outcome_pool();

-- ===== SAMPLE DATA FOR TESTING =====
-- Insert sample betting disciplines
INSERT INTO bdg_event (discipline, name, description, state, created_by) VALUES
  ('boxing', 'Championship Fight Night', 'Main event: Heavyweight title bout', 'draft', NULL),
  ('rap', 'BDG Rap Battle Finals', 'Best freestyle rappers compete', 'draft', NULL),
  ('chess', 'Speed Chess Tournament', 'Blitz chess championship', 'draft', NULL);

-- =============================================
-- END OF BETTING SYSTEM DATABASE EXTENSION
-- =============================================