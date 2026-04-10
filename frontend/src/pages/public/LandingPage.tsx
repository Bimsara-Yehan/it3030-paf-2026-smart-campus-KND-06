import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    // ── Mouse Following Glow Logic (Motionsites Premium Effect) ──
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    function handleMouseMove({ currentTarget, clientX, clientY }: ReactMouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const features = [
        {
            title: 'Intelligent Asset Cataloging',
            description: 'Discover, filter, and track all university physical resources and equipment through our smart AI-assisted hub.',
            icon: (
                <svg className="w-8 h-8 text-amber-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )
        },
        {
            title: 'Real-Time Space Bookings',
            description: 'Reserve lecture halls and collaborative meeting rooms instantly with conflict-free scheduling algorithms.',
            icon: (
                <svg className="w-8 h-8 text-amber-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            title: 'Advanced IT Ticketing',
            description: 'Submit maintenance requests and track support tickets with precision assignment mapping for speedy resolution.',
            icon: (
                <svg className="w-8 h-8 text-amber-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
            )
        },
        {
            title: 'Active Event Dispatch',
            description: 'Stay completely synchronized with cross-domain notifications ensuring you never miss a campus update.',
            icon: (
                <svg className="w-8 h-8 text-amber-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            )
        }
    ];

    // Physics constants for staggered entrances
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } }
    };

    return (
        <div 
            className="relative min-h-screen bg-slate-50 font-sans text-gray-900 selection:bg-amber-100 overflow-hidden" 
            onMouseMove={handleMouseMove}
        >
            {/* ── Premium Interactive Background Overlay (motionsites style) ── */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            600px circle at ${smoothX}px ${smoothY}px,
                            rgba(180, 83, 9, 0.08),
                            transparent 80%
                        )
                    `,
                }}
            />
            {/* Fine Dot Matrix Overlay to represent 'smart/tech' vibe against the Oak nature */}
            <div 
                className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" 
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,1) 1px, transparent 0)', backgroundSize: '40px 40px' }} 
            />

            
            {/* Header Navigation */}
            <header className="fixed w-full top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-50">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <img src="/logo.png" alt="Oakridge University Logo" className="h-16 w-auto object-contain" />
                        <span className="text-xl font-bold tracking-tight text-gray-900">
                            Oakridge University
                        </span>
                    </motion.div>
                    <motion.button 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 rounded-full text-sm font-semibold bg-gray-900 text-white hover:bg-amber-700 transition-all duration-300 shadow-md hover:shadow-amber-700/30"
                    >
                        Login to Dashboard
                    </motion.button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-40 pb-20 z-10 flex items-center justify-center min-h-[70vh]">
                
                {/* ── Animated "Living Campus" Motion Clip Overlay ── */}
                <style>{`
                    @keyframes cloudDrift {
                        0% { transform: translateX(110vw); opacity: 0; }
                        10% { opacity: 0.8; }
                        90% { opacity: 0.8; }
                        100% { transform: translateX(-30vw); opacity: 0; }
                    }
                    @keyframes leafFall {
                        0% { transform: translateY(-10vh) rotate(0deg) translateX(0); opacity: 0; }
                        10% { opacity: 0.9; }
                        90% { opacity: 0.9; }
                        100% { transform: translateY(80vh) rotate(360deg) translateX(100px); opacity: 0; }
                    }
                    .svg-cloud { position: absolute; pointer-events: none; z-index: 0; animation: cloudDrift linear infinite; fill: #f8fafc; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.02)); }
                    .cloud-1 { top: 12%; width: 15rem; animation-duration: 45s; animation-delay: 0s; }
                    .cloud-2 { top: 28%; width: 22rem; animation-duration: 60s; animation-delay: -25s; fill: #f1f5f9; }
                    .cloud-3 { top: 7%; width: 12rem; animation-duration: 50s; animation-delay: -40s; }
                    
                    .svg-leaf { position: absolute; pointer-events: none; z-index: 0; animation: leafFall linear infinite; fill: rgba(180, 83, 9, 0.4); }
                    .leaf-1 { left: 12%; width: 30px; animation-duration: 16s; animation-delay: 0s; }
                    .leaf-2 { left: 35%; width: 45px; animation-duration: 22s; animation-delay: 3s; fill: rgba(217, 119, 6, 0.25); }
                    .leaf-3 { left: 65%; width: 25px; animation-duration: 14s; animation-delay: 8s; }
                    .leaf-4 { left: 85%; width: 35px; animation-duration: 19s; animation-delay: 1s; fill: rgba(217, 119, 6, 0.35); }
                `}</style>

                {/* Cloud SVG Renderers */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <svg className="svg-cloud cloud-1" viewBox="0 0 24 24"><path d="M17.5 19c-2.485 0-4.5-2.015-4.5-4.5 0-.158.008-.314.024-.468C12.569 13.993 12.045 14 11.5 14c-3.038 0-5.5-2.462-5.5-5.5S8.462 3 11.5 3c2.634 0 4.836 1.85 5.378 4.331.2-.02.404-.031.622-.031 2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5h-5.5z"/></svg>
                    <svg className="svg-cloud cloud-2" viewBox="0 0 24 24"><path d="M17.5 19c-2.485 0-4.5-2.015-4.5-4.5 0-.158.008-.314.024-.468C12.569 13.993 12.045 14 11.5 14c-3.038 0-5.5-2.462-5.5-5.5S8.462 3 11.5 3c2.634 0 4.836 1.85 5.378 4.331.2-.02.404-.031.622-.031 2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5h-5.5z"/></svg>
                    <svg className="svg-cloud cloud-3" viewBox="0 0 24 24"><path d="M17.5 19c-2.485 0-4.5-2.015-4.5-4.5 0-.158.008-.314.024-.468C12.569 13.993 12.045 14 11.5 14c-3.038 0-5.5-2.462-5.5-5.5S8.462 3 11.5 3c2.634 0 4.836 1.85 5.378 4.331.2-.02.404-.031.622-.031 2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5h-5.5z"/></svg>

                    {/* Leaf SVG Renderers */}
                    <svg className="svg-leaf leaf-1" viewBox="0 0 24 24"><path d="M17.3 2.7c-3.6-1.1-7.8.2-10 3.3-1.8 2.5-1.9 6.2-.2 8.7L2.4 19.4c-.4.4-.4 1 0 1.4.4.4 1 .4 1.4 0l4.7-4.7c2.5 1.7 6.2 1.6 8.7-.2 3.1-2.2 4.4-6.4 3.3-10-1-3.6-4.6-5.8-8.2-4.2l-2.4-2.4-2.1.7.9 2h2zm-2.8 11.2c-2.3 2.3-6.2 1.6-7.5-1.5-.7-1.7-.3-3.6.9-4.9s3.1-1.7 4.9-.9c3.2 1.4 3.9 5.3 1.7 7.3z"/></svg>
                    <svg className="svg-leaf leaf-2" viewBox="0 0 24 24"><path d="M17.3 2.7c-3.6-1.1-7.8.2-10 3.3-1.8 2.5-1.9 6.2-.2 8.7L2.4 19.4c-.4.4-.4 1 0 1.4.4.4 1 .4 1.4 0l4.7-4.7c2.5 1.7 6.2 1.6 8.7-.2 3.1-2.2 4.4-6.4 3.3-10-1-3.6-4.6-5.8-8.2-4.2l-2.4-2.4-2.1.7.9 2h2zm-2.8 11.2c-2.3 2.3-6.2 1.6-7.5-1.5-.7-1.7-.3-3.6.9-4.9s3.1-1.7 4.9-.9c3.2 1.4 3.9 5.3 1.7 7.3z"/></svg>
                    <svg className="svg-leaf leaf-3" viewBox="0 0 24 24"><path d="M17.3 2.7c-3.6-1.1-7.8.2-10 3.3-1.8 2.5-1.9 6.2-.2 8.7L2.4 19.4c-.4.4-.4 1 0 1.4.4.4 1 .4 1.4 0l4.7-4.7c2.5 1.7 6.2 1.6 8.7-.2 3.1-2.2 4.4-6.4 3.3-10-1-3.6-4.6-5.8-8.2-4.2l-2.4-2.4-2.1.7.9 2h2zm-2.8 11.2c-2.3 2.3-6.2 1.6-7.5-1.5-.7-1.7-.3-3.6.9-4.9s3.1-1.7 4.9-.9c3.2 1.4 3.9 5.3 1.7 7.3z"/></svg>
                    <svg className="svg-leaf leaf-4" viewBox="0 0 24 24"><path d="M17.3 2.7c-3.6-1.1-7.8.2-10 3.3-1.8 2.5-1.9 6.2-.2 8.7L2.4 19.4c-.4.4-.4 1 0 1.4.4.4 1 .4 1.4 0l4.7-4.7c2.5 1.7 6.2 1.6 8.7-.2 3.1-2.2 4.4-6.4 3.3-10-1-3.6-4.6-5.8-8.2-4.2l-2.4-2.4-2.1.7.9 2h2zm-2.8 11.2c-2.3 2.3-6.2 1.6-7.5-1.5-.7-1.7-.3-3.6.9-4.9s3.1-1.7 4.9-.9c3.2 1.4 3.9 5.3 1.7 7.3z"/></svg>
                </div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-7xl mx-auto px-6 text-center relative z-10"
                >
                    <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-tight">
                        Oakridge University <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-yellow-600">
                            Operations Hub
                        </span>
                    </motion.h1>
                    
                    <motion.p variants={itemVariants} className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
                        A pristine, centralized ecosystem orchestrating university assets, spatial reservations, maintenance workflows, and critical intelligence.
                    </motion.p>
                    
                    <motion.div variants={itemVariants} className="flex justify-center gap-4">
                        <button 
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 rounded-full text-base font-bold bg-amber-700 text-white hover:bg-amber-800 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-amber-700/30 flex items-center gap-2 group"
                        >
                            Experience the Hub
                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* Features Showcase Grid */}
            <section className="py-24 bg-white border-t border-gray-100 relative z-10 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.03)]">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Core Infrastructure Modules</h2>
                        <p className="text-gray-500">Every operational pillar meticulously engineered into a single frame.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div 
                                key={index} 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-slate-50 p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-500 group"
                            >
                                <div className="transform group-hover:scale-110 transition-transform duration-300 origin-left">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Banner Ribbon */}
            <section className="py-12 border-y border-gray-200 bg-slate-50 relative z-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm font-medium uppercase tracking-widest text-center md:text-left gap-6">
                    <span>Powered by Enterprise Tech</span>
                    <div className="flex gap-8 items-center">
                        <span className="hover:text-amber-700 transition-colors cursor-default">Spring Boot 3</span>
                        <span className="hover:text-amber-700 transition-colors cursor-default">React 18</span>
                        <span className="hover:text-amber-700 transition-colors cursor-default">PostgreSQL Neon</span>
                        <span className="hover:text-amber-700 transition-colors cursor-default">Tailwind CSS</span>
                    </div>
                </div>
            </section>
            
            {/* Structural Footer */}
            <footer className="bg-white py-12 text-center text-gray-400 text-sm relative z-10">
                <p>&copy; {new Date().getFullYear()} Oakridge University Operations Hub. All rights reserved.</p>
            </footer>
        </div>
    );
}
