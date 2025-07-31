--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-07-30 03:52:01 +06

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
-- TOC entry 867 (class 1247 OID 18740)
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'Pending',
    'Accepted',
    'Declined',
    'Completed',
    'Cancelled'
);


--
-- TOC entry 906 (class 1247 OID 19026)
-- Name: complaint_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.complaint_status AS ENUM (
    'open',
    'in-progress',
    'resolved',
    'dismissed'
);


--
-- TOC entry 909 (class 1247 OID 19036)
-- Name: complaint_target_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.complaint_target_type AS ENUM (
    'user',
    'property'
);


--
-- TOC entry 912 (class 1247 OID 19042)
-- Name: complaint_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.complaint_type AS ENUM (
    'Fraudulent Listing',
    'Inappropriate Behavior',
    'Payment Issues',
    'Other'
);


--
-- TOC entry 903 (class 1247 OID 19014)
-- Name: listing_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.listing_status AS ENUM (
    'Sale',
    'Rent'
);


--
-- TOC entry 879 (class 1247 OID 18802)
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'booking',
    'payment',
    'message',
    'admin',
    'system'
);


--
-- TOC entry 870 (class 1247 OID 18752)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'Cash',
    'Bank Transfer',
    'Mobile Payment',
    'Check'
);


--
-- TOC entry 873 (class 1247 OID 18762)
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'Pending',
    'Completed',
    'Failed'
);


--
-- TOC entry 861 (class 1247 OID 18724)
-- Name: property_availability; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.property_availability AS ENUM (
    'Available',
    'Occupied',
    'Under Maintenance'
);


--
-- TOC entry 864 (class 1247 OID 18732)
-- Name: property_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.property_status AS ENUM (
    'Pending Verification',
    'Active',
    'Flagged',
    'Rejected'
);


--
-- TOC entry 858 (class 1247 OID 18710)
-- Name: property_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.property_type AS ENUM (
    'Flat',
    'Office Apartment',
    'Land',
    'Garage',
    'Godown',
    'Plot'
);


--
-- TOC entry 876 (class 1247 OID 18770)
-- Name: review_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.review_type AS ENUM (
    'property',
    'user'
);


--
-- TOC entry 855 (class 1247 OID 18705)
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin'
);


--
-- TOC entry 226 (class 1255 OID 19023)
-- Name: notify_property_deletion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_property_deletion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Notify the property owner when their property is deleted
    INSERT INTO notifications (user_id, type, title, message, data, created_at)
    VALUES (
        OLD.owner_id,
        'admin',
        'Property Deleted',
        'Your property "' || COALESCE(OLD.title, 'Untitled Property') || '" has been deleted by an administrator.',
        jsonb_build_object(
            'propertyId', OLD.id,
            'propertyTitle', COALESCE(OLD.title, 'Untitled Property'),
            'action', 'deletion'
        ),
        NOW()
    );
    
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the transaction
        RAISE WARNING 'Error in notify_property_deletion: %', SQLERRM;
        RETURN OLD;
END;
$$;


--
-- TOC entry 225 (class 1255 OID 19021)
-- Name: notify_property_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_property_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- If property is being flagged or rejected, notify the owner
    IF (NEW.status = 'Flagged' OR NEW.status = 'Rejected') AND (OLD.status != 'Flagged' AND OLD.status != 'Rejected') THEN
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES (
            NEW.owner_id,
            'admin',
            CASE 
                WHEN NEW.status = 'Flagged' THEN 'Property Flagged'
                WHEN NEW.status = 'Rejected' THEN 'Property Rejected'
            END,
            CASE 
                WHEN NEW.status = 'Flagged' THEN 'Your property "' || COALESCE(NEW.title, 'Untitled Property') || '" has been flagged by an administrator for review.'
                WHEN NEW.status = 'Rejected' THEN 'Your property "' || COALESCE(NEW.title, 'Untitled Property') || '" has been rejected by an administrator.'
            END,
            jsonb_build_object(
                'propertyId', NEW.id,
                'propertyTitle', COALESCE(NEW.title, 'Untitled Property'),
                'oldStatus', OLD.status,
                'newStatus', NEW.status,
                'action', 'status_change'
            ),
            NOW()
        );
    END IF;
    
    -- If property is being approved (status changed to Active), notify the owner
    IF NEW.status = 'Active' AND OLD.status != 'Active' THEN
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES (
            NEW.owner_id,
            'admin',
            'Property Approved',
            'Your property "' || COALESCE(NEW.title, 'Untitled Property') || '" has been approved and is now live on the platform.',
            jsonb_build_object(
                'propertyId', NEW.id,
                'propertyTitle', COALESCE(NEW.title, 'Untitled Property'),
                'oldStatus', OLD.status,
                'newStatus', NEW.status,
                'action', 'status_change'
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the transaction
        RAISE WARNING 'Error in notify_property_status_change: %', SQLERRM;
        RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 18871)
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
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
    reference_number character varying(255) NOT NULL,
    CONSTRAINT bookings_no_self_booking_check CHECK ((buyer_id <> seller_id))
);


--
-- TOC entry 224 (class 1259 OID 19051)
-- Name: complaints; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 220 (class 1259 OID 18900)
-- Name: messages; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 223 (class 1259 OID 18978)
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 222 (class 1259 OID 18962)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 218 (class 1259 OID 18831)
-- Name: properties; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 221 (class 1259 OID 18927)
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 217 (class 1259 OID 18813)
-- Name: users; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 3784 (class 0 OID 18871)
-- Dependencies: 219
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, property_id, buyer_id, seller_id, message, status, created_at, updated_at, preferred_date, preferred_time, reference_number) FROM stdin;
3667cd51-bbcf-4041-bd84-58ed1aef4d62	2fb93f6f-b9e1-499e-b32b-856f4e1fa1b6	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	0415528a-1dee-4409-aecd-88b360b98cf3		Pending	2025-07-29 23:10:04.290918	2025-07-29 23:10:04.290918	2025-08-05	23:13	REF-17538090042862U8IVJ
96fcd80d-7ef5-4d16-bd49-6547613cb68d	b4b1be31-6e1a-4e8f-a6c1-9a37f2c14694	0415528a-1dee-4409-aecd-88b360b98cf3	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a		Pending	2025-07-29 23:52:46.011328	2025-07-29 23:52:46.011328	2025-07-16	23:54	REF-1753811566010Z0HUAB
65cb2948-c97a-4ab3-83cc-441b9099cbd1	8b0c507a-0455-4491-998c-51b30299e936	0415528a-1dee-4409-aecd-88b360b98cf3	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a		Pending	2025-07-30 00:02:37.538774	2025-07-30 00:02:37.538774	2025-07-03	20:03	REF-1753812157538E3FE65
\.


--
-- TOC entry 3789 (class 0 OID 19051)
-- Dependencies: 224
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.complaints (id, complainant_id, target_id, target_type, type, description, evidence, status, resolution, admin_notes, created_at, updated_at) FROM stdin;
947fda9f-7630-4d22-a54b-9ed55c0a06aa	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	2fb93f6f-b9e1-499e-b32b-856f4e1fa1b6	property	Other	Serious Offensive behaviour	{uploads/complaints/evidence-1753824472600-716202514.jpg}	open			2025-07-30 03:27:52.606086	2025-07-30 03:27:52.606086
\.


--
-- TOC entry 3785 (class 0 OID 18900)
-- Dependencies: 220
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, sender_id, receiver_id, content, attachments, is_read, conversation_id, property_id, created_at, updated_at) FROM stdin;
286a76f3-d035-4da1-b460-07dfc01c93bb	0415528a-1dee-4409-aecd-88b360b98cf3	0415528a-1dee-4409-aecd-88b360b98cf3	hello	{}	t	conv_0415528a-1dee-4409-aecd-88b360b98cf3_0415528a-1dee-4409-aecd-88b360b98cf3	\N	2025-07-29 18:47:21.94	2025-07-30 00:47:44.767512
5892f8c3-8151-4274-adaf-f204f0928833	0415528a-1dee-4409-aecd-88b360b98cf3	0415528a-1dee-4409-aecd-88b360b98cf3	Hiii	{}	t	conv_0415528a-1dee-4409-aecd-88b360b98cf3_0415528a-1dee-4409-aecd-88b360b98cf3	2fb93f6f-b9e1-499e-b32b-856f4e1fa1b6	2025-07-29 18:47:43.732	2025-07-30 00:47:44.767512
b9c209c9-220c-435c-84af-ed36bfeeb204	0415528a-1dee-4409-aecd-88b360b98cf3	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Hi	{}	t	conv_0415528a-1dee-4409-aecd-88b360b98cf3_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	b4b1be31-6e1a-4e8f-a6c1-9a37f2c14694	2025-07-29 18:46:59.321	2025-07-30 00:59:03.601118
fc00ea67-f931-471f-b140-2cb1bfdfa0ed	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Hi	{}	t	conv_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	b4b1be31-6e1a-4e8f-a6c1-9a37f2c14694	2025-07-29 18:38:35.224	2025-07-30 00:59:05.077621
2af87e2f-c6af-4f36-9aa5-7c888a289a7d	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Hello	{}	f	conv_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	\N	2025-07-29 19:07:44.859	2025-07-29 19:07:44.859
202e9660-0e55-4cd4-a555-cfb65ad38f57	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	hello	{}	f	conv_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	\N	2025-07-29 19:08:12.59	2025-07-29 19:08:12.59
18a4aaf2-5448-461e-8a8b-f813fed085e3	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	vai beicha den	{}	f	conv_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	b4b1be31-6e1a-4e8f-a6c1-9a37f2c14694	2025-07-29 19:20:08.397	2025-07-29 19:20:08.397
8c857098-7a4f-43e1-a7bf-6ec5276404ae	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	0415528a-1dee-4409-aecd-88b360b98cf3	Hi	{}	t	conv_0415528a-1dee-4409-aecd-88b360b98cf3_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	\N	2025-07-29 19:18:32.67	2025-07-30 01:20:16.729929
616142e7-9610-446b-9ea2-eaa7957726ea	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	0415528a-1dee-4409-aecd-88b360b98cf3	Would you sell the property ?	{}	t	conv_0415528a-1dee-4409-aecd-88b360b98cf3_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	\N	2025-07-29 19:19:05.075	2025-07-30 01:20:16.729929
6ae1a82a-8b9d-4169-9ad1-10632d639602	0415528a-1dee-4409-aecd-88b360b98cf3	0415528a-1dee-4409-aecd-88b360b98cf3	Self talk	{}	f	conv_0415528a-1dee-4409-aecd-88b360b98cf3_0415528a-1dee-4409-aecd-88b360b98cf3	2fb93f6f-b9e1-499e-b32b-856f4e1fa1b6	2025-07-29 19:22:29.664	2025-07-29 19:22:29.664
be50a35a-6407-49d1-abb6-aa72e4d51b84	0415528a-1dee-4409-aecd-88b360b98cf3	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Hi	{}	t	conv_0415528a-1dee-4409-aecd-88b360b98cf3_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	8b0c507a-0455-4491-998c-51b30299e936	2025-07-29 19:20:59.281	2025-07-30 01:32:27.694646
a81ddcc5-74c0-49c3-a782-0a1148b3c161	0415528a-1dee-4409-aecd-88b360b98cf3	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	lalbagh theke bayazid bochhi	{}	t	conv_0415528a-1dee-4409-aecd-88b360b98cf3_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	8b0c507a-0455-4491-998c-51b30299e936	2025-07-29 19:21:33.663	2025-07-30 01:32:27.694646
cc13ad17-fdc4-4554-b002-937f4caeb841	0415528a-1dee-4409-aecd-88b360b98cf3	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	asha villa theke bayazid bolchhi	{}	t	conv_0415528a-1dee-4409-aecd-88b360b98cf3_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	b4b1be31-6e1a-4e8f-a6c1-9a37f2c14694	2025-07-29 19:21:54.639	2025-07-30 01:32:27.694646
66ce02ff-3d7b-4c44-a75e-06d1066f12b3	0415528a-1dee-4409-aecd-88b360b98cf3	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Vai bechum na	{}	t	conv_0415528a-1dee-4409-aecd-88b360b98cf3_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	2fb93f6f-b9e1-499e-b32b-856f4e1fa1b6	2025-07-29 19:23:10.811	2025-07-30 01:32:27.694646
55c3281b-9399-4f67-89a7-71512e27d1e5	0415528a-1dee-4409-aecd-88b360b98cf3	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	msg	{}	t	conv_0415528a-1dee-4409-aecd-88b360b98cf3_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	b4b1be31-6e1a-4e8f-a6c1-9a37f2c14694	2025-07-29 19:24:34.693	2025-07-30 01:32:27.694646
6a867870-8492-4902-a7f6-435df834e403	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	0415528a-1dee-4409-aecd-88b360b98cf3	Hii	{}	f	conv_0415528a-1dee-4409-aecd-88b360b98cf3_2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	2fb93f6f-b9e1-499e-b32b-856f4e1fa1b6	2025-07-29 21:13:49.112	2025-07-29 21:13:49.112
\.


--
-- TOC entry 3788 (class 0 OID 18978)
-- Dependencies: 223
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_preferences (id, user_id, booking_notifications, payment_notifications, message_notifications, admin_notifications, system_notifications, email_notifications, created_at) FROM stdin;
6e8b75f9-4e36-4e1d-b42f-66394798068c	8252c8e4-65d8-4b2b-ad3b-74eeb35d9b59	t	t	t	t	t	t	2025-07-24 20:16:07.261691
8a992b0d-81c1-48f8-8e7d-6441cb267822	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	t	t	t	t	t	t	2025-07-25 05:10:41.200943
878c95ef-27ca-4492-876b-59570f6979be	0415528a-1dee-4409-aecd-88b360b98cf3	t	t	t	t	t	t	2025-07-25 22:57:04.110076
\.


--
-- TOC entry 3787 (class 0 OID 18962)
-- Dependencies: 222
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, is_read, data, created_at) FROM stdin;
21d998c0-75db-4776-b36d-b258d747c47a	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	admin	Property Deleted	Your property "Ahsanullah hall" has been deleted by an administrator.	t	{"action": "deletion", "propertyId": "96ac7ef5-dc1f-4b6f-a354-cd9a69ccf97f", "propertyTitle": "Ahsanullah hall"}	2025-07-28 21:16:53.879454
a45ec650-f579-4ca2-a104-dac35a5a2705	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	admin	Property Flagged	Your property "Lalbagh" has been flagged by an administrator for review. Reason: no reason	t	{"action": "status_change", "reason": "no reason", "newStatus": "Flagged", "oldStatus": "Active", "propertyId": "8b0c507a-0455-4491-998c-51b30299e936", "propertyTitle": "Lalbagh"}	2025-07-28 21:30:39.261288
a0e482f5-7a87-4d31-85f6-02b0d6aaa3fa	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	admin	Property Approved	Your property "Asha Villa" has been approved and is now live on the platform.	t	{"action": "status_change", "reason": "approved", "newStatus": "Active", "oldStatus": "Pending Verification", "propertyId": "b4b1be31-6e1a-4e8f-a6c1-9a37f2c14694", "propertyTitle": "Asha Villa"}	2025-07-28 21:42:27.252025
110b5c27-70f0-4ec4-9c6f-e60fb902b7e3	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	admin	Property Approved	Your property "231" has been approved and is now live on the platform.	f	{"action": "status_change", "reason": "approved", "newStatus": "Active", "oldStatus": "Pending Verification", "propertyId": "3fe8e0be-0e87-41ad-a53f-da2869576ae4", "propertyTitle": "231"}	2025-07-28 21:47:03.494701
c7c8f411-0212-433b-8e4e-df1d4494ceab	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	admin	Property Approved	Your property "2" has been approved and is now live on the platform.	f	{"action": "status_change", "reason": null, "newStatus": "Active", "oldStatus": "Pending Verification", "propertyId": "275f74b2-4afe-4584-8a97-f34cf8d7eb9c", "propertyTitle": "2"}	2025-07-29 17:53:43.57291
14c3fabf-d161-4cba-9f57-c44a465b80f4	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	admin	Property Approved	Your property "Lalbagh" has been approved and is now live on the platform.	f	{"action": "status_change", "reason": null, "newStatus": "Active", "oldStatus": "Flagged", "propertyId": "8b0c507a-0455-4491-998c-51b30299e936", "propertyTitle": "Lalbagh"}	2025-07-29 17:53:50.820513
35f0a361-1c54-4568-a588-c952ba4bb3cd	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	admin	Property Rejected	Your property "3" has been rejected by an administrator.	f	{"action": "status_change", "reason": null, "newStatus": "Rejected", "oldStatus": "Pending Verification", "propertyId": "47cca3ef-2498-409f-924b-c27c30b82767", "propertyTitle": "3"}	2025-07-29 17:53:56.866166
7f60624d-a7db-4433-8145-aa4925f468a7	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	admin	Property Approved	Your property "Shahanur villa" has been approved and is now live on the platform.	f	{"action": "status_change", "reason": "Good work.", "newStatus": "Active", "oldStatus": "Pending Verification", "propertyId": "c7794e58-4702-4581-bb42-ff0f5838e4be", "propertyTitle": "Shahanur villa"}	2025-07-30 01:45:41.304217
\.


--
-- TOC entry 3783 (class 0 OID 18831)
-- Dependencies: 218
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.properties (id, title, description, type, price, location, availability, images, videos, bedrooms, bathrooms, floor_number, total_floors, area, road_width, is_corner_plot, parking_spaces, is_furnished, has_ac, has_lift, has_parking, custom_features, nearby_facilities, owner_id, status, views, inquiries, bookings, created_at, updated_at, listing_type) FROM stdin;
8b0c507a-0455-4491-998c-51b30299e936	Lalbagh	hello world	Plot	214.00	dhaka	Available	{}	{}	\N	\N	\N	\N	21.00	31.00	f	\N	f	f	f	f	{}	[]	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Active	69	0	0	2025-07-26 01:40:37.018221	2025-07-29 17:53:50.818835	\N
47cca3ef-2498-409f-924b-c27c30b82767	3	3	Plot	32.00	32	Available	{}	{}	\N	\N	\N	\N	3221.00	32.00	t	\N	f	f	f	f	{}	{}	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Rejected	20	0	0	2025-07-24 20:28:21.34595	2025-07-29 17:53:56.865114	\N
c7e099b6-b230-4f55-b9ce-4487d2307c0f	da	da	Flat	21.00	21	Available	{}	{}	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	{}	[]	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Pending Verification	1	0	0	2025-07-26 01:24:54.360488	2025-07-26 01:24:54.360488	\N
2fb93f6f-b9e1-499e-b32b-856f4e1fa1b6	Modern Downtown Loft	A stunning and spacious loft in the heart of the city. Recently renovated with high-end finishes.	Flat	75000.00	Central Business District	Available	{https://example.com/image1.jpg,https://example.com/image2.jpg}	{}	2	2	\N	\N	1200.00	\N	\N	\N	t	\N	\N	t	{}	[]	0415528a-1dee-4409-aecd-88b360b98cf3	Active	114	0	0	2025-07-25 04:05:07.998458	2025-07-25 04:17:35.913129	\N
275f74b2-4afe-4584-8a97-f34cf8d7eb9c	2	21	Plot	213.00	32	Available	{}	{}	\N	\N	\N	\N	213.00	31.00	t	\N	f	t	f	f	{}	{}	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Active	8	0	0	2025-07-24 23:38:58.449943	2025-07-29 17:53:43.571026	\N
3fe8e0be-0e87-41ad-a53f-da2869576ae4	231	321	Flat	32.00	32	Available	{uploads/images-1753473750013-202861376.jpg}	{}	213	231	23	23	\N	\N	f	\N	f	f	f	f	{}	[]	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Active	38	0	0	2025-07-26 02:02:30.016456	2025-07-28 21:47:03.492106	\N
b4b1be31-6e1a-4e8f-a6c1-9a37f2c14694	Asha Villa	Flat Rent From August	Flat	20000.00	Dhaka	Available	{uploads/images-1753716890384-538915327.jpg,uploads/images-1753716890385-665138146.jpeg}	{}	3	1	2	5	\N	\N	f	\N	f	t	t	f	{"Play Ground",Gym,"Parking Lot"}	[{"name": "Hospital", "distance": 1}, {"name": "School", "distance": 0.5}]	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Active	159	0	0	2025-07-28 21:34:50.391488	2025-07-28 21:42:27.250824	Rent
c7794e58-4702-4581-bb42-ff0f5838e4be	Shahanur villa	Safe , Good envioronment	Flat	15000.00	azimpur , dhaka	Available	{uploads/images-1753818138147-391489998.jpeg}	{}	3	1	2	6	\N	\N	f	\N	f	t	t	f	{"Chhade jawar bishesh subidha achhe","subidha nai"}	[{"name": "Hospital", "distance": 1}, {"name": "School for Kids", "distance": 0.5}]	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Active	24	0	0	2025-07-30 01:42:18.156999	2025-07-30 01:45:41.301238	Sale
a936c766-49ff-48e1-a64a-334ad10669fb	valo	onek valo	Office Apartment	222.00	12	Available	{}	{}	\N	\N	21	2	\N	\N	\N	3	t	t	f	f	{}	[]	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Pending Verification	2	0	0	2025-07-25 23:05:20.246525	2025-07-25 23:05:20.246525	\N
d4eff2fe-a523-4507-b99f-953a7f2206cb	Villa	onek valo basa.\n\nvaloi	Flat	2222.00	Lalbagh	Available	{"","",""}	{}	2	2	1	33	\N	\N	f	\N	f	f	f	f	{11}	{}	0415528a-1dee-4409-aecd-88b360b98cf3	Active	28	0	0	2025-07-25 01:35:38.586652	2025-07-28 20:30:38.329244	\N
36923d71-090f-4c3f-ae47-c94223792426	da	da	Flat	29.00	32	Available	{}	{}	3	12	2	\N	\N	\N	f	\N	f	f	f	f	{}	[]	2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	Pending Verification	6	0	0	2025-07-26 01:26:56.335946	2025-07-26 01:26:56.335946	\N
\.


--
-- TOC entry 3786 (class 0 OID 18927)
-- Dependencies: 221
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, review_type, target_id, reviewer_id, rating, comment, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3782 (class 0 OID 18813)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, name, phone, avatar, role, is_active, reputation, refresh_token, created_at, updated_at, last_login_at) FROM stdin;
24daa3b0-a269-4488-80c0-f5b1479a33d3	testuser@example.com	$2b$10$tZV50vIWNKAa5NwZwHBU7el4LUCjCvUC3NGoKEeP2SkgVw9qaO8hS	Test User			user	t	4.50	\N	2025-07-24 20:48:52.273026	2025-07-24 20:48:52.273026	2025-07-24 20:55:17.054475
2c7a8966-9976-4d99-bfd9-480a20704b09	smallBro@gmail.com	$2b$10$ZJiTS.lTZwmDR7dqz8Tqpu3BsUGz7yR/f7Z9cRXKyVs5fg/IRRYSW	smallBro			user	t	4.50	\N	2025-07-26 19:47:44.700453	2025-07-26 19:47:44.700453	2025-07-26 20:34:40.513494
2fdc01e9-b81a-4f64-ae25-626e25b8fc8a	fahimfaiazadib@gmail.com	$2b$10$dDBalrA8QtvvVQThFvVIbOXUoD9J0XF/lYTVN7TJw64KapWU9JlU6	Fahim Faiaz	01537679319	https://example.com/new_avatar.png	user	t	4.50	\N	2025-07-24 20:19:45.336223	2025-07-30 01:51:31.417582	2025-07-30 03:27:13.170313
8252c8e4-65d8-4b2b-ad3b-74eeb35d9b59	admin@digihomehub.com	$2b$10$Dhh0TQfCb/qQ9dZ57RSWveIK.Gp2vg5RbPyX9kofiDRMZ07ilxxUS	Admin User	2441139	\N	admin	t	4.50	\N	2025-07-24 20:16:07.251637	2025-07-30 03:34:38.068789	2025-07-30 03:28:08.22076
206cff83-9088-49e5-9a33-468905f38011	Fahim	$2b$10$DjvDaFKsljEr2G.J6rCj7OIoXiGJSJaEezS51tMVafQF.x2ZubOoq	fahim1234			user	t	4.50	\N	2025-07-25 00:37:52.032313	2025-07-25 00:37:52.032313	2025-07-25 00:37:52.032313
b5a0b8be-4bd2-492c-bf06-3af94c78536c	lol	$2b$10$uZwDazafM74C22r5uBqtGuqK.NEmIYgoLgLzdu5Z8tTl4.CU7LNnq	123456			user	t	4.50	\N	2025-07-25 00:38:54.751906	2025-07-25 00:38:54.751906	2025-07-25 00:38:54.751906
c9eac6d0-2e69-4671-9d64-3b7f9019be3e	valo chele	$2b$10$CBx2WwktUQPawODkr.5SMesANGva4rwViCrRJzksHuNpMI3/l73fy	111111			user	t	4.50	\N	2025-07-25 00:45:42.473879	2025-07-25 00:45:42.473879	2025-07-25 00:45:42.473879
9cf59dc0-9644-4076-bb1b-10378e083474	lala	$2b$10$abi4cRZ9Jm/NOgvgY1rT3OLR.v9a6pcVymSxsAhU6qO6yLl661qBy	111111			user	t	4.50	\N	2025-07-25 00:48:00.949888	2025-07-25 00:48:00.949888	2025-07-25 00:48:00.949888
0415528a-1dee-4409-aecd-88b360b98cf3	lala@gmail.com	$2b$10$TJkbscYpNOaeGHYM.Lh.2.MVCPVkFzyoDdCD4b3HD4Iq/jS8Eptiq	lala			user	t	4.50	\N	2025-07-25 01:32:53.993149	2025-07-27 18:23:42.20354	2025-07-30 01:19:24.188664
1182c5ca-4ac6-4737-ab48-91643621f8d9	BigBro@gmail.com	$2b$10$IKAyD0/otp7RdPbHF3gc5O2Q195Omd0fewwNCvLbOfzCPwHQ6G3Nu	BigBro			user	t	4.50	\N	2025-07-26 19:46:56.185746	2025-07-26 19:46:56.185746	2025-07-26 19:46:56.185746
\.


--
-- TOC entry 3594 (class 2606 OID 18882)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 3596 (class 2606 OID 19012)
-- Name: bookings bookings_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_reference_number_key UNIQUE (reference_number);


--
-- TOC entry 3598 (class 2606 OID 19074)
-- Name: bookings bookings_unique_user_property; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_unique_user_property UNIQUE (buyer_id, property_id);


--
-- TOC entry 3621 (class 2606 OID 19062)
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- TOC entry 3605 (class 2606 OID 18911)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3617 (class 2606 OID 18990)
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 3619 (class 2606 OID 18992)
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- TOC entry 3614 (class 2606 OID 18972)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3592 (class 2606 OID 18865)
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- TOC entry 3608 (class 2606 OID 18937)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3610 (class 2606 OID 18939)
-- Name: reviews unique_review; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT unique_review UNIQUE (review_type, target_id, reviewer_id);


--
-- TOC entry 3585 (class 2606 OID 18828)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3587 (class 2606 OID 18826)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3589 (class 2606 OID 18830)
-- Name: users users_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_refresh_token_key UNIQUE (refresh_token);


--
-- TOC entry 3599 (class 1259 OID 18999)
-- Name: idx_bookings_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_buyer_id ON public.bookings USING btree (buyer_id);


--
-- TOC entry 3600 (class 1259 OID 19001)
-- Name: idx_bookings_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_property_id ON public.bookings USING btree (property_id);


--
-- TOC entry 3601 (class 1259 OID 19000)
-- Name: idx_bookings_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_seller_id ON public.bookings USING btree (seller_id);


--
-- TOC entry 3622 (class 1259 OID 19063)
-- Name: idx_complaints_complainant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_complaints_complainant_id ON public.complaints USING btree (complainant_id);


--
-- TOC entry 3623 (class 1259 OID 19064)
-- Name: idx_complaints_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_complaints_created_at ON public.complaints USING btree (created_at DESC);


--
-- TOC entry 3624 (class 1259 OID 19065)
-- Name: idx_complaints_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_complaints_status ON public.complaints USING btree (status);


--
-- TOC entry 3602 (class 1259 OID 19003)
-- Name: idx_messages_receiver_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);


--
-- TOC entry 3603 (class 1259 OID 19002)
-- Name: idx_messages_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);


--
-- TOC entry 3615 (class 1259 OID 19008)
-- Name: idx_notification_preferences_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);


--
-- TOC entry 3611 (class 1259 OID 19007)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- TOC entry 3612 (class 1259 OID 19006)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 3590 (class 1259 OID 18998)
-- Name: idx_properties_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_owner_id ON public.properties USING btree (owner_id);


--
-- TOC entry 3606 (class 1259 OID 19004)
-- Name: idx_reviews_reviewer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_reviewer_id ON public.reviews USING btree (reviewer_id);


--
-- TOC entry 3635 (class 2620 OID 19024)
-- Name: properties property_deletion_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER property_deletion_trigger AFTER DELETE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.notify_property_deletion();


--
-- TOC entry 3636 (class 2620 OID 19022)
-- Name: properties property_status_change_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER property_status_change_trigger AFTER UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.notify_property_status_change();


--
-- TOC entry 3626 (class 2606 OID 18890)
-- Name: bookings bookings_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3627 (class 2606 OID 18885)
-- Name: bookings bookings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- TOC entry 3628 (class 2606 OID 18895)
-- Name: bookings bookings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3629 (class 2606 OID 18922)
-- Name: messages messages_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;


--
-- TOC entry 3630 (class 2606 OID 18917)
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3631 (class 2606 OID 18912)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3634 (class 2606 OID 18993)
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3633 (class 2606 OID 18973)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3625 (class 2606 OID 18866)
-- Name: properties properties_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3632 (class 2606 OID 18940)
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-07-30 03:52:02 +06

--
-- PostgreSQL database dump complete
--

