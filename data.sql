--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-07-26 02:42:39 +06

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 865 (class 1247 OID 18740)
-- Name: booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status AS ENUM (
    'Pending',
    'Accepted',
    'Declined',
    'Completed',
    'Cancelled'
);


ALTER TYPE public.booking_status OWNER TO postgres;

--
-- TOC entry 883 (class 1247 OID 18792)
-- Name: complaint_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.complaint_status AS ENUM (
    'open',
    'in-progress',
    'resolved',
    'dismissed'
);


ALTER TYPE public.complaint_status OWNER TO postgres;

--
-- TOC entry 877 (class 1247 OID 18776)
-- Name: complaint_target_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.complaint_target_type AS ENUM (
    'user',
    'property'
);


ALTER TYPE public.complaint_target_type OWNER TO postgres;

--
-- TOC entry 880 (class 1247 OID 18782)
-- Name: complaint_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.complaint_type AS ENUM (
    'Fraudulent Listing',
    'Inappropriate Behavior',
    'Payment Issues',
    'Other'
);


ALTER TYPE public.complaint_type OWNER TO postgres;

--
-- TOC entry 913 (class 1247 OID 19014)
-- Name: listing_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.listing_status AS ENUM (
    'Sale',
    'Rent'
);


ALTER TYPE public.listing_status OWNER TO postgres;

--
-- TOC entry 886 (class 1247 OID 18802)
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'booking',
    'payment',
    'message',
    'admin',
    'system'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- TOC entry 868 (class 1247 OID 18752)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'Cash',
    'Bank Transfer',
    'Mobile Payment',
    'Check'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- TOC entry 871 (class 1247 OID 18762)
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'Pending',
    'Completed',
    'Failed'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- TOC entry 859 (class 1247 OID 18724)
-- Name: property_availability; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.property_availability AS ENUM (
    'Available',
    'Occupied',
    'Under Maintenance'
);


ALTER TYPE public.property_availability OWNER TO postgres;

--
-- TOC entry 862 (class 1247 OID 18732)
-- Name: property_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.property_status AS ENUM (
    'Pending Verification',
    'Active',
    'Flagged'
);


ALTER TYPE public.property_status OWNER TO postgres;

--
-- TOC entry 856 (class 1247 OID 18710)
-- Name: property_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.property_type AS ENUM (
    'Flat',
    'Office Apartment',
    'Land',
    'Garage',
    'Godown',
    'Plot'
);


ALTER TYPE public.property_type OWNER TO postgres;

--
-- TOC entry 874 (class 1247 OID 18770)
-- Name: review_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.review_type AS ENUM (
    'property',
    'user'
);


ALTER TYPE public.review_type OWNER TO postgres;

--
-- TOC entry 853 (class 1247 OID 18705)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 18871)
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
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

--
-- TOC entry 222 (class 1259 OID 18945)
-- Name: complaints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaints (
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

--
-- TOC entry 220 (class 1259 OID 18900)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
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

--
-- TOC entry 224 (class 1259 OID 18978)
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
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
-- TOC entry 223 (class 1259 OID 18962)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
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

--
-- TOC entry 218 (class 1259 OID 18831)
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
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

--
-- TOC entry 221 (class 1259 OID 18927)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
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

--
-- TOC entry 217 (class 1259 OID 18813)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
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

--
-- TOC entry 3591 (class 2606 OID 18882)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 3593 (class 2606 OID 19012)
-- Name: bookings bookings_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_reference_number_key UNIQUE (reference_number);


--
-- TOC entry 3607 (class 2606 OID 18956)
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- TOC entry 3600 (class 2606 OID 18911)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3617 (class 2606 OID 18990)
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 3619 (class 2606 OID 18992)
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- TOC entry 3614 (class 2606 OID 18972)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3589 (class 2606 OID 18865)
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- TOC entry 3603 (class 2606 OID 18937)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3605 (class 2606 OID 18939)
-- Name: reviews unique_review; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT unique_review UNIQUE (review_type, target_id, reviewer_id);


--
-- TOC entry 3582 (class 2606 OID 18828)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3584 (class 2606 OID 18826)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3586 (class 2606 OID 18830)
-- Name: users users_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_refresh_token_key UNIQUE (refresh_token);


--
-- TOC entry 3594 (class 1259 OID 18999)
-- Name: idx_bookings_buyer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_buyer_id ON public.bookings USING btree (buyer_id);


--
-- TOC entry 3595 (class 1259 OID 19001)
-- Name: idx_bookings_property_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_property_id ON public.bookings USING btree (property_id);


--
-- TOC entry 3596 (class 1259 OID 19000)
-- Name: idx_bookings_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_seller_id ON public.bookings USING btree (seller_id);


--
-- TOC entry 3608 (class 1259 OID 19005)
-- Name: idx_complaints_complainant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_complainant_id ON public.complaints USING btree (complainant_id);


--
-- TOC entry 3609 (class 1259 OID 19010)
-- Name: idx_complaints_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_created_at ON public.complaints USING btree (created_at DESC);


--
-- TOC entry 3610 (class 1259 OID 19009)
-- Name: idx_complaints_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_status ON public.complaints USING btree (status);


--
-- TOC entry 3597 (class 1259 OID 19003)
-- Name: idx_messages_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);


--
-- TOC entry 3598 (class 1259 OID 19002)
-- Name: idx_messages_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);


--
-- TOC entry 3615 (class 1259 OID 19008)
-- Name: idx_notification_preferences_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);


--
-- TOC entry 3611 (class 1259 OID 19007)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- TOC entry 3612 (class 1259 OID 19006)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 3587 (class 1259 OID 18998)
-- Name: idx_properties_owner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_owner_id ON public.properties USING btree (owner_id);


--
-- TOC entry 3601 (class 1259 OID 19004)
-- Name: idx_reviews_reviewer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_reviewer_id ON public.reviews USING btree (reviewer_id);


--
-- TOC entry 3621 (class 2606 OID 18890)
-- Name: bookings bookings_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3622 (class 2606 OID 18885)
-- Name: bookings bookings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- TOC entry 3623 (class 2606 OID 18895)
-- Name: bookings bookings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3628 (class 2606 OID 18957)
-- Name: complaints complaints_complainant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_complainant_id_fkey FOREIGN KEY (complainant_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3624 (class 2606 OID 18922)
-- Name: messages messages_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;


--
-- TOC entry 3625 (class 2606 OID 18917)
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3626 (class 2606 OID 18912)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3630 (class 2606 OID 18993)
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3629 (class 2606 OID 18973)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3620 (class 2606 OID 18866)
-- Name: properties properties_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3627 (class 2606 OID 18940)
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-07-26 02:42:40 +06

--
-- PostgreSQL database dump complete
--

