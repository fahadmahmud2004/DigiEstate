--
-- PostgreSQL database dump
--

-- Started on 2025-07-26 02:42:39 +06

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
-- SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Types (Enums)
--
DROP TYPE IF EXISTS public.booking_status CASCADE;
CREATE TYPE public.booking_status AS ENUM (
    'Pending',
    'Accepted',
    'Declined',
    'Completed',
    'Cancelled'
);
ALTER TYPE public.booking_status OWNER TO postgres;

DROP TYPE IF EXISTS public.complaint_status CASCADE;
CREATE TYPE public.complaint_status AS ENUM (
    'open',
    'in-progress',
    'resolved',
    'dismissed'
);
ALTER TYPE public.complaint_status OWNER TO postgres;

DROP TYPE IF EXISTS public.complaint_target_type CASCADE;
CREATE TYPE public.complaint_target_type AS ENUM (
    'user',
    'property'
);
ALTER TYPE public.complaint_target_type OWNER TO postgres;

DROP TYPE IF EXISTS public.complaint_type CASCADE;
CREATE TYPE public.complaint_type AS ENUM (
    'Fraudulent Listing',
    'Inappropriate Behavior',
    'Payment Issues',
    'Other'
);
ALTER TYPE public.complaint_type OWNER TO postgres;

DROP TYPE IF EXISTS public.listing_status CASCADE;
CREATE TYPE public.listing_status AS ENUM (
    'Sale',
    'Rent'
);
ALTER TYPE public.listing_status OWNER TO postgres;

DROP TYPE IF EXISTS public.notification_type CASCADE;
CREATE TYPE public.notification_type AS ENUM (
    'booking',
    'payment',
    'message',
    'admin',
    'system'
);
ALTER TYPE public.notification_type OWNER TO postgres;

DROP TYPE IF EXISTS public.payment_method CASCADE;
CREATE TYPE public.payment_method AS ENUM (
    'Cash',
    'Bank Transfer',
    'Mobile Payment',
    'Check'
);
ALTER TYPE public.payment_method OWNER TO postgres;

DROP TYPE IF EXISTS public.payment_status CASCADE;
CREATE TYPE public.payment_status AS ENUM (
    'Pending',
    'Completed',
    'Failed'
);
ALTER TYPE public.payment_status OWNER TO postgres;

DROP TYPE IF EXISTS public.property_availability CASCADE;
CREATE TYPE public.property_availability AS ENUM (
    'Available',
    'Occupied',
    'Under Maintenance'
);
ALTER TYPE public.property_availability OWNER TO postgres;

DROP TYPE IF EXISTS public.property_status CASCADE;
CREATE TYPE public.property_status AS ENUM (
    'Pending Verification',
    'Active',
    'Flagged',
    'Rejected'
);
ALTER TYPE public.property_status OWNER TO postgres;

DROP TYPE IF EXISTS public.property_type CASCADE;
CREATE TYPE public.property_type AS ENUM (
    'Flat',
    'Office Apartment',
    'Land',
    'Garage',
    'Godown',
    'Plot'
);
ALTER TYPE public.property_type OWNER TO postgres;

DROP TYPE IF EXISTS public.review_type CASCADE;
CREATE TYPE public.review_type AS ENUM (
    'property',
    'user'
);
ALTER TYPE public.review_type OWNER TO postgres;

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin'
);
ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Tables
--
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(255),
    phone character varying(50),
    avatar text,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    is_active boolean DEFAULT true,
    reputation numeric(3,2) DEFAULT 4.5,
    refresh_token character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    last_login_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.users OWNER TO postgres;

CREATE TABLE IF NOT EXISTS public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    type public.property_type NOT NULL,
    price numeric(12,2) NOT NULL,
    location character varying(255) NOT NULL,
    availability public.property_availability DEFAULT 'Available'::public.property_availability NOT NULL,
    images text[] DEFAULT '{}'::text[],
    videos text[] DEFAULT '{}'::text[],
    bedrooms integer,
    bathrooms integer,
    floor_number integer,
    total_floors integer,
    area numeric(10,2),
    road_width numeric(8,2),
    is_corner_plot boolean DEFAULT false,
    parking_spaces integer,
    is_furnished boolean DEFAULT false,
    has_ac boolean DEFAULT false,
    has_lift boolean DEFAULT false,
    has_parking boolean DEFAULT false,
    custom_features text[] DEFAULT '{}'::text[],
    nearby_facilities jsonb DEFAULT '[]'::jsonb,
    owner_id uuid NOT NULL,
    status public.property_status DEFAULT 'Pending Verification'::public.property_status NOT NULL,
    views integer DEFAULT 0,
    inquiries integer DEFAULT 0,
    bookings integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    listing_type public.listing_status,
    CONSTRAINT properties_area_check CHECK ((area >= (0)::numeric)),
    CONSTRAINT properties_bathrooms_check CHECK ((bathrooms >= 0)),
    CONSTRAINT properties_bedrooms_check CHECK ((bedrooms >= 0)),
    CONSTRAINT properties_bookings_check CHECK ((bookings >= 0)),
    CONSTRAINT properties_floor_number_check CHECK ((floor_number >= 0)),
    CONSTRAINT properties_inquiries_check CHECK ((inquiries >= 0)),
    CONSTRAINT properties_parking_spaces_check CHECK ((parking_spaces >= 0)),
    CONSTRAINT properties_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT properties_road_width_check CHECK ((road_width >= (0)::numeric)),
    CONSTRAINT properties_total_floors_check CHECK ((total_floors >= 1)),
    CONSTRAINT properties_views_check CHECK ((views >= 0))
);
ALTER TABLE public.properties OWNER TO postgres;

CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    message text NOT NULL,
    status public.booking_status DEFAULT 'Pending'::public.booking_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    preferred_date date,
    preferred_time character varying(50),
    reference_number character varying(255) NOT NULL
);
ALTER TABLE public.bookings OWNER TO postgres;

CREATE TABLE IF NOT EXISTS public.complaints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    complainant_id uuid NOT NULL,
    target_id uuid NOT NULL,
    target_type public.complaint_target_type NOT NULL,
    type public.complaint_type NOT NULL,
    description text NOT NULL,
    evidence text[] DEFAULT '{}'::text[],
    status public.complaint_status DEFAULT 'open'::public.complaint_status NOT NULL,
    resolution text,
    admin_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.complaints OWNER TO postgres;

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text NOT NULL,
    attachments text[] DEFAULT '{}'::text[],
    is_read boolean DEFAULT false,
    conversation_id character varying(255) NOT NULL,
    property_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.messages OWNER TO postgres;

CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_type public.review_type NOT NULL,
    target_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    rating integer NOT NULL,
    comment character varying(1000) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
ALTER TABLE public.reviews OWNER TO postgres;

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.notifications OWNER TO postgres;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    booking_notifications boolean DEFAULT true,
    payment_notifications boolean DEFAULT true,
    message_notifications boolean DEFAULT true,
    admin_notifications boolean DEFAULT true,
    system_notifications boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.notification_preferences OWNER TO postgres;


--
-- Constraints
--

-- users table
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_refresh_token_key;
ALTER TABLE public.users ADD CONSTRAINT users_refresh_token_key UNIQUE (refresh_token);

-- properties table
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_pkey;
ALTER TABLE public.properties ADD CONSTRAINT properties_pkey PRIMARY KEY (id);
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;
ALTER TABLE public.properties ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- bookings table
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_reference_number_key;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_reference_number_key UNIQUE (reference_number);
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_unique_user_property;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_unique_user_property UNIQUE (buyer_id, property_id);
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_self_booking_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_self_booking_check CHECK (buyer_id <> seller_id);
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_buyer_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_property_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_seller_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- complaints table
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_pkey;
ALTER TABLE public.complaints ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_complainant_id_fkey;
ALTER TABLE public.complaints ADD CONSTRAINT complaints_complainant_id_fkey FOREIGN KEY (complainant_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- messages table
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_property_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- reviews table
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_pkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS unique_review;
ALTER TABLE public.reviews ADD CONSTRAINT unique_review UNIQUE (review_type, target_id, reviewer_id);
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- notifications table
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- notification_preferences table
ALTER TABLE public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_pkey;
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);
ALTER TABLE public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_user_id_key;
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);
ALTER TABLE public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

--
-- Indexes
--
CREATE INDEX IF NOT EXISTS idx_bookings_buyer_id ON public.bookings USING btree (buyer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings USING btree (property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_seller_id ON public.bookings USING btree (seller_id);
CREATE INDEX IF NOT EXISTS idx_complaints_complainant_id ON public.complaints USING btree (complainant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints USING btree (status);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages USING btree (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages USING btree (sender_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews USING btree (reviewer_id);

--
-- Functions & Triggers
--

-- Trigger function for property status changes
CREATE OR REPLACE FUNCTION notify_property_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'Flagged' OR NEW.status = 'Rejected') AND (OLD.status != 'Flagged' AND OLD.status != 'Rejected') THEN
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES (NEW.owner_id, 'admin', CASE WHEN NEW.status = 'Flagged' THEN 'Property Flagged' WHEN NEW.status = 'Rejected' THEN 'Property Rejected' END, CASE WHEN NEW.status = 'Flagged' THEN 'Your property "' || COALESCE(NEW.title, 'Untitled Property') || '" has been flagged by an administrator for review.' WHEN NEW.status = 'Rejected' THEN 'Your property "' || COALESCE(NEW.title, 'Untitled Property') || '" has been rejected by an administrator.' END, jsonb_build_object('propertyId', NEW.id, 'propertyTitle', COALESCE(NEW.title, 'Untitled Property'), 'oldStatus', OLD.status, 'newStatus', NEW.status, 'action', 'status_change'), NOW());
    END IF;
    IF NEW.status = 'Active' AND OLD.status != 'Active' THEN
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES (NEW.owner_id, 'admin', 'Property Approved', 'Your property "' || COALESCE(NEW.title, 'Untitled Property') || '" has been approved and is now live on the platform.', jsonb_build_object('propertyId', NEW.id, 'propertyTitle', COALESCE(NEW.title, 'Untitled Property'), 'oldStatus', OLD.status, 'newStatus', NEW.status, 'action', 'status_change'), NOW());
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in notify_property_status_change: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property status changes
DROP TRIGGER IF EXISTS property_status_change_trigger ON public.properties;
CREATE TRIGGER property_status_change_trigger
    AFTER UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION notify_property_status_change();

-- Trigger function for property deletions
CREATE OR REPLACE FUNCTION notify_property_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data, created_at)
    VALUES (OLD.owner_id, 'admin', 'Property Deleted', 'Your property "' || COALESCE(OLD.title, 'Untitled Property') || '" has been deleted by an administrator.', jsonb_build_object('propertyId', OLD.id, 'propertyTitle', COALESCE(OLD.title, 'Untitled Property'), 'action', 'deletion'), NOW());
    RETURN OLD;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in notify_property_deletion: %', SQLERRM;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property deletions
DROP TRIGGER IF EXISTS property_deletion_trigger ON public.properties;
CREATE TRIGGER property_deletion_trigger
    AFTER DELETE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION notify_property_deletion();

-- Test trigger for debugging
CREATE OR REPLACE FUNCTION test_property_deletion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'Property deleted: %', OLD.title;
    RETURN OLD;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in test_property_deletion: %', SQLERRM;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Test trigger for property deletions
DROP TRIGGER IF EXISTS test_property_deletion_trigger ON public.properties;
CREATE TRIGGER test_property_deletion_trigger
    AFTER DELETE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION test_property_deletion();

-- Reputation Penalty Functions
CREATE OR REPLACE FUNCTION apply_property_flagging_penalty()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != 'Flagged' AND NEW.status = 'Flagged' THEN
        UPDATE users SET reputation = GREATEST(reputation - 0.5, 0.0) WHERE id = NEW.owner_id;
        INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES (NEW.owner_id, 'system', 'Property Flagged - Reputation Penalty', 'Your property "' || NEW.title || '" has been flagged. A 0.5 point reputation penalty has been applied.', false, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION apply_property_deletion_penalty()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET reputation = GREATEST(reputation - 1.0, 0.0) WHERE id = OLD.owner_id;
    INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES (OLD.owner_id, 'system', 'Property Deleted - Reputation Penalty', 'Your property "' || OLD.title || '" has been deleted. A 1.0 point reputation penalty has been applied.', false, NOW());
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_user_reputation_and_suspend()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reputation < 2.0 AND NEW.is_active = true THEN
        UPDATE users SET is_active = false WHERE id = NEW.id;
        INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES (NEW.id, 'system', 'Account Suspended - Low Reputation', 'Your account has been suspended due to low reputation (' || NEW.reputation || '). Please contact support for assistance.', false, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reputation Penalty Triggers
DROP TRIGGER IF EXISTS property_flagging_penalty_trigger ON public.properties;
CREATE TRIGGER property_flagging_penalty_trigger
    AFTER UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION apply_property_flagging_penalty();

DROP TRIGGER IF EXISTS property_deletion_penalty_trigger ON public.properties;
CREATE TRIGGER property_deletion_penalty_trigger
    AFTER DELETE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION apply_property_deletion_penalty();

DROP TRIGGER IF EXISTS user_reputation_check_trigger ON public.users;
CREATE TRIGGER user_reputation_check_trigger
    AFTER UPDATE OF reputation ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_user_reputation_and_suspend();

--
-- PostgreSQL database dump complete
--