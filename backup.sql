--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: cdp_user
--

COPY public.users (id, email, name, created_at, updated_at) FROM stdin;
082d2173-5630-4dc5-83aa-3717d4654242	admin@cdp.com	CDP Administrator	2025-06-16 15:38:11.507259+00	2025-06-16 15:38:11.507259+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: cdp_user
--

COPY public.sessions (id, user_id, session_token, expires_at, created_at) FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

