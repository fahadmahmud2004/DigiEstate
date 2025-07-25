--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

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
-- Name: complaint_target_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.complaint_target_type AS ENUM (
    'user',
    'property'
);


ALTER TYPE public.complaint_target_type OWNER TO postgres;

--
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
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'Pending',
    'Completed',
    'Failed'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: property_availability; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.property_availability AS ENUM (
    'Available',
    'Occupied',
    'Under Maintenance'
);


ALTER TYPE public.property_availability OWNER TO postgres;

--
-- Name: property_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.property_status AS ENUM (
    'Pending Verification',
    'Active',
    'Flagged'
);


ALTER TYPE public.property_status OWNER TO postgres;

--
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
-- Name: review_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.review_type AS ENUM (
    'property',
    'user'
);


ALTER TYPE public.review_type OWNER TO postgres;

--
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
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    preferred_date date NOT NULL,
    preferred_time character varying(50) NOT NULL,
    message text NOT NULL,
    status public.booking_status DEFAULT 'Pending'::public.booking_status NOT NULL,
    decline_reason text,
    reference_number character varying(255) NOT NULL,
    payment_amount numeric(12,2),
    payment_method public.payment_method,
    payment_status public.payment_status DEFAULT 'Pending'::public.payment_status,
    payment_transaction_id character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bookings OWNER TO postgres;

--
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
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, property_id, buyer_id, seller_id, preferred_date, preferred_time, message, status, decline_reason, reference_number, payment_amount, payment_method, payment_status, payment_transaction_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaints (id, complainant_id, target_id, target_type, type, description, evidence, status, resolution, admin_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, sender_id, receiver_id, content, attachments, is_read, conversation_id, property_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_preferences (id, user_id, booking_notifications, payment_notifications, message_notifications, admin_notifications, system_notifications, email_notifications, created_at) FROM stdin;
6e8b75f9-4e36-4e1d-b42f-66394798068c	8252c8e4-65d8-4b2b-ad3b-74eeb35d9b59	t	t	t	t	t	t	2025-07-24 20:16:07.261691
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, is_read, data, created_at) FROM stdin;
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.properties (id, title, description, type, price, location, availability, images, videos, bedrooms, bathrooms, floor_number, total_floors, area, road_width, is_corner_plot, parking_spaces, is_furnished, has_ac, has_lift, has_parking, custom_features, nearby_facilities, owner_id, status, views, inquiries, bookings, created_at, updated_at) FROM stdin;
47cca3ef-2498-409f-924b-c27c30b82767	3	3	Plot	32.00	32	Available	{}	{}	\N	\N	\N	\N	3221.00	32.00	t	\N	f	f	f	f	{}	{}	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Pending Verification	2	0	0	2025-07-24 20:28:21.34595	2025-07-24 20:28:21.34595
275f74b2-4afe-4584-8a97-f34cf8d7eb9c	2	21	Plot	213.00	32	Available	{}	{}	\N	\N	\N	\N	213.00	31.00	t	\N	f	t	f	f	{}	{}	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Pending Verification	0	0	0	2025-07-24 23:38:58.449943	2025-07-24 23:38:58.449943
d4eff2fe-a523-4507-b99f-953a7f2206cb	Villa	onek valo basa.\n\nvaloi	Flat	2222.00	Lalbagh	Available	{"","",""}	{}	2	2	1	33	\N	\N	f	\N	f	f	f	f	{11}	{}	0415528a-1dee-4409-aecd-88b360b98cf3	Pending Verification	0	0	0	2025-07-25 01:35:38.586652	2025-07-25 01:35:38.586652
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, review_type, target_id, reviewer_id, rating, comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, name, phone, avatar, role, is_active, reputation, refresh_token, created_at, updated_at, last_login_at) FROM stdin;
8252c8e4-65d8-4b2b-ad3b-74eeb35d9b59	admin@digihomehub.com	$2b$10$Dhh0TQfCb/qQ9dZ57RSWveIK.Gp2vg5RbPyX9kofiDRMZ07ilxxUS	Admin User	\N	\N	admin	t	4.50	\N	2025-07-24 20:16:07.251637	2025-07-24 20:16:07.251637	2025-07-24 20:16:07.251637
24daa3b0-a269-4488-80c0-f5b1479a33d3	testuser@example.com	$2b$10$tZV50vIWNKAa5NwZwHBU7el4LUCjCvUC3NGoKEeP2SkgVw9qaO8hS	Test User			user	t	4.50	\N	2025-07-24 20:48:52.273026	2025-07-24 20:48:52.273026	2025-07-24 20:55:17.054475
206cff83-9088-49e5-9a33-468905f38011	Fahim	$2b$10$DjvDaFKsljEr2G.J6rCj7OIoXiGJSJaEezS51tMVafQF.x2ZubOoq	fahim1234			user	t	4.50	\N	2025-07-25 00:37:52.032313	2025-07-25 00:37:52.032313	2025-07-25 00:37:52.032313
b5a0b8be-4bd2-492c-bf06-3af94c78536c	lol	$2b$10$uZwDazafM74C22r5uBqtGuqK.NEmIYgoLgLzdu5Z8tTl4.CU7LNnq	123456			user	t	4.50	\N	2025-07-25 00:38:54.751906	2025-07-25 00:38:54.751906	2025-07-25 00:38:54.751906
c9eac6d0-2e69-4671-9d64-3b7f9019be3e	valo chele	$2b$10$CBx2WwktUQPawODkr.5SMesANGva4rwViCrRJzksHuNpMI3/l73fy	111111			user	t	4.50	\N	2025-07-25 00:45:42.473879	2025-07-25 00:45:42.473879	2025-07-25 00:45:42.473879
9cf59dc0-9644-4076-bb1b-10378e083474	lala	$2b$10$abi4cRZ9Jm/NOgvgY1rT3OLR.v9a6pcVymSxsAhU6qO6yLl661qBy	111111			user	t	4.50	\N	2025-07-25 00:48:00.949888	2025-07-25 00:48:00.949888	2025-07-25 00:48:00.949888
0415528a-1dee-4409-aecd-88b360b98cf3	lala@gmail.com	$2b$10$TJkbscYpNOaeGHYM.Lh.2.MVCPVkFzyoDdCD4b3HD4Iq/jS8Eptiq				user	t	4.50	\N	2025-07-25 01:32:53.993149	2025-07-25 01:32:53.993149	2025-07-25 02:46:42.136615
2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	fahimfaiazadib@gmail.com	$2b$10$dDBalrA8QtvvVQThFvVIbOXUoD9J0XF/lYTVN7TJw64KapWU9JlU6				user	t	4.50	\N	2025-07-24 20:19:45.336223	2025-07-24 20:19:45.336223	2025-07-25 03:15:45.185293
\.


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_reference_number_key UNIQUE (reference_number);


--
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reviews unique_review; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT unique_review UNIQUE (review_type, target_id, reviewer_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_refresh_token_key UNIQUE (refresh_token);


--
-- Name: idx_bookings_buyer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_buyer_id ON public.bookings USING btree (buyer_id);


--
-- Name: idx_bookings_property_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_property_id ON public.bookings USING btree (property_id);


--
-- Name: idx_bookings_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_seller_id ON public.bookings USING btree (seller_id);


--
-- Name: idx_complaints_complainant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_complainant_id ON public.complaints USING btree (complainant_id);


--
-- Name: idx_complaints_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_created_at ON public.complaints USING btree (created_at DESC);


--
-- Name: idx_complaints_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_status ON public.complaints USING btree (status);


--
-- Name: idx_messages_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);


--
-- Name: idx_messages_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);


--
-- Name: idx_notification_preferences_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_properties_owner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_owner_id ON public.properties USING btree (owner_id);


--
-- Name: idx_reviews_reviewer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_reviewer_id ON public.reviews USING btree (reviewer_id);


--
-- Name: bookings bookings_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: complaints complaints_complainant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_complainant_id_fkey FOREIGN KEY (complainant_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: properties properties_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

