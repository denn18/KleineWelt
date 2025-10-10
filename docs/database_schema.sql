-- Datenbankschema für KleineWelt (PostgreSQL + PostGIS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Nutzer
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('parent', 'provider', 'admin')),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    phone TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    language TEXT DEFAULT 'de',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adressen
CREATE TABLE address (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    street TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT DEFAULT 'DE',
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile der Tagespflegepersonen
CREATE TABLE provider_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    headline TEXT,
    bio TEXT,
    capacity_total INTEGER NOT NULL,
    capacity_available INTEGER NOT NULL,
    hourly_rate_cents INTEGER,
    min_age_months INTEGER,
    max_age_months INTEGER,
    opening_hours JSONB,
    qualifications TEXT[],
    services TEXT[],
    accepts_special_needs BOOLEAN DEFAULT FALSE,
    home_visit_possible BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fotos & Dokumente
CREATE TABLE media_asset (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('photo', 'document')),
    title TEXT,
    url TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Betreuungsplätze
CREATE TABLE placement_slot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    age_from_months INTEGER,
    age_to_months INTEGER,
    status TEXT NOT NULL CHECK (status IN ('available', 'reserved', 'booked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anfragen & Matches
CREATE TABLE inquiry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES placement_slot(id) ON DELETE SET NULL,
    child_name TEXT,
    child_birthdate DATE,
    care_days TEXT[],
    care_time_from TIME,
    care_time_to TIME,
    status TEXT NOT NULL CHECK (status IN ('open', 'in_review', 'accepted', 'declined', 'withdrawn')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messenger
CREATE TABLE conversation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE message (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    content TEXT,
    attachments JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows & Benachrichtigungen
CREATE TABLE follow (
    follower_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, followed_id)
);

CREATE TABLE notification_subscription (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms')),
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zahlungen & Provisionen
CREATE TABLE contract (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL REFERENCES inquiry(id) ON DELETE CASCADE,
    provider_fee_cents INTEGER NOT NULL,
    parent_fee_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'signed', 'cancelled', 'completed')),
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    transaction_reference TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bewertungen
CREATE TABLE review (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    comment TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
