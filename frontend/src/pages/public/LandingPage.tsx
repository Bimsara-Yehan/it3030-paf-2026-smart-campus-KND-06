import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { Award, BookOpen, Calendar, ChevronRight, Cpu, Feather, Globe, Leaf, MapPin, TrendingUp, Users } from 'lucide-react';
import { MouseEvent as ReactMouseEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();
    const aboutRef = useRef<HTMLElement>(null);
    const campusRef = useRef<HTMLElement>(null);

    // ── Mouse Following Glow ──
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    function handleMouseMove({ currentTarget, clientX, clientY }: ReactMouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    function scrollToAbout() {
        aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    function scrollToCampus() {
        campusRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50, damping: 20 } },
    };

    return (
        <div
            className="relative min-h-screen bg-slate-50 font-sans text-gray-900 selection:bg-amber-100"
            onMouseMove={handleMouseMove}
        >
            {/* ── Global Dot Matrix Texture ── */}
            <div
                className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,1) 1px, transparent 0)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* ══════════════════════════════════════════
                STICKY NAVIGATION
            ══════════════════════════════════════════ */}
            <header className="fixed w-full top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Oakridge University" className="h-14 w-auto object-contain" />
                        <span className="text-lg font-bold tracking-tight text-gray-900">Oakridge University</span>
                    </div>

                    {/* Nav Links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                        <button onClick={scrollToAbout} className="hover:text-amber-700 transition-colors duration-200">Academic Programs</button>
                        <button onClick={scrollToCampus} className="hover:text-amber-700 transition-colors duration-200">Campus Life</button>
                        <button onClick={scrollToAbout} className="hover:text-amber-700 transition-colors duration-200">Admissions</button>
                    </nav>

                    {/* Login CTA */}
                    <button
                        onClick={() => navigate('/login')}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gray-900 text-white hover:bg-amber-700 transition-all duration-300 shadow-md"
                    >
                        Login
                    </button>
                </div>
            </header>

            {/* ══════════════════════════════════════════
                HERO SECTION
            ══════════════════════════════════════════ */}
            <section className="relative min-h-screen flex items-center overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: 'url(/landing-page1.png)' }}
                />
                {/* Gradient Overlay — text readable left, image clear right */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                {/* Mouse Glow — hero only */}
                <motion.div
                    className="pointer-events-none absolute inset-0 z-10"
                    style={{
                        background: useMotionTemplate`radial-gradient(600px circle at ${smoothX}px ${smoothY}px, rgba(194, 84, 0, 0.18), transparent 80%)`,
                    }}
                />

                {/* Hero Content */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative z-20 max-w-7xl mx-auto px-6 pt-20 w-full"
                >
                    <motion.p variants={itemVariants} className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-5">
                        Oakridge University · Est. 1894
                    </motion.p>
                    <motion.h1
                        variants={itemVariants}
                        className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 max-w-2xl"
                    >
                        Your Journey to{' '}
                        <span className="text-amber-400">Impact</span>{' '}
                        Starts Here.
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-lg text-gray-300 max-w-xl mb-10 leading-relaxed">
                        A century of academic excellence, research leadership, and global citizenship — shaping the bold minds that define tomorrow.
                    </motion.p>
                    <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 rounded-full font-bold bg-amber-600 text-white hover:bg-amber-700 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-amber-900/40 flex items-center gap-2 group"
                        >
                            Apply for Fall 2026
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={scrollToAbout}
                            className="px-8 py-4 rounded-full font-bold border-2 border-white/70 text-white hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 group"
                        >
                            Explore
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* ══════════════════════════════════════════
                STATS BAR
            ══════════════════════════════════════════ */}
            <section className="bg-white border-y border-gray-100 py-14 relative z-10">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { value: '14:1', label: 'Student-to-Faculty Ratio' },
                        { value: '92%', label: 'Graduate Employment Rate' },
                        { value: '50+', label: 'Research-led Programs' },
                        { value: '$12M', label: 'Annual Merit Scholarships' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <p className="text-4xl font-extrabold text-amber-700 mb-1">{stat.value}</p>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════
                ABOUT US / LORE SECTION
            ══════════════════════════════════════════ */}
            <section ref={aboutRef} id="about" className="py-24 bg-slate-50 relative z-10 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Image — Left */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="relative"
                    >
                        <img
                            src="/landing-page3.png"
                            alt="Students on the Green Commons"
                            className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
                        />
                        {/* Floating badge */}
                        <div className="absolute -bottom-4 -right-4 bg-amber-700 text-white px-6 py-4 rounded-2xl shadow-xl">
                            <p className="text-2xl font-extrabold">130+</p>
                            <p className="text-xs font-medium opacity-80">Years of Excellence</p>
                        </div>
                    </motion.div>

                    {/* Text — Right */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <p className="text-amber-700 text-sm font-semibold tracking-widest uppercase mb-3">
                            Est. 1894 · Oakridge Valley
                        </p>
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                            A Legacy Rooted<br />in Purpose
                        </h2>
                        <p className="text-gray-500 leading-relaxed mb-6">
                            Founded in 1894 beneath the ancient oaks of Oakridge Valley, our first building —{' '}
                            <span className="font-semibold text-gray-700">Old Oaks Hall</span> — still stands as the
                            beating heart of campus. What began as a small college of arts and sciences has grown into
                            a globally recognised research university, yet our founding principle remains unchanged:
                            education that transforms lives and serves communities.
                        </p>

                        {/* Mission Blockquote */}
                        <blockquote className="border-l-4 border-amber-600 pl-5 py-3 mb-8 bg-amber-50 rounded-r-2xl">
                            <p className="text-gray-800 font-semibold italic leading-relaxed">
                                "To cultivate bold minds, foster intellectual courage, and empower graduates to lead
                                with integrity in a rapidly changing world."
                            </p>
                            <footer className="text-amber-700 text-sm font-medium mt-2">
                                — Oakridge University Mission Statement
                            </footer>
                        </blockquote>

                        {/* Core Value Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                {
                                    icon: <BookOpen className="w-5 h-5 text-amber-700" />,
                                    title: 'Intellectual Courage',
                                    desc: 'Question convention, challenge assumptions.',
                                },
                                {
                                    icon: <Globe className="w-5 h-5 text-amber-700" />,
                                    title: 'Global Citizenship',
                                    desc: 'Act locally, think globally, lead humanely.',
                                },
                                {
                                    icon: <Leaf className="w-5 h-5 text-amber-700" />,
                                    title: 'Sustainable Innovation',
                                    desc: 'Build futures the planet can sustain.',
                                },
                            ].map((val, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300"
                                >
                                    <div className="mb-2">{val.icon}</div>
                                    <p className="text-sm font-bold text-gray-900 mb-1">{val.title}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{val.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                ACADEMIC PILLARS
            ══════════════════════════════════════════ */}
            <section className="py-24 bg-white relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <p className="text-amber-700 text-sm font-semibold tracking-widest uppercase mb-3">Colleges & Schools</p>
                        <h2 className="text-4xl font-extrabold text-gray-900">Academic Pillars</h2>
                        <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                            Three world-class schools, one unified mission of excellence.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                        {/* Card 1 — Sutherland School */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0 }}
                            className="rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-500 group bg-white"
                        >
                            <div className="h-48 overflow-hidden">
                                <img
                                    src="/landing-page2.png"
                                    alt="Sutherland School of Business"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-5 h-5 text-amber-700" />
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Business & Analytics</p>
                                </div>
                                <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                                    Sutherland School of Business
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Home to our Lab-to-Market incubator — where student ventures become real companies.
                                    Specialising in Finance, Strategy, and Data Analytics.
                                </p>
                            </div>
                        </motion.div>

                        {/* Card 2 — Marston Institute (Featured, parallax bg) */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.15 }}
                            className="rounded-3xl overflow-hidden shadow-2xl relative group md:-mt-6 md:mb-6"
                            style={{ minHeight: '440px' }}
                        >
                            {/* Parallax Background */}
                            <div
                                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                                style={{ backgroundImage: 'url(/landing-page4.png)' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/10" />
                            <div className="relative z-10 p-7 flex flex-col justify-end" style={{ minHeight: '440px' }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Cpu className="w-5 h-5 text-amber-400" />
                                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Technology & Engineering</p>
                                </div>
                                <h3 className="text-xl font-extrabold text-white mb-3">
                                    Marston Institute of Technology
                                </h3>
                                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                                    Pioneering sustainable engineering and ethical AI research within architecturally
                                    stunning collaborative spaces built for the next generation of innovators.
                                </p>
                                <div className="inline-flex items-center gap-1 text-amber-400 text-sm font-semibold">
                                    Explore Marston <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 3 — Liberal Arts */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-500 group bg-white"
                        >
                            <div className="h-48 overflow-hidden">
                                <img
                                    src="/landing-page5.png"
                                    alt="Oakridge College of Liberal Arts"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Feather className="w-5 h-5 text-amber-700" />
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Liberal Arts</p>
                                </div>
                                <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                                    Oakridge College of Liberal Arts
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Creative Writing, Political Science, and Philosophy programmes that build communicators
                                    and critical thinkers ready for complex global challenges.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                CAMPUS LIFE & CULTURE
            ══════════════════════════════════════════ */}
            <section ref={campusRef} id="campus" className="relative z-10 overflow-hidden">
                {/* Wide Cinematic Banner */}
                <div className="relative h-96">
                    <img
                        src="/landing-page3.png"
                        alt="Life at Oakridge"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                    <div className="absolute inset-0 flex items-end">
                        <div className="max-w-7xl mx-auto px-6 pb-12 w-full">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-5xl font-extrabold text-white mb-2"
                            >
                                Life at Oakridge
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-gray-300 text-lg"
                            >
                                Where ambition meets community.
                            </motion.p>
                        </div>
                    </div>
                </div>

                {/* Three Feature Tiles */}
                <div className="bg-slate-50 py-16">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Users className="w-7 h-7 text-amber-700" />,
                                title: 'The Green Commons',
                                desc: 'The social heartbeat of campus. 14 acres of lawns, cafés, and open-air study spaces connecting every corner of student life.',
                            },
                            {
                                icon: <Award className="w-7 h-7 text-amber-700" />,
                                title: 'Oakridge Athletics — The Acorns',
                                desc: 'Compete at varsity level across 18 sports or join 40+ intramural leagues. The Acorns — our symbol of growth, strength, and grit.',
                            },
                            {
                                icon: <Globe className="w-7 h-7 text-amber-700" />,
                                title: 'Global Exchange',
                                desc: '40% of Oakridge students study abroad. With 60+ partner universities across 30 countries, your classroom has no borders.',
                            },
                        ].map((tile, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-500"
                            >
                                <div className="mb-4">{tile.icon}</div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{tile.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{tile.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                OPERATIONS HUB FEATURES (retained)
            ══════════════════════════════════════════ */}
            <section className="py-24 bg-white border-t border-gray-100 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <p className="text-amber-700 text-sm font-semibold tracking-widest uppercase mb-3">Internal Platform</p>
                        <h2 className="text-4xl font-extrabold text-gray-900">Operations Hub</h2>
                        <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                            Every operational pillar meticulously engineered into a single frame.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                title: 'Intelligent Asset Cataloging',
                                desc: 'Discover, filter, and track all university physical resources and equipment through our smart AI-assisted hub.',
                                icon: (
                                    <svg className="w-8 h-8 text-amber-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                ),
                            },
                            {
                                title: 'Real-Time Space Bookings',
                                desc: 'Reserve lecture halls and collaborative meeting rooms instantly with conflict-free scheduling algorithms.',
                                icon: (
                                    <svg className="w-8 h-8 text-amber-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                ),
                            },
                            {
                                title: 'Advanced IT Ticketing',
                                desc: 'Submit maintenance requests and track support tickets with precision assignment mapping for speedy resolution.',
                                icon: (
                                    <svg className="w-8 h-8 text-amber-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                    </svg>
                                ),
                            },
                            {
                                title: 'Active Event Dispatch',
                                desc: 'Stay completely synchronized with cross-domain notifications ensuring you never miss a campus update.',
                                icon: (
                                    <svg className="w-8 h-8 text-amber-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                ),
                            },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-slate-50 p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-500 group"
                            >
                                <div className="transform group-hover:scale-110 transition-transform duration-300 origin-left">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                FOOTER
            ══════════════════════════════════════════ */}
            <footer className="bg-white border-t border-gray-100 relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">

                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <img src="/logo.png" alt="Oakridge University" className="h-10 w-auto object-contain" />
                            <span className="font-bold text-gray-900">Oakridge University</span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed mb-5">
                            Shaping bold minds since 1894.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:underline"
                        >
                            Login to Dashboard <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Accreditation & Location */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">
                            Accreditation & Location
                        </h4>
                        <div className="space-y-3 text-sm text-gray-500">
                            <div className="flex items-start gap-2">
                                <Award className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                                <span>Accredited by the Higher Learning Commission (HLC)</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                                <span>1200 University Drive, Oakridge Valley</span>
                            </div>
                        </div>
                    </div>

                    {/* Key Dates */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">
                            Key Dates — Fall 2026
                        </h4>
                        <div className="space-y-3 text-sm text-gray-500">
                            {[
                                { date: 'Nov 1, 2025', label: 'Early Decision Deadline' },
                                { date: 'Jan 15, 2026', label: 'Regular Applications Close' },
                                { date: 'Mar 31, 2026', label: 'Admissions Decisions Released' },
                                { date: 'May 1, 2026', label: 'Enrollment Confirmation Deadline' },
                                { date: 'Aug 24, 2026', label: 'Fall Orientation Begins' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <Calendar className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                                    <span>
                                        <span className="font-semibold text-gray-700">{item.date}</span> — {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
                    © {new Date().getFullYear()} Oakridge University Operations Hub. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
