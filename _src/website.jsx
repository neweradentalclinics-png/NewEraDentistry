        const { useState, useEffect, useMemo, useRef } = React;

        // --- Firebase Config ---
        const firebaseConfig = {
            apiKey: "AIzaSyDQ17UevaMBy2aVYxsrLNpdQCvn92uSKi0",
            authDomain: "new-era-dental-center.firebaseapp.com",
            projectId: "new-era-dental-center",
            storageBucket: "new-era-dental-center.firebasestorage.app",
            messagingSenderId: "11521109321",
            appId: "1:11521109321:web:49e24509d937ff3e20be98"
        };

        // تخزين بسيط على جهاز الزائر (لو المتصفح مانعه بنكمّل عادي)
        const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
        const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
        // مكتبة رفع الصور بتتحمّل بس لما الأدمن يرفع صورة (الزوار مش محتاجينها)
        const loadStorage = () => (window.firebase && firebase.storage) ? Promise.resolve() : new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js'; sc.integrity = 'sha384-yTXgVdKIoM5XuQZ1AGw9zFUgmu45OeHYpGDbbWtXHu/qOJxneVAXbw5Rh5CGninE'; sc.crossOrigin = 'anonymous'; sc.onload = ok; sc.onerror = () => no(new Error('مقدرتش أحمّل أداة رفع الصور — اتأكدي من النت')); document.head.appendChild(sc); });
        let db = null;
        let auth = null;
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            auth = firebase.auth();
        } catch(e) { console.error("Firebase error", e); }

        // --- Icons (Inline SVGs) ---
        const Icons = {
            Phone: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
            Calendar: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
            MapPin: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
            Facebook: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>,
            Instagram: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>,
            Youtube: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>,
            TikTok: ({size=24, className=""}) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a3 3 0 0 1-3-3 3 3 0 0 1-3 3v5a4 4 0 0 1-4-4Z"></path></svg>,
            Sparkles: ({size=24, className=""}) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>,
            Smile: ({size=24, className=""}) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>,
            ShieldCheck: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>,
            Star: ({size=24, className="", fill="none"}) => <svg width={size} height={size} className={className} fill={fill} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
            Activity: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
            UserPlus: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>,
            Award: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>,
            HeartPulse: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path></svg>,
            CheckCircle2: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M8 12l2 2 4-4"></path></svg>,
            Quote: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path></svg>,
            Menu: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
            X: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
            ArrowRight: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
            ArrowLeft: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
            Search: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
            Globe: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
            ExternalLink: ({size=24, className=""}) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        };

        // --- FadeUp Animation Component (لظهور العناصر بشكل طاير وناعم) ---
        const FadeUp = ({ children, delay = 0, className = "" }) => {
            const [isVisible, setIsVisible] = useState(false);
            const domRef = useRef();

            useEffect(() => {
                const observer = new IntersectionObserver(entries => {
                    if (entries[0].isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(domRef.current);
                    }
                }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

                if (domRef.current) observer.observe(domRef.current);
                return () => observer.disconnect();
            }, []);

            return (
                <div
                    ref={domRef}
                    className={`transition-all duration-[1200ms] ease-out ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
                    } ${className}`}
                    style={{ transitionDelay: `${delay}ms` }}
                >
                    {children}
                </div>
            );
        };

        // --- Translations ---
        const LANGUAGES = [
            { code: 'ar', label: 'العربية' }, { code: 'en', label: 'English' }
        ];

        const t = {
            ar: {
                home: 'الرئيسية', about: 'من نحن', services: 'خدماتنا', reviews: 'آراء العملاء', book: 'احجز موعدك',
                heroTitle: 'ابتسامتك تعكس ثقتك', heroSub: 'رعاية طبية تليق بيك بأحدث التقنيات العالمية في مصر، لأنك تستحق الأفضل دايماً.',
                startJourney: 'ابدأ رحلة العلاج', 
                counters: { c1: 10000, t1: 'حالة وثقوا بنا', c2: 1000, t2: 'عملية زراعة', c3: 500, t3: 'حالة تقويم' },
                heroSlogan: 'عشان ضحكتك هي الأهم لينا، احنا هنا موجودين نرجعهالك',
                aboutTitle: 'خبرة أكتر من ١٠ سنين في صناعة الابتسامة', 
                aboutDesc: 'في New Era، جمعنا بين مهارة الدكاترة وأحدث الأجهزة عشان نقدم لك تجربة علاج مريحة. أكتر من 10 سنين بنهتم بصحة أسنان عملائنا عشان يضحكوا من قلبهم.',
                vision: 'رؤيتنا', visionDesc: 'نكون دايماً رقم واحد في طب وتجميل الأسنان، ونوفرلك أحدث تكنولوجيا في العالم هنا في مصر عشان ابتسامتك تفضل منورة وصحتك في أمان.',
                mission: 'رسالتنا', missionDesc: 'نعالج أسنانك صح من غير ألم، ونبني معاك ثقة تعيش سنين. بنهتم بتفاصيل حالتك عشان نطلع بنتيجة طبيعية 100% تعجبك وتريحك.',
                whyUs: 'ليه تختارنا؟', whyUsDesc: 'أطباء استشاريين متخصصين، تعقيم فائق، وأجهزة متطورة تضمن لك تجربة علاجية سلسة بدون ألم.',
                faqTitle: 'الأسئلة الشائعة', faqSearch: 'ابحث في الأسئلة...', faqAll: 'الكل', faqNone: 'مفيش نتايج', faqMore: 'اعرض أسئلة أكتر', faqLess: 'اعرض أقل',
                consultTitle: 'احجز استشارتك أونلاين', consultText: 'ابعت سؤالك لدكاترتنا مجاناً وانت في بيتك — اشرح حالتك، والدكتور المختص هيرد عليك ويقولك الخطوة الجاية.', consultBtn: 'استشارة مجانية أونلاين',
                footerAbout: 'خبرة و جودة عالمية لأكثر من 10 سنوات.', branchesT: 'فروعنا', contactT: 'تواصل معنا', followUs: 'تابعنا على منصات السوشيال ميديا', hoursT: 'مواعيد العمل',
                readMore: 'اقرأ المزيد', back: 'الرجوع للرئيسية', reviewsTitle: 'قصص نجاح وتجارب ملهمة', mapLocation: 'اللوكيشن'
            },
            en: {
                home: 'Home', about: 'About', services: 'Services', reviews: 'Reviews', book: 'Book Now',
                heroTitle: 'Your Smile Reflects Your Confidence', heroSub: 'Premium dental care with the latest global technologies in Egypt.',
                startJourney: 'Start Your Journey', 
                counters: { c1: 10000, t1: 'Trusted Patients', c2: 1000, t2: 'Implants', c3: 500, t3: 'Ortho Cases' },
                heroSlogan: 'Because your smile matters most, we are here to bring it back',
                aboutTitle: 'Over 10 Years of Excellence in Smile Design',
                aboutDesc: 'At New Era, we combine top-tier medical expertise with cutting-edge technology to offer you a comfortable and painless experience.',
                vision: 'Our Vision', visionDesc: 'To be the leading dental and cosmetic center in Egypt, providing the worlds latest technologies.',
                mission: 'Our Mission', missionDesc: 'To treat your teeth properly without pain, and build long-lasting trust. 100% natural result.',
                whyUs: 'Why Choose Us?', whyUsDesc: 'Consultant doctors, superb sterilization, and advanced devices ensuring a painless experience.',
                faqTitle: 'Frequently Asked Questions', faqSearch: 'Search questions...', faqAll: 'All', faqNone: 'No results', faqMore: 'Show more questions', faqLess: 'Show less',
                consultTitle: 'Book your online consultation', consultText: 'Send your question to our doctors for free from home — describe your case and a specialist will reply with the next step.', consultBtn: 'Free online consultation',
                footerAbout: 'World-class quality and experience for over 10 years.', branchesT: 'Our Branches', contactT: 'Contact Us', followUs: 'Follow us on social media', hoursT: 'Working Hours',
                readMore: 'Read More', back: 'Back to Home', reviewsTitle: 'Inspiring Success Stories', mapLocation: 'Location'
            }
        };

        // --- Data ---
        const SERVICES = [
            { id: 'exam', title: 'كشف وتشخيص', icon: <Icons.Search size={26} />, image: 'https://i.ibb.co/8g5h97Bg/Aw7-Geye-Tp-OD64fedl-RAAc-Auzn-KSPa-G-meta-Um91d-Glu-ZSBEZW50-YWwg-RXhhb-XMuan-Bn.jpg', desc: 'بنصور أسنانك بكاميرات دقيقة ونكشف على كل تفصيلة عشان نحط خطة علاج مظبوطة وتوفر وقتك وفلوسك.' },
            { id: 'xray', title: 'أشعة 3D', icon: <Icons.Activity size={26} />, image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1600&q=90', desc: 'أشعة الـ 3D بتدينا صورة كاملة للفك، عشان نبقى شايفين بوضوح قبل ما نلمس أي حاجة، وخصوصاً في الزراعة.' },
            { id: 'fillings', title: 'حشوات تجميلية', icon: <Icons.Star size={26} />, image: 'https://i.ibb.co/27j6dRnS/Spa-Dental-man-healthy-teeth-dental-mirror-appointment-check-679404673-scaled.jpg', desc: 'حشوات بلون السنان بالظبط، بنشيل التسوس ونقفل بمواد قوية جداً مش هتعرف تفرقها عن سنتك الطبيعية.' },
            { id: 'fixed-prosthetics', title: 'تركيبات ثابتة', icon: <Icons.ShieldCheck size={26} />, image: 'https://i.ibb.co/5qQZhcS/6697d92b5919f738bad53a1c-Dental-Bridges-1.webp', desc: 'طربوش أو كوبري زيركون بيعيش معاك، بنعوض بيه السنان المكسورة عشان تاكل وتضحك من غير إحراج.' },
            { id: 'removable-prosthetics', title: 'تركيبات متحركة', icon: <Icons.UserPlus size={26} />, image: 'https://i.ibb.co/wrcZdXLg/Horseshoe-Dentures.jpg', desc: 'أطقم خفيفة ومريحة، متفصلة بالمللي عشان تركب وتتخلع بسهولة وتديك شكل طبيعي جداً.' },
            { id: 'ortho', title: 'تقويم الأسنان', icon: <Icons.Award size={26} />, image: 'https://i.ibb.co/1GNCTrqL/ortodontik-tedavi-su-resince-dis-bakiminda-nelere-dikkat-edilmeli.jpg', desc: 'بنرصلك أسنانك سواء بالمعدني أو الشفاف، في كام شهر هتلاقي وشك وابتسامتك اختلفوا 180 درجة.' },
            { id: 'implants', title: 'زراعة الأسنان', icon: <Icons.CheckCircle2 size={26} />, image: 'https://i.ibb.co/BVBtc64W/implantdisnedir.jpg', desc: 'بنعوض السن اللي راح بجدر تيتانيوم بيعضم في الفك، عملية بسيطة بتديك سن جديد يعيش معاك العمر كله.' },
            { id: 'kids', title: 'أسنان الأطفال', icon: <Icons.HeartPulse size={26} />, image: 'https://i.ibb.co/m5ks6M53/kids-dentistry-min.jpg', desc: 'بنعالج أسنان أطفالك باللعب من غير ما يخافوا، الدكاترة عندنا بالهم طويل جداً عشان الطفل يحب العيادة.' },
            { id: 'whitening', title: 'تبييض الأسنان', icon: <Icons.Smile size={26} />, image: 'https://i.ibb.co/hRfGny9m/Cosmetic-Dentistry-pic.webp', desc: 'جلسات تبييض آمنة وفعالة بتشيل التصبغات وترجع أسنانك بيضا بتلمع في جلسة واحدة من غير حساسية.' },
            { id: 'jaw-surgery', title: 'جراحات الفكين', icon: <Icons.Activity size={26} />, image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1600&q=90', desc: 'عمليات دقيقة لعلاج تشوهات الفكين وإصلاح الكسور، بتتم على إيد استشاريين جراحة وجه وفكين بأعلى نسب نجاح.' },
            { id: 'hollywood', title: 'ابتسامة هوليود', icon: <Icons.Sparkles size={26} />, image: 'https://i.ibb.co/JFyXRyb1/Holywood-Smile.webp', desc: 'تصميم ابتسامة مثالية بتليق على ملامح وشك باستخدام أحدث قشور الفينير والايماكس عشان ضحكتك تنور وتعيش سنين.' }
        ];

        const REVIEWS = [
            { name: 'أحمد عبدالرحمن', text: 'جيت عملت تنظيف جير والخدمة كانت ممتازة، أسناني رجعت طبيعية ولونها فاتح زي الأول بالظبط. شكراً ليكم.' },
            { name: 'سارة محمود', text: 'عملت تركيبات أمامية، بجد لونها وشكلها مش بقدر أفرقهم عن الحقيقي! ده غير إن سيستم الحجز ممتاز جداً وفيه نظام.' },
            { name: 'م. خالد مصطفى', text: 'تجربتي في زراعة الأسنان كانت ممتازة. كنت خايف جداً بس الدكتور طمني ومحستش بأي ألم، والنتيجة فوق الخيال.' },
            { name: 'داليا سمير', text: 'أحسن مكان تودي فيه أطفالك. بنتي كانت بتخاف بس قسم الأطفال عندهم مجهز والدكاترة بالهم طويل وبيعرفوا يطمنوهم.' },
            { name: 'عمر ياسين', text: 'د. مصطفى إيده تتلف في حرير، خلعت ضرس العقل جراحياً ومحستش بأي حاجة خالص.' },
            { name: 'نورهان علي', text: 'العيادة نضيفة جداً والتعقيم يطمن، عملت تبييض ليزر والنتيجة وهمية من أول جلسة.' },
            { name: 'محمود عز', text: 'رحت أعمل حشو عصب، خلصت في جلسة واحدة والدكتور شاطر جداً وفاهم بيعمل إيه.' },
            { name: 'هبة كمال', text: 'بصراحة أسعارهم معقولة جداً مقارنة بالخدمة والنضافة والاهتمام اللي شفته في المركز.' },
            { name: 'طارق حسن', text: 'تقويم الانفزلاين (الشفاف) عندهم تحفة، ومحدش واخد باله إني مركب تقويم أصلاً.' },
            { name: 'منى جمال', text: 'الاستقبال ذوق جداً، والدكاترة بتشرحلك كل خطوة بالتفصيل قبل ما تبدأ شغل، وده طمني جداً.' },
            { name: 'كريم سعيد', text: 'أخيراً لقيت عيادة بتعالج مفصل الفك بجد، الصداع المستمر راح والحمد لله.' },
            { name: 'ريم فوزي', text: 'ركبت طقم أسنان لوالدي، مريح جداً وبياكل عليه براحته ومفيش أي ألم.' },
            { name: 'يوسف ماجد', text: 'ابتسامة هوليود عندهم طبيعية ومش مصطنعة (فيك) زي أماكن تانية بشوفها، تسلم إيديكم.' },
            { name: 'دينا حلمي', text: 'تجربة ممتازة، المواعيد مظبوطة جداً ومفيش انتظار كتير زي العيادات التانية.' }
        ];

        // --- Site Config (editable from dashboard, stored in Firestore: settings/site) ---
        const BASE_ICONS = Object.fromEntries(SERVICES.map(s => [s.id, s.icon]));
        const DEFAULT_CFG = {
            heroImages: ['https://i.ibb.co/gMFpgHDN/Big-tooth-model-and-a-women-on-the-background.jpg'],
            heroX: 75, heroY: 30, heroDim: 80,
            counters: t.ar.counters && [
                { n: 10000, ar: 'حالة وثقوا بنا', en: 'Trusted Patients' },
                { n: 1000, ar: 'عملية زراعة', en: 'Implants' },
                { n: 500, ar: 'حالة تقويم', en: 'Ortho Cases' }],
            galleryTitle: 'لحظات من مركزنا',
            gallery: SERVICES.slice(0, 6).map(s => s.image),
            services: SERVICES.map(({ icon, ...s }) => ({ ...s, gallery: [] })),
            heroZoom: 100, gallerySpeed: 40, googleReviews: true, whatsapp: '201121593393',
            phones: ['011 215 93393', '010 333 17233'],
            texts: { ar: {}, en: {} },
            reviews: REVIEWS.map(r => ({ ...r, stars: 5 })),
            socials: { facebook: 'https://www.facebook.com/share/19XfLQrD83/', instagram: 'https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=t2n9ivi', youtube: 'https://youtube.com/@neweradentalcenter?si=J5e3GA6amvjAZN0o', tiktok: 'https://www.tiktok.com/@neweradentalcenter?_r=1&_t=ZS-94Zj9UJ4yT1' },
            show: {}, order: [],
            announce: { on: false, ar: '', en: '', link: '' },
            hours: { ar: '', en: '' },
            seo: { title: '', desc: '' },
            posts: []
        };

        const mergeCfg = (data) => {
            const c = { ...DEFAULT_CFG, ...(data || {}) };
            ['heroImages', 'counters', 'gallery', 'phones', 'services', 'reviews', 'posts'].forEach(k => { if (!Array.isArray(c[k])) c[k] = DEFAULT_CFG[k]; });
            ['socials', 'show', 'announce', 'hours', 'seo'].forEach(k => { c[k] = { ...DEFAULT_CFG[k], ...((c[k] && typeof c[k] === 'object') ? c[k] : {}) }; });
            c.services = c.services.filter(Boolean).map(sv => ({ ...sv, gallery: Array.isArray(sv.gallery) ? sv.gallery : [] }));
            c.texts = { ar: {}, en: {}, ...(c.texts || {}) };
            if (!Array.isArray(c.customSections)) c.customSections = [];
            return c;
        };

        class ErrorBoundary extends React.Component {
            constructor(p) { super(p); this.state = { e: null }; }
            static getDerivedStateFromError(e) { return { e }; }
            render() {
                if (!this.state.e) return this.props.children;
                return <div dir="ltr" style={{ padding: 20, fontFamily: 'sans-serif' }}><h2>حصل خطأ في الصفحة / Page error</h2><pre style={{ whiteSpace: 'pre-wrap', color: '#b00' }}>{String(this.state.e && this.state.e.stack || this.state.e)}</pre><button onClick={() => location.reload()} style={{ padding: '8px 16px', background: '#D4AF37', color: '#fff', borderRadius: 8 }}>Reload</button></div>;
            }
        }

        const HeroBG = ({ imgs, x, y, dim, zoom = 100 }) => {
            const [i, setI] = useState(0);
            useEffect(() => {
                if (imgs.length < 2) return;
                const id = setInterval(() => setI(v => (v + 1) % imgs.length), 5500);
                return () => clearInterval(id);
            }, [imgs.length]);
            return <div className="absolute inset-0 overflow-hidden" style={{ transform: `scale(${zoom / 100})`, transformOrigin: `${x}% ${y}%` }}>{imgs.map((u, k) =>
                <div key={k} className="absolute inset-0 bg-cover transition-opacity duration-[1600ms]"
                    style={{ backgroundImage: `url('${u}')`, backgroundPosition: `${x}% ${y}%`, opacity: k === i ? dim / 100 : 0, animation: k === i ? 'kenburns 14s ease-out forwards' : 'none' }} />)}</div>;
        };

        const GoogleG = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>;
        const AVATARS = ['#1A73E8', '#D93025', '#188038', '#E37400', '#9334E6', '#00796B'];
        const imgFx = (o) => ({ objectPosition: `${o.x ?? 50}% ${o.y ?? 50}%`, transformOrigin: `${o.x ?? 50}% ${o.y ?? 50}%`, transform: `scale(${o.zoom || 1})` });

        // المعرض: حركة مستمرة بلا نهاية (السرعة من اللوحة)، بيقف لما الزائر يلمس أو يقف بالماوس
        const GallerySection = ({ imgs, title, speed = 40 }) => {
            const ref = useRef(); const [big, setBig] = useState(null); const pause = useRef(0);
            const many = imgs && imgs.length > 1;
            const loop = many ? [...imgs, ...imgs] : (imgs || []);
            const wrap = (el) => { const half = el.scrollWidth / 2; if (half <= 0) return; if (el.scrollLeft >= half) el.scrollLeft -= half; else if (el.scrollLeft <= 0) el.scrollLeft += half; };
            useEffect(() => {
                if (!many) return;
                let raf, last = performance.now(), acc = 0;
                const step = (t) => {
                    const el = ref.current, dt = Math.min(64, t - last); last = t;
                    if (el && !big && speed > 0 && Date.now() >= pause.current) {
                        acc += speed * dt / 1000; const px = Math.floor(acc);
                        if (px) { el.scrollLeft += px; acc -= px; wrap(el); }
                    }
                    raf = requestAnimationFrame(step);
                };
                raf = requestAnimationFrame(step);
                return () => cancelAnimationFrame(raf);
            }, [big, speed, many]);
            if (!imgs || !imgs.length) return null;
            const go = (d) => { const el = ref.current; if (!el) return; pause.current = Date.now() + 6000; wrap(el); el.scrollBy({ left: d * el.clientWidth * 0.6, behavior: 'smooth' }); };
            const btn = "absolute top-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-full shadow-[0_5px_20px_rgba(0,0,0,0.2)] text-pharaonic hover:bg-pharaonic hover:text-white hover:scale-110 transition-all";
            return (
                <section className="py-10 bg-[#FDFCFB] overflow-hidden">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{title}</h2>
                        <div className="w-16 h-1 bg-pharaonic mx-auto rounded-full"></div>
                    </div>
                    <div className="relative max-w-6xl mx-auto" dir="ltr">
                        {many && <button onClick={() => go(-1)} className={btn + ' left-2'}><Icons.ArrowLeft size={22} /></button>}
                        {many && <button onClick={() => go(1)} className={btn + ' right-2'}><Icons.ArrowRight size={22} /></button>}
                        <div ref={ref} onScroll={e => many && wrap(e.currentTarget)} onMouseEnter={() => pause.current = Date.now() + 1e9} onMouseLeave={() => pause.current = Date.now() + 1500} onTouchStart={() => pause.current = Date.now() + 1e9} onTouchEnd={() => pause.current = Date.now() + 3000}
                            className="flex gap-4 overflow-x-auto hide-scroll-bar px-14 py-3">
                            {loop.map((u, i) => <img key={i} src={u} alt={(title || 'New Era Dental Center') + ' - ' + ((i % imgs.length) + 1)} loading={i < imgs.length ? 'lazy' : 'eager'} onClick={() => setBig(u)} className="shrink-0 h-48 md:h-60 w-auto rounded-2xl shadow-lg object-cover cursor-pointer hover:scale-[1.03] transition-transform" />)}
                        </div>
                    </div>
                    {big && <div onClick={() => setBig(null)} className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4 animate-fade-in"><img src={big} alt={title || ''} className="max-h-full max-w-full rounded-xl" /></div>}
                </section>
            );
        };

        // --- Dashboard ---
        const TEXT_FIELDS = [['heroTitle','عنوان الهيدر'],['heroSub','وصف الهيدر'],['heroSlogan','الشعار تحت الأرقام'],['startJourney','زر الحجز'],['aboutTitle','عنوان من نحن'],['aboutDesc','نص من نحن'],['vision','عنوان الرؤية'],['visionDesc','نص الرؤية'],['mission','عنوان الرسالة'],['missionDesc','نص الرسالة'],['whyUs','عنوان ليه تختارنا'],['whyUsDesc','نص ليه تختارنا'],['reviewsTitle','عنوان الآراء'],['faqTitle','عنوان الأسئلة الشائعة'],['consultTitle','عنوان الاستشارة الأونلاين'],['consultText','نص الاستشارة الأونلاين'],['consultBtn','زرار الاستشارة'],['footerAbout','نبذة الفوتر'],['followUs','نص السوشيال ميديا']];

        const SLOTS = {
            hero: { l: 'خلفية الهيدر', w: 1920, h: 800 },
            svc: { l: 'صورة الخدمة (الكارت + صفحة الخدمة)', w: 1600, h: 800 },
            svcx: { l: 'صور صفحة الخدمة الإضافية', w: 1200, h: 800 },
            gal: { l: 'المعرض', w: 1200, h: 900 },
            consult: { l: 'صورة قسم الاستشارة', w: 900, h: 900 },
            og: { l: 'صورة مشاركة اللينك (واتساب/فيسبوك/جوجل)', w: 1200, h: 630 },
            blog: { l: 'صورة المقال', w: 1200, h: 630 },
            cs: { l: 'صورة قسم مخصص', w: 1200, h: 900 },
            csCard: { l: 'صورة كارت', w: 800, h: 600 }
        };
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const ratioTxt = (s) => { const g = gcd(s.w, s.h); return `${s.w / g}:${s.h / g}`; };

        const uploadBlob = async (b) => {
            const key = localStorage.getItem('imgbbKey');
            if (key) {
                const fd = new FormData(); fd.append('image', b);
                const r = await fetch('https://api.imgbb.com/1/upload?key=' + key, { method: 'POST', body: fd });
                const j = await r.json();
                if (!j.success) throw new Error('ImgBB: ' + ((j.error && j.error.message) || 'خطأ'));
                return j.data.url;
            }
            await loadStorage();
            const ref = firebase.storage().ref('site/' + Date.now() + '.jpg');
            await ref.put(b);
            return await ref.getDownloadURL();
        };

        const Cropper = ({ src, slot, onDone, onCancel }) => {
            const imgRef = useRef(); const drag = useRef(null);
            const [r, setR] = useState(slot ? slot.w / slot.h : 0);
            const [box, setBox] = useState(null); const [ready, setReady] = useState(false);
            const init = () => {
                const im = imgRef.current; const W = im.clientWidth, H = im.clientHeight;
                let w = W * 0.8, h = r ? w / r : H * 0.8;
                if (h > H * 0.9) { h = H * 0.9; w = r ? h * r : W * 0.8; }
                setBox({ x: (W - w) / 2, y: (H - h) / 2, w, h });
            };
            useEffect(() => { if (ready) init(); }, [r]);
            const down = (mode) => (e) => { e.preventDefault(); e.stopPropagation(); drag.current = { mode, sx: e.clientX, sy: e.clientY, b: { ...box } }; e.currentTarget.setPointerCapture(e.pointerId); };
            const move = (e) => {
                const d = drag.current; if (!d) return;
                const im = imgRef.current; const W = im.clientWidth, H = im.clientHeight;
                const dx = e.clientX - d.sx, dy = e.clientY - d.sy; let b = { ...d.b };
                if (d.mode === 'm') { b.x = Math.min(W - b.w, Math.max(0, b.x + dx)); b.y = Math.min(H - b.h, Math.max(0, b.y + dy)); }
                else {
                    let w = Math.max(30, Math.min(W - b.x, b.w + dx)); let h = r ? w / r : Math.max(30, Math.min(H - b.y, b.h + dy));
                    if (h > H - b.y) { h = H - b.y; if (r) w = h * r; }
                    b.w = w; b.h = h;
                }
                setBox(b);
            };
            const done = (full) => {
                try {
                    const im = imgRef.current; const sx = im.naturalWidth / im.clientWidth, sy = im.naturalHeight / im.clientHeight;
                    const bx = full ? { x: 0, y: 0, w: im.clientWidth, h: im.clientHeight } : box;
                    const cw = bx.w * sx, ch = bx.h * sy, k = Math.min(1, 1600 / cw);
                    const c = document.createElement('canvas'); c.width = cw * k; c.height = ch * k;
                    c.getContext('2d').drawImage(im, bx.x * sx, bx.y * sy, cw, ch, 0, 0, c.width, c.height);
                    c.toBlob(b => b ? onDone(b) : alert('تعذر القص'), 'image/jpeg', 0.88);
                } catch (e) { alert('الصورة دي من موقع بيمنع القص. نزّليها وارفعيها من جهازك.'); }
            };
            const px = box && imgRef.current ? `${Math.round(box.w * imgRef.current.naturalWidth / imgRef.current.clientWidth)}×${Math.round(box.h * imgRef.current.naturalHeight / imgRef.current.clientHeight)}` : '';
            const opts = [['حر', 0], ['1:1', 1], ['4:3', 4 / 3], ['16:9', 16 / 9]];
            return (
                <div dir="rtl" className="fixed inset-0 z-[80] bg-black/85 flex flex-col items-center justify-center p-3 gap-3">
                    <p className="text-white text-xs font-bold text-center">{slot ? `المساحة: ${slot.l} — يفضل ${slot.w}×${slot.h} px (نسبة ${ratioTxt(slot)})` : 'اختاري المساحة المطلوبة'}{px && ` | القص الحالي: ${px} px`}</p>
                    <div className="relative inline-block touch-none select-none" dir="ltr" onPointerMove={move} onPointerUp={() => drag.current = null}>
                        <img ref={imgRef} src={src} crossOrigin="anonymous" onLoad={() => { setReady(true); init(); }} className="max-h-[60vh] max-w-[94vw] block" draggable="false" />
                        {box && <div onPointerDown={down('m')} className="absolute border-2 border-white cursor-move" style={{ left: box.x, top: box.y, width: box.w, height: box.h, boxShadow: '0 0 0 9999px rgba(0,0,0,.6)' }}>
                            <div onPointerDown={down('r')} className="absolute -bottom-3 -right-3 w-7 h-7 bg-pharaonic rounded-full border-2 border-white cursor-nwse-resize"></div>
                        </div>}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {slot && <button onClick={() => setR(slot.w / slot.h)} className="px-3 py-1.5 rounded-full text-xs font-black bg-pharaonic text-white">المطلوب {ratioTxt(slot)}</button>}
                        {opts.map(([n, v]) => <button key={n} onClick={() => setR(v)} className={`px-3 py-1.5 rounded-full text-xs font-black ${r === v ? 'bg-white text-gray-900' : 'bg-white/20 text-white'}`}>{n}</button>)}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => done(false)} className="bg-pharaonic text-white font-black px-6 py-2.5 rounded-xl">قص ورفع</button>
                        <button onClick={() => done(true)} className="bg-white text-gray-900 font-black px-4 py-2.5 rounded-xl text-sm">رفع كاملة</button>
                        <button onClick={onCancel} className="bg-white/20 text-white font-black px-4 py-2.5 rounded-xl text-sm">إلغاء</button>
                    </div>
                </div>
            );
        };

        const ImgField = ({ value, onChange, onRemove, slot }) => {
            const [busy, setBusy] = useState(false); const [crop, setCrop] = useState(null);
            const send = async (b) => {
                setCrop(null); setBusy(true);
                try { onChange(await uploadBlob(b)); }
                catch (e) { alert('فشل الرفع: ' + (e.message || e) + '\nالحل: فعّلي Firebase Storage، أو ضيفي مفتاح ImgBB في تبويب "عام"، أو الصقي رابط الصورة.'); }
                setBusy(false);
            };
            const pick = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) setCrop(URL.createObjectURL(f)); };
            return (
                <div className="space-y-1">
                    {slot && <p className="text-[11px] text-gray-500 font-bold">المساحة: {slot.l} — يفضل {slot.w}×{slot.h} px (نسبة {ratioTxt(slot)})</p>}
                    <div className="flex items-center gap-2">
                        <img src={value || undefined} className="w-14 h-14 rounded-lg object-cover bg-gray-200 shrink-0" />
                        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="رابط الصورة" dir="ltr" className="flex-1 min-w-0 border rounded-lg p-2 text-xs" />
                        {value && <button onClick={() => setCrop(value)} className="bg-gray-200 text-xs px-2 py-2 rounded-lg shrink-0 font-bold">قص</button>}
                        <label className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg cursor-pointer shrink-0">{busy ? '...' : 'رفع'}<input type="file" accept="image/*" hidden onChange={pick} /></label>
                        {onRemove && <button onClick={onRemove} className="text-red-500 font-black px-1">✕</button>}
                    </div>
                    {crop && <Cropper src={crop} slot={slot} onDone={send} onCancel={() => setCrop(null)} />}
                </div>
            );
        };

        // ===== ترتيب بالسحب والإفلات (بالماوس أو بالصباع على الموبايل) =====
        const moveIdx = (a, from, to) => { const r = [...a]; const [x] = r.splice(from, 1); r.splice(to, 0, x); return r; };
        const scrollerOf = el => { for (let q = el && el.parentElement; q; q = q.parentElement) { const o = getComputedStyle(q).overflowY; if ((o === 'auto' || o === 'scroll') && q.scrollHeight > q.clientHeight) return q; } return document.scrollingElement || document.documentElement; };
        const useDragSort = (onMove) => {
            const [dr, setDr] = useState(null);
            const cb = useRef(onMove); cb.current = onMove;
            const start = (k, i) => e => {
                if (e.button > 0) return;
                const it = e.currentTarget.closest('[data-sort-item]'); if (!it || !it.parentElement) return;
                e.preventDefault(); e.stopPropagation();
                const list = it.parentElement, sc = scrollerOf(it), r = it.getBoundingClientRect(), root = sc === document.scrollingElement || sc === document.documentElement;
                const s = { from: i, to: i, y: e.clientY, ly: e.clientY, cy: r.top + r.height / 2, s0: sc.scrollTop, raf: 0 };
                const sibs = () => [...list.children].filter(c => c.getAttribute('data-sort-item') === String(k));
                const calc = () => {
                    const kk = sc.scrollTop - s.s0, py = s.cy + (s.ly - s.y); // القوايم كلها رأسية: السحب لفوق ولتحت بس
                    let best = s.from, bd = Infinity;
                    sibs().forEach((c, j) => { let y; if (j === s.from) y = s.cy - kk; else { const q = c.getBoundingClientRect(); y = q.top + q.height / 2; } const dd = Math.abs(y - py); if (dd < bd) { bd = dd; best = j; } });
                    s.to = best; setDr({ k, from: s.from, to: best, dy: s.ly - s.y + kk });
                };
                const tick = () => { const m = 70, H = innerHeight; let v = 0; if (s.ly < m) v = -Math.ceil((m - s.ly) / 6); else if (s.ly > H - m) v = Math.ceil((s.ly - (H - m)) / 6); if (v) { if (root) window.scrollBy(0, v); else sc.scrollTop += v; calc(); } s.raf = requestAnimationFrame(tick); };
                const mv = ev => { s.ly = ev.clientY; calc(); };
                const end = ev => { cancelAnimationFrame(s.raf); removeEventListener('pointermove', mv); removeEventListener('pointerup', end); removeEventListener('pointercancel', end); setDr(null); if (ev.type === 'pointerup' && s.to !== s.from) cb.current(k, s.from, s.to); };
                addEventListener('pointermove', mv); addEventListener('pointerup', end); addEventListener('pointercancel', end);
                s.raf = requestAnimationFrame(tick); calc();
            };
            const item = (k, i) => {
                const st = !dr || dr.k !== k ? undefined : i === dr.from ? { transform: `translateY(${dr.dy}px)`, zIndex: 60, position: 'relative', boxShadow: '0 14px 34px rgba(0,0,0,.2)', opacity: .96, transition: 'none', pointerEvents: 'none' } : i === dr.to ? { outline: '2px dashed #D4AF37', outlineOffset: '3px', borderRadius: '12px' } : undefined;
                return { 'data-sort-item': String(k), style: st };
            };
            const grip = (k, i) => ({ onPointerDown: start(k, i), onClick: e => e.stopPropagation() });
            return { item, grip, dragging: dr };
        };
        const Grip = ({ g, small }) => <span {...g} title="اسحبي عشان ترتّبي" style={{ touchAction: 'none' }} className={`shrink-0 select-none touch-none cursor-grab active:cursor-grabbing flex items-center justify-center rounded-lg text-gray-400 hover:text-pharaonic hover:bg-amber-50 ${small ? 'w-6 h-8' : 'w-8 h-8'}`}><svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor"><circle cx="3" cy="3" r="1.7" /><circle cx="9" cy="3" r="1.7" /><circle cx="3" cy="9" r="1.7" /><circle cx="9" cy="9" r="1.7" /><circle cx="3" cy="15" r="1.7" /><circle cx="9" cy="15" r="1.7" /></svg></span>;

        const ImgList = ({ list, onChange, slot }) => {
            const ds = useDragSort((k, a, b) => onChange(moveIdx(list, a, b)));
            return <div className="space-y-2">
                {list.map((u, i) => {
                    return <div key={i} {...ds.item('img', i)} className="flex items-start gap-1.5 bg-white">
                        {list.length > 1 && <span className="pt-4 shrink-0"><Grip small g={ds.grip('img', i)} /></span>}
                        <span className="text-[10px] font-black text-gray-400 pt-7 shrink-0 w-4 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0"><ImgField slot={slot} value={u} onChange={v => onChange(list.map((x, j) => j === i ? v : x))} onRemove={() => onChange(list.filter((_, j) => j !== i))} /></div>
                    </div>;
                })}
                <button onClick={() => onChange([...list, ''])} className="text-sm font-black text-pharaonic">+ إضافة صورة</button>
            </div>;
        };

        // لوحة: الأقسام المخصصة
        const CustomSectionsAdmin = ({ list, onChange, inp, card }) => {
            const [open, setOpen] = useState(null);
            const [adding, setAdding] = useState(false);
            const set = (i, patch) => onChange(list.map((x, j) => j === i ? { ...x, ...patch } : x));
            const ds = useDragSort((k, a, b) => { if (k === 'cs') onChange(moveIdx(list, a, b)); else { const i = +k.slice(3); set(i, { items: moveIdx(list[i].items || [], a, b) }); } });
            const two = (s, i, k, ph, rows) => <div className="grid md:grid-cols-2 gap-2">{[[k, 'rtl', ph], [k + 'En', 'ltr', 'English']].map(([kk, dir, p]) => rows ? <textarea key={kk} rows={rows} dir={dir} value={s[kk] || ''} onChange={e => set(i, { [kk]: e.target.value })} className={inp} placeholder={p} /> : <input key={kk} dir={dir} value={s[kk] || ''} onChange={e => set(i, { [kk]: e.target.value })} className={inp} placeholder={p} />)}</div>;
            const items = (s, i, fields) => <div className="space-y-2">{(s.items || []).map((x, j) => { const setX = patch => set(i, { items: s.items.map((y, k) => k === j ? { ...y, ...patch } : y) }); return (
                <div key={j} {...ds.item('csi' + i, j)} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
                    <div className="flex items-center justify-between"><span className="flex items-center gap-1"><Grip small g={ds.grip('csi' + i, j)} /><span className="text-xs font-black text-gray-400">#{j + 1}</span></span><span className="flex gap-1">
                        <button type="button" onClick={() => set(i, { items: s.items.filter((_, k) => k !== j) })} className="w-7 h-7 rounded-lg bg-white border text-red-500 text-xs font-black">✕</button></span></div>
                    {fields === 'card' ? <>
                        <ImgField slot={SLOTS.csCard} value={x.image} onChange={v => setX({ image: v })} />
                        <div className="grid md:grid-cols-2 gap-2"><input value={x.title || ''} onChange={e => setX({ title: e.target.value })} className={inp + ' font-black'} placeholder="عنوان الكارت" /><input dir="ltr" value={x.titleEn || ''} onChange={e => setX({ titleEn: e.target.value })} className={inp} placeholder="English title" /></div>
                        <div className="grid md:grid-cols-2 gap-2"><textarea rows="2" value={x.text || ''} onChange={e => setX({ text: e.target.value })} className={inp} placeholder="الوصف" /><textarea rows="2" dir="ltr" value={x.textEn || ''} onChange={e => setX({ textEn: e.target.value })} className={inp} placeholder="English text" /></div>
                    </> : <>
                        <div className="grid md:grid-cols-2 gap-2"><input value={x.q || ''} onChange={e => setX({ q: e.target.value })} className={inp + ' font-black'} placeholder="السؤال" /><input dir="ltr" value={x.qEn || ''} onChange={e => setX({ qEn: e.target.value })} className={inp} placeholder="Question" /></div>
                        <div className="grid md:grid-cols-2 gap-2"><textarea rows="2" value={x.a || ''} onChange={e => setX({ a: e.target.value })} className={inp} placeholder="الإجابة" /><textarea rows="2" dir="ltr" value={x.aEn || ''} onChange={e => setX({ aEn: e.target.value })} className={inp} placeholder="Answer" /></div>
                    </>}
                </div>); })}
                <button type="button" onClick={() => set(i, { items: [...(s.items || []), fields === 'card' ? { image: '', title: '', titleEn: '', text: '', textEn: '' } : { q: '', qEn: '', a: '', aEn: '' }] })} className="text-sm font-black text-pharaonic">+ إضافة {fields === 'card' ? 'كارت' : 'سؤال'}</button></div>;
            const btnFields = (s, i) => <div className="space-y-2 border-t border-gray-100 pt-3"><p className="text-xs font-black text-gray-600">زرار (اختياري)</p>
                <div className="grid md:grid-cols-3 gap-2"><input value={s.btn || ''} onChange={e => set(i, { btn: e.target.value })} className={inp} placeholder="مثال: احجز الآن" /><input dir="ltr" value={s.btnEn || ''} onChange={e => set(i, { btnEn: e.target.value })} className={inp} placeholder="Book now" /><input dir="ltr" value={s.link || ''} onChange={e => set(i, { link: e.target.value })} className={inp} placeholder="#book" /></div>
                <p className="text-[10px] text-gray-400 font-bold">الرابط: <b dir="ltr">#book</b> = كارت الحجز، <b dir="ltr">#consult</b> = الاستشارة، رقم موبايل (زي 2010xxxxxxxx) = واتساب، أو أي لينك.</p></div>;
            return (
                <div className="space-y-3">
                    {!list.length && <div className={card}><p className="text-sm font-bold text-gray-500">مفيش أقسام مخصصة لسه. دوسي "+ قسم جديد" واختاري نوعه، وبعدين اكتبي محتواه واختاري مكانه في الصفحة.</p></div>}
                    {list.map((s, i) => { const o = open === s.id, ty = CS_TYPES.find(t => t[0] === s.type) || CS_TYPES[0]; return (
                        <div key={s.id} {...ds.item('cs', i)} className={card + (s.hidden ? ' opacity-60' : '')}>
                            <div className="flex items-center justify-between gap-2">
                                <Grip g={ds.grip('cs', i)} />
                                <button type="button" onClick={() => setOpen(o ? null : s.id)} className="flex-1 flex items-center gap-2 min-w-0 text-start"><span className="text-xl">{ty[2]}</span><span className="min-w-0"><span className="block font-black text-sm truncate">{s.title || '(من غير عنوان)'}</span><span className="block text-[11px] text-gray-400 font-bold">{ty[1]} • {(CS_PLACES.find(p => p[0] === s.place) || [])[1]}{s.hidden ? ' • مخفي' : ''}</span></span></button>
                                <span className="flex gap-1 shrink-0">
                                    <button type="button" onClick={() => setOpen(o ? null : s.id)} className="px-3 h-7 rounded-lg bg-gray-900 text-white text-xs font-black">{o ? 'قفل' : 'تعديل'}</button></span>
                            </div>
                            {o && <div className="space-y-3 pt-2">
                                <div className="grid sm:grid-cols-3 gap-2">
                                    <label className="text-[11px] font-black text-gray-500">مكانه في الصفحة<select value={s.place} onChange={e => set(i, { place: e.target.value })} className={inp + ' mt-1'}>{CS_PLACES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
                                    <label className="text-[11px] font-black text-gray-500">لون الخلفية<select value={s.bg} onChange={e => set(i, { bg: e.target.value })} className={inp + ' mt-1'}>{CS_BG.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
                                    <label className="flex items-center gap-2 text-sm font-black text-gray-700 pt-5 cursor-pointer"><input type="checkbox" checked={!!s.hidden} onChange={e => set(i, { hidden: e.target.checked })} />مخفي (من غير ما يتمسح)</label>
                                </div>
                                <p className="text-xs font-black text-gray-600">العنوان</p>{two(s, i, 'title', 'عنوان القسم')}
                                <p className="text-xs font-black text-gray-600">سطر صغير تحت العنوان (اختياري)</p>{two(s, i, 'sub', 'مثال: بأحدث الأجهزة')}
                                {s.type !== 'gallery' && s.type !== 'faq' && <><p className="text-xs font-black text-gray-600">{s.type === 'cta' ? 'الجملة' : 'الكلام'}</p>{two(s, i, 'text', 'اكتبي هنا...', 4)}</>}
                                {s.type === 'text' && <><ImgField slot={SLOTS.cs} value={s.image} onChange={v => set(i, { image: v })} onRemove={s.image ? () => set(i, { image: '' }) : null} />
                                    {s.image && <label className="text-[11px] font-black text-gray-500 block">مكان الصورة<select value={s.side} onChange={e => set(i, { side: e.target.value })} className={inp + ' mt-1'}><option value="start">يمين الكلام</option><option value="end">شمال الكلام</option></select></label>}</>}
                                {s.type === 'cards' && <><label className="text-[11px] font-black text-gray-500 block">عدد الكروت في الصف (كمبيوتر)<select value={s.cols} onChange={e => set(i, { cols: +e.target.value })} className={inp + ' mt-1'}>{[2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}</select></label>{items(s, i, 'card')}</>}
                                {s.type === 'faq' && items(s, i, 'faq')}
                                {s.type === 'gallery' && <ImgList slot={SLOTS.gal} list={s.images || []} onChange={v => set(i, { images: v })} />}
                                {s.type === 'video' && <><input dir="ltr" value={s.video || ''} onChange={e => set(i, { video: e.target.value })} className={inp} placeholder="لينك فيديو يوتيوب" />{s.video && !ytId(s.video) && <p className="text-xs font-bold text-red-500">اللينك ده مش لينك يوتيوب صحيح</p>}</>}
                                {btnFields(s, i)}
                                <div className="flex justify-between items-center border-t border-gray-100 pt-3"><span className="text-[10px] text-gray-400 font-bold" dir="ltr">#{s.id}</span><button type="button" onClick={() => { if (confirm('حذف القسم ده نهائياً؟')) onChange(list.filter((_, j) => j !== i)); }} className="text-red-500 text-xs font-black">حذف القسم</button></div>
                            </div>}
                        </div>); })}
                    {adding ? <div className={card}><p className="font-black text-sm">نوع القسم الجديد:</p>
                        <div className="grid sm:grid-cols-2 gap-2">{CS_TYPES.map(([k, n, ic, ds]) => <button key={k} type="button" onClick={() => { const s = csNew(k); onChange([...list, s]); setOpen(s.id); setAdding(false); }} className="text-start border-2 border-gray-100 hover:border-pharaonic rounded-xl p-3"><span className="font-black text-sm">{ic} {n}</span><span className="block text-[11px] text-gray-500 font-bold mt-0.5">{ds}</span></button>)}</div>
                        <button type="button" onClick={() => setAdding(false)} className="text-xs font-bold text-gray-400">إلغاء</button></div>
                    : <button type="button" onClick={() => setAdding(true)} className="w-full bg-pharaonic text-white font-black py-3 rounded-xl">+ قسم جديد</button>}
                    <p className="text-[11px] text-gray-400 font-bold">متنسيش تدوسي "حفظ" تحت عشان الأقسام تظهر على الموقع.</p>
                </div>
            );
        };

        // ===== 🔎 تبويب جوجل (SEO): العنوان والوصف + صورة المشاركة + ربط أدوات جوجل والإعلانات + صفحات الموقع =====
        const seoCnt = (s, min, max) => { const l = String(s || '').length; return <span className={`text-[10px] font-black ${l > max ? 'text-red-500' : l >= min ? 'text-emerald-600' : 'text-amber-600'}`}>{l}/{max}</span>; };
        const metaContent = v => { const s = String(v || '').trim(); const m = s.match(/content=["']([^"']+)["']/); return (m ? m[1] : s).trim(); };
        const SeoAdmin = ({ d, setD, inp, card, go }) => {
            const se = d.seo || {};
            const set = (k, v) => setD(p => ({ ...p, seo: { ...(p.seo || {}), [k]: v } }));
            const [branches, setBranches] = useState([]); const [faqsN, setFaqsN] = useState(0); const [copied, setCopied] = useState('');
            useEffect(() => { if (!db) return; const u1 = db.collection('branches').onSnapshot(s => setBranches(s.docs.map(x => ({ id: x.id, ...x.data() })).filter(b => b.name && b.active !== false && b.hidden !== true)), () => {}); const u2 = db.collection('faqs').where('published', '==', true).onSnapshot(s => setFaqsN(s.size), () => {}); return () => { u1(); u2(); }; }, []);
            useEffect(() => { if (!copied) return; const t = setTimeout(() => setCopied(''), 1800); return () => clearTimeout(t); }, [copied]);
            const site = 'https://neweradentalcenter.com';
            const hl = seoHealth(d, branches, faqsN);
            const svcs = d.services.filter(s => !s.hidden);
            const pages = [['🏠 الصفحة الرئيسية', '/'], ['📝 المدونة', '/blog'], ['🗺️ خريطة الموقع (sitemap) — دي اللي بتتبعت لجوجل', '/sitemap.xml'],
                ...branches.map(b => ['📍 فرع ' + b.name, '/' + seoBranchSlug(b)]), ...svcs.map(s => ['🦷 ' + s.title, '/' + seoSvcSlug(s)])];
            const copy = (t, k) => copyTxt(t, () => setCopied(k));
            const trk = (k, label, ph, help) => { const v = se[k] || ''; const ok = !v || trkOk(k, v); return <label className="block text-xs font-bold text-gray-600">{label} {v && <span className={ok ? 'text-emerald-600' : 'text-red-500'}>{ok ? '✓ شغال' : '✗ الكود شكله غلط'}</span>}<input value={v} dir="ltr" onChange={e => set(k, e.target.value.trim())} className={inp + ' mt-1'} placeholder={ph} /><span className="block text-[10px] text-gray-400 font-bold mt-0.5">{help}</span></label>; };
            const tools = [
                ['Google Search Console', 'https://search.google.com/search-console', 'ظهور الموقع في البحث والكلمات — وابعتي منه الـ sitemap'],
                ['Google Business Profile', 'https://business.google.com/locations', 'صفحات الفروع على جوجل ماب والتقييمات'],
                ['Google Analytics', 'https://analytics.google.com/', 'عدد الزوار ومنين جايين والحجوزات'],
                ['اختبار بيانات جوجل المنظمة', 'https://search.google.com/test/rich-results?url=' + encodeURIComponent(site + '/'), 'يتأكد إن جوجل فاهم بيانات العيادة والأسئلة'],
                ['سرعة الموقع (PageSpeed)', 'https://pagespeed.web.dev/analysis?url=' + encodeURIComponent(site + '/'), 'سرعة الموبايل بتأثر على الترتيب'],
                ['Bing Webmaster Tools', 'https://www.bing.com/webmasters', 'الظهور على Bing (ومنه ChatGPT)']
            ];
            return <>
                <div className={card}>
                    <div className="flex items-center justify-between gap-2"><p className="font-black text-sm">📋 فحص سريع للظهور على جوجل</p><span className={`text-lg font-black ${hl.score >= 80 ? 'text-emerald-600' : hl.score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{hl.score}%</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${hl.score >= 80 ? 'bg-emerald-500' : hl.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: hl.score + '%' }} /></div>
                    <div className="grid sm:grid-cols-2 gap-1.5">{hl.items.map(([ok, txt, tab], i) => <div key={i} className={`flex items-center justify-between gap-2 text-xs font-bold rounded-lg px-2.5 py-1.5 ${ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}><span>{ok ? '✓' : '✗'} {txt}</span>{!ok && tab && tab !== 'seo' && <button type="button" onClick={() => go(tab)} className="text-[10px] font-black underline shrink-0">صلّحي</button>}{!ok && !tab && <span className="text-[10px] text-gray-500 shrink-0">من السيستم</span>}</div>)}</div>
                </div>

                <div className={card}><p className="font-black text-sm">🇪🇬 العنوان والوصف (عربي)</p>
                    <label className="block text-xs font-bold text-gray-600">عنوان الموقع {seoCnt(se.title, 30, 60)}<input value={se.title || ''} onChange={e => set('title', e.target.value)} className={inp + ' mt-1'} /></label>
                    <label className="block text-xs font-bold text-gray-600">وصف الموقع {seoCnt(se.desc, 110, 160)}<textarea rows="3" value={se.desc || ''} onChange={e => set('desc', e.target.value)} className={inp + ' mt-1'} placeholder="مركز نيو إيرا لطب وتجميل الأسنان — زراعة، تقويم، ابتسامة هوليود… فروع فيصل وحلوان والصف. احجز أونلاين." /></label>
                    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50"><p className="text-[11px] text-gray-400 font-bold mb-1">شكلها على جوجل تقريباً:</p><p className="text-[#1a0dab] text-base font-bold truncate">{se.title || document.title}</p><p className="text-[#006621] text-xs truncate" dir="ltr">{site}</p><p className="text-gray-600 text-xs line-clamp-2">{se.desc || '—'}</p></div>
                </div>
                <div className={card}><p className="font-black text-sm">🇬🇧 العنوان والوصف (إنجليزي) — للنسخة الإنجليزي من الموقع</p>
                    <label className="block text-xs font-bold text-gray-600">Title {seoCnt(se.titleEn, 30, 60)}<input value={se.titleEn || ''} dir="ltr" onChange={e => set('titleEn', e.target.value)} className={inp + ' mt-1'} placeholder="New Era Dental Center | Dentist in Faisal, Helwan & El-Saff" /></label>
                    <label className="block text-xs font-bold text-gray-600">Description {seoCnt(se.descEn, 110, 160)}<textarea rows="2" dir="ltr" value={se.descEn || ''} onChange={e => set('descEn', e.target.value)} className={inp + ' mt-1'} /></label>
                </div>
                <div className={card}><p className="font-black text-sm">🔑 الكلمات المستهدفة</p><p className="text-[11px] text-gray-500 font-bold -mt-1">الكلمات اللي عايزين نطلع بيها (زي: زراعة أسنان حلوان). كل كلمة في سطر — بتتسجل في بيانات جوجل المنظمة وبيستخدمها المسوّق الذكي.</p>
                    <textarea rows="4" value={(se.keywords || []).join('\n')} onChange={e => set('keywords', e.target.value.split('\n').map(x => x.trim()).filter((x, i, a) => x || i === a.length - 1).slice(0, 40))} className={inp} placeholder={'زراعة أسنان حلوان\nتقويم أسنان فيصل\nدكتور أسنان الصف'} /></div>

                <div className={card}><p className="font-black text-sm">🖼️ صورة المشاركة واللوجو</p>
                    <p className="text-[11px] text-gray-500 font-bold -mt-1">الصورة اللي بتظهر لما حد يبعت لينك الموقع على واتساب أو فيسبوك. لو فاضية بتاخد أول صورة في الهيدر.</p>
                    <ImgField slot={SLOTS.og} value={se.ogImage || ''} onChange={v => set('ogImage', v)} onRemove={() => set('ogImage', '')} />
                    <label className="block text-xs font-bold text-gray-600">رابط اللوجو (لجوجل) <input value={se.logo || ''} dir="ltr" onChange={e => set('logo', e.target.value.trim())} className={inp + ' mt-1'} placeholder={SITE_LOGO} /></label>
                    <div className="grid sm:grid-cols-2 gap-2">
                        <label className="block text-xs font-bold text-gray-600">مستوى الأسعار (بيظهر لجوجل)<select value={se.priceRange || '$$'} onChange={e => set('priceRange', e.target.value)} className={inp + ' mt-1'}><option value="$">$ — اقتصادي</option><option value="$$">$$ — متوسط</option><option value="$$$">$$$ — فوق المتوسط</option></select></label>
                        <label className="block text-xs font-bold text-gray-600">سنة افتتاح المركز (اختياري)<input value={se.founded || ''} dir="ltr" inputMode="numeric" onChange={e => set('founded', e.target.value.replace(/\D/g, '').slice(0, 4))} className={inp + ' mt-1'} placeholder="2015" /></label>
                    </div>
                </div>

                <div className={card}><p className="font-black text-sm">📊 ربط أدوات القياس والإعلانات</p>
                    <p className="text-[11px] text-gray-500 font-bold -mt-1">حطي الكود بس (مش السكريبت كله). أول ما تحفظي بيشتغل على الموقع وصفحات جوجل، وبيسجّل تلقائي: <b>حجز أونلاين، استشارة، ضغطة واتساب، ضغطة اتصال</b> — عشان الإعلانات تتعلم مين بيحجز فعلاً.</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {trk('ga4', 'Google Analytics 4', 'G-XXXXXXXXXX', 'من Analytics ← Admin ← Data streams ← Measurement ID')}
                        {trk('gtm', 'Google Tag Manager (اختياري)', 'GTM-XXXXXXX', 'لو المسوّق شغال بـ Tag Manager')}
                        {trk('pixel', 'Meta Pixel (فيسبوك وإنستجرام)', '123456789012345', 'من Events Manager ← Data sources ← Pixel ID')}
                        {trk('adsBook', 'Google Ads — تحويل الحجز', 'AW-123456789/AbCdEfGh', 'من Google Ads ← Goals ← Conversions ← "حجز من الموقع" ← Tag setup ← الصقي الـ send_to')}
                        {trk('adsContact', 'Google Ads — تحويل اتصال/واتساب', 'AW-123456789/XyZaBcDe', 'نفس الخطوات لـ "ضغط اتصال أو واتساب"')}
                        {trk('tiktok', 'TikTok Pixel (اختياري)', 'CXXXXXXXXXXXXXXXXXXX', 'من TikTok Ads ← Assets ← Events')}
                    </div>
                </div>

                <div className={card}><p className="font-black text-sm">✅ ربط الموقع بـ Google Search Console و Bing</p>
                    <ol className="list-decimal pr-5 space-y-1 text-[11px] font-bold text-gray-600 leading-5">
                        <li>افتحي <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-pharaonic underline">Search Console</a> ← Add property ← <b>URL prefix</b> ← <span dir="ltr">{site}/</span></li>
                        <li>اختاري طريقة <b>HTML file</b> وانسخي اسم الملف (زي <span dir="ltr">google1234abcd.html</span>) وحطيه تحت، أو طريقة <b>HTML tag</b> وانسخي الكود.</li>
                        <li>دوسي "حفظ التغييرات" تحت، استني دقيقة، وبعدين دوسي <b>Verify</b> في Search Console.</li>
                        <li>من Sitemaps ابعتي: <button type="button" onClick={() => copy(site + '/sitemap.xml', 'sm')} className="text-pharaonic underline" dir="ltr">{site}/sitemap.xml</button> {copied === 'sm' && <span className="text-emerald-600">اتنسخ ✓</span>}</li>
                    </ol>
                    <div className="grid sm:grid-cols-2 gap-2">
                        <label className="block text-xs font-bold text-gray-600">اسم ملف التحقق (HTML file)<input value={se.gscFile || ''} dir="ltr" onChange={e => set('gscFile', e.target.value.trim().replace(/^.*\//, '').toLowerCase())} className={inp + ' mt-1'} placeholder="google1234abcd.html" />{se.gscFile && (/^google[a-z0-9]+\.html$/.test(se.gscFile) ? <a href={'/' + se.gscFile} target="_blank" rel="noreferrer" className="text-[10px] text-pharaonic font-black" dir="ltr">افتحي الملف ↗ (بعد الحفظ)</a> : <span className="text-[10px] text-red-500 font-black">لازم يبدأ بـ google ويخلص بـ .html</span>)}</label>
                        <label className="block text-xs font-bold text-gray-600">أو كود HTML tag<input value={se.gsc || ''} dir="ltr" onChange={e => set('gsc', metaContent(e.target.value))} className={inp + ' mt-1'} placeholder='<meta name="google-site-verification" ...>' /></label>
                        <label className="block text-xs font-bold text-gray-600">كود Bing (msvalidate.01)<input value={se.bing || ''} dir="ltr" onChange={e => set('bing', metaContent(e.target.value))} className={inp + ' mt-1'} placeholder="XXXXXXXXXXXXXXXX" /></label>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 sm:pt-5"><input type="checkbox" checked={!!se.gscDns} onChange={e => set('gscDns', e.target.checked)} /> الموقع متربط بالفعل بطريقة تانية (DNS / المسوّق)</label>
                    </div>
                </div>

                <div className={card}><p className="font-black text-sm">🔗 صفحات الموقع اللي جوجل بيقراها ({pages.length})</p>
                    <p className="text-[11px] text-gray-500 font-bold -mt-1">كل فرع وكل خدمة ليها صفحة لوحدها + صفحة لكل خدمة في كل فرع (زي زراعة أسنان حلوان). بتتحدّث لوحدها من بيانات اللوحة والسيستم خلال ساعة.</p>
                    <div className="divide-y divide-gray-100">{pages.map(([n, path]) => <div key={path} className="flex items-center justify-between gap-2 py-1.5"><span className="text-xs font-black text-gray-700 truncate">{n}</span><span className="flex items-center gap-2 shrink-0"><span className="text-[10px] text-gray-400 font-bold hidden sm:inline" dir="ltr">{path}</span><button type="button" onClick={() => copy(site + path, path)} className="text-[10px] font-black text-gray-500">{copied === path ? 'اتنسخ ✓' : 'نسخ'}</button><a href={site + path} target="_blank" rel="noreferrer" className="text-[10px] font-black text-pharaonic">فتح ↗</a></span></div>)}</div>
                </div>

                <div className={card}><p className="font-black text-sm">🧰 أدوات مفيدة</p>
                    <div className="grid sm:grid-cols-2 gap-2">{tools.map(([n, u, s]) => <a key={n} href={u} target="_blank" rel="noreferrer" className="block border border-gray-100 rounded-xl p-2.5 hover:border-pharaonic"><span className="block text-xs font-black text-gray-800">{n} ↗</span><span className="block text-[10px] text-gray-500 font-bold">{s}</span></a>)}</div>
                </div>
            </>;
        };

        // ❓ الأسئلة الشائعة: تعديل السؤال والإجابة بالعربي والإنجليزي (بتتحفظ على طول لكل سؤال)
        const FaqAdmin = ({ inp, card }) => {
            const [list, setList] = useState(null); const [edit, setEdit] = useState({}); const [q, setQ] = useState(''); const [msg, setMsg] = useState('');
            useEffect(() => { if (!db) return; return db.collection('faqs').onSnapshot(s => setList(s.docs.map(x => ({ id: x.id, ...x.data() })).sort((a, b) => String(a.topic || '').localeCompare(String(b.topic || ''), 'ar') || (a.order ?? 999) - (b.order ?? 999))), () => setList([])); }, []);
            useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(''), 2000); return () => clearTimeout(t); }, [msg]);
            if (!list) return <p className="text-xs font-bold text-gray-400">...</p>;
            const val = (f, k) => (edit[f.id] && edit[f.id][k] !== undefined) ? edit[f.id][k] : (f[k] || '');
            const ch = (f, k, v) => setEdit(e => ({ ...e, [f.id]: { ...(e[f.id] || {}), [k]: v } }));
            const save = async f => { try { await db.collection('faqs').doc(f.id).update({ ...edit[f.id], updatedAt: new Date().toISOString() }); setEdit(e => { const n = { ...e }; delete n[f.id]; return n; }); setMsg('اتحفظ ✓'); } catch (x) { setMsg('فشل: ' + x.message); } };
            const shown = list.filter(f => !q || [f.q, f.a, f.qEn, f.aEn, f.topic].join(' ').includes(q));
            const noEn = list.filter(f => f.published && !(f.qEn && f.aEn)).length;
            return <>
                <div className={card}><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-gray-600">{list.filter(f => f.published).length} سؤال منشور {noEn ? <span className="text-amber-600">• {noEn} من غير ترجمة إنجليزي</span> : <span className="text-emerald-600">• كلهم مترجمين ✓</span>}</p>{msg && <span className="text-xs font-black text-emerald-600">{msg}</span>}</div>
                    <input value={q} onChange={e => setQ(e.target.value)} className={inp} placeholder="دوّري في الأسئلة..." /></div>
                {shown.map(f => <div key={f.id} className={card + (f.published ? '' : ' opacity-60')}>
                    <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-black text-pharaonic">{f.topic || '—'}{f.topicEn ? ' / ' + f.topicEn : ''}</span><label className="flex items-center gap-1 text-[11px] font-bold"><input type="checkbox" checked={val(f, 'published') === '' ? !!f.published : !!val(f, 'published')} onChange={e => ch(f, 'published', e.target.checked)} /> منشور</label></div>
                    <div className="grid md:grid-cols-2 gap-2"><input value={val(f, 'q')} onChange={e => ch(f, 'q', e.target.value)} className={inp + ' font-black'} /><input value={val(f, 'qEn')} dir="ltr" onChange={e => ch(f, 'qEn', e.target.value)} className={inp + ' font-black'} placeholder="Question (English)" /></div>
                    <div className="grid md:grid-cols-2 gap-2"><textarea rows="3" value={val(f, 'a')} onChange={e => ch(f, 'a', e.target.value)} className={inp} /><textarea rows="3" value={val(f, 'aEn')} dir="ltr" onChange={e => ch(f, 'aEn', e.target.value)} className={inp} placeholder="Answer (English)" /></div>
                    {edit[f.id] && <button type="button" onClick={() => save(f)} className="bg-pharaonic text-white font-black text-xs px-4 py-2 rounded-lg">حفظ السؤال ده</button>}
                </div>)}
            </>;
        };
        // أسماء وعناوين الفروع بالإنجليزي (النسخة الإنجليزي من الموقع)
        const BranchEnAdmin = ({ d, setD, inp, card }) => {
            const [brs, setBrs] = useState([]);
            useEffect(() => { if (!db) return; return db.collection('branches').onSnapshot(s => setBrs(s.docs.map(x => ({ id: x.id, ...x.data() })).filter(b => b.name && b.active !== false)), () => {}); }, []);
            const en = d.branchesEn || {};
            const setB = (id, k, v) => setD(p => ({ ...p, branchesEn: { ...(p.branchesEn || {}), [id]: { ...((p.branchesEn || {})[id] || {}), [k]: v } } }));
            if (!brs.length) return null;
            return <div className={card}><p className="font-black text-sm">🇬🇧 أسماء وعناوين الفروع بالإنجليزي</p><p className="text-[11px] text-gray-500 font-bold -mt-1">بتظهر في النسخة الإنجليزي من الموقع بس (الحجز بيتسجل في نفس الفرع عادي).</p>
                {brs.map(b => <div key={b.id} className="grid sm:grid-cols-3 gap-2 items-center"><span className="text-xs font-black text-gray-700">{b.name}</span><input value={(en[b.id] || {}).name || ''} dir="ltr" onChange={e => setB(b.id, 'name', e.target.value)} className={inp} placeholder="Branch name" /><input value={(en[b.id] || {}).address || ''} dir="ltr" onChange={e => setB(b.id, 'address', e.target.value)} className={inp} placeholder="Address (English)" /></div>)}</div>;
        };

        // ===== 📝 المدونة من اللوحة: مقالات جديدة بتنزل على /blog وفي الـ sitemap (مع المقالات الأساسية) =====
        const blogToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
        const BlogAdmin = ({ d, setD, inp, card }) => {
            const list = d.posts || [];
            const [open, setOpen] = useState(null);
            const setAt = (i, patch) => setD(p => ({ ...p, posts: (p.posts || []).map((x, j) => j === i ? { ...x, ...patch, updated: blogToday() } : x) }));
            const add = () => { const id = 'p' + Date.now(); setD(p => ({ ...p, posts: [{ id, slug: '', date: blogToday(), title: '', desc: '', image: '', services: [], body: '', faqs: '', hidden: true }, ...(p.posts || [])] })); setOpen(id); };
            const svcs = d.services.filter(s => !s.hidden);
            const slugs = list.map(p => p.slug).filter(Boolean);
            return <>
                <div className={card}>
                    <p className="text-xs font-bold text-gray-600 leading-6">المقالات بتظهر في <a href="/blog" target="_blank" rel="noreferrer" className="text-pharaonic underline">صفحة المدونة</a> وفي خريطة الموقع اللي جوجل بيقراها (مع المقالات الأساسية الموجودة). المقال بيظهر بعد الحفظ بحوالي ساعة. اللي تاريخه لسه مجاش بيستنى ويتنشر لوحده في يومه.</p>
                    <button type="button" onClick={add} className="w-full bg-pharaonic text-white font-black py-2.5 rounded-xl text-sm">+ مقال جديد</button>
                </div>
                {list.map((p, i) => { const on = open === p.id; const slugOk = /^[a-z0-9][a-z0-9-]*$/.test(p.slug || '') && p.slug !== 'index'; const dup = p.slug && slugs.filter(x => x === p.slug).length > 1; const words = String(p.body || '').split(/\s+/).filter(Boolean).length; const future = (p.date || '') > blogToday();
                    const status = p.hidden ? ['مسودة', 'bg-gray-100 text-gray-500'] : !slugOk || !p.title ? ['ناقص', 'bg-red-50 text-red-600'] : future ? ['مجدول ' + p.date, 'bg-amber-50 text-amber-700'] : ['منشور', 'bg-emerald-50 text-emerald-700'];
                    return <div key={p.id || i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50" onClick={() => setOpen(on ? null : p.id)}>
                            {p.image ? <img src={p.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-200 shrink-0" /> : <span className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">📝</span>}
                            <div className="min-w-0 flex-1"><p className="font-black text-sm text-gray-900 truncate">{p.title || 'مقال بدون عنوان'}</p><p className="text-[11px] text-gray-400 font-bold truncate" dir="ltr">/blog/{p.slug || '...'}</p></div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${status[1]}`}>{status[0]}</span><span className="text-gray-400 text-xs">{on ? '▲' : '▼'}</span>
                        </div>
                        {on && <div className="p-4 pt-1 space-y-3 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-600">العنوان (بالكلمة اللي الناس بتدوّر بيها) {seoCnt(p.title, 30, 70)}<input value={p.title || ''} onChange={e => setAt(i, { title: e.target.value })} className={inp + ' mt-1 font-black'} placeholder="مثال: سعر زراعة الأسنان في حلوان 2026 — كل اللي محتاج تعرفه" /></label>
                            <div className="grid sm:grid-cols-2 gap-2">
                                <label className="block text-xs font-bold text-gray-600">الرابط بالإنجليزي {!p.slug ? <span className="text-red-500">مطلوب</span> : !slugOk ? <span className="text-red-500">حروف إنجليزي صغيرة وأرقام وشَرطة بس</span> : dup ? <span className="text-red-500">مكرر</span> : <span className="text-emerald-600">✓</span>}<input value={p.slug || ''} dir="ltr" onChange={e => setAt(i, { slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className={inp + ' mt-1'} placeholder="dental-implants-price-helwan" /></label>
                                <label className="block text-xs font-bold text-gray-600">تاريخ النشر<input type="date" value={p.date || ''} onChange={e => setAt(i, { date: e.target.value })} className={inp + ' mt-1'} /></label>
                            </div>
                            <label className="block text-xs font-bold text-gray-600">الوصف اللي بيظهر في جوجل {seoCnt(p.desc, 110, 160)}<textarea rows="2" value={p.desc || ''} onChange={e => setAt(i, { desc: e.target.value })} className={inp + ' mt-1'} /></label>
                            <p className="text-xs font-black">صورة المقال (اختياري)</p>
                            <ImgField slot={SLOTS.blog} value={p.image || ''} onChange={v => setAt(i, { image: v })} onRemove={() => setAt(i, { image: '' })} />
                            <label className="block text-xs font-bold text-gray-600">نص المقال <span className={words >= 500 ? 'text-emerald-600' : 'text-amber-600'}>({words} كلمة — الأفضل 500 أو أكتر)</span>
                                <span className="block text-[10px] text-gray-400 font-bold">العنوان الفرعي: سطر يبدأ بـ ## • الفقرة الجديدة: سطر فاضي بين الفقرات • من غير أرقام تليفونات جوه النص ومن غير وعود زي "مضمون 100%".</span>
                                <textarea rows="12" value={p.body || ''} onChange={e => setAt(i, { body: e.target.value })} className={inp + ' mt-1 leading-7'} placeholder={'## إيه هي زراعة الأسنان؟\nزراعة الأسنان هي...\n\n## مين ينفعله الزراعة؟\n...'} /></label>
                            <label className="block text-xs font-bold text-gray-600">أسئلة شائعة (اختياري — بتطلع في جوجل كأسئلة)
                                <textarea rows="4" value={p.faqs || ''} onChange={e => setAt(i, { faqs: e.target.value })} className={inp + ' mt-1'} placeholder={'س: الزراعة بتوجع؟\nج: بتتعمل ببنج موضعي...\nس: ...\nج: ...'} /></label>
                            <div><p className="text-xs font-black mb-1.5">خدمات مرتبطة (بيتعمل لينك ليها تحت المقال)</p><div className="flex flex-wrap gap-1.5">{svcs.map(s => { const sel = (p.services || []).includes(s.id); return <button key={s.id} type="button" onClick={() => setAt(i, { services: sel ? p.services.filter(x => x !== s.id) : [...(p.services || []), s.id] })} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border ${sel ? 'bg-pharaonic text-white border-pharaonic' : 'bg-white text-gray-600 border-gray-200'}`}>{s.title}</button>; })}</div></div>
                            <div className="flex items-center justify-between flex-wrap gap-2 border-t border-gray-100 pt-2">
                                <label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={!p.hidden} onChange={e => setAt(i, { hidden: !e.target.checked })} /> منشور على الموقع</label>
                                <span className="flex items-center gap-3">{slugOk && !p.hidden && <a href={'/blog/' + p.slug} target="_blank" rel="noreferrer" className="text-xs font-black text-pharaonic">فتح المقال ↗</a>}
                                    <button type="button" className="text-red-500 text-xs font-black" onClick={() => confirm('حذف المقال نهائياً؟') && setD(x => ({ ...x, posts: (x.posts || []).filter((_, j) => j !== i) }))}>حذف</button></span>
                            </div>
                        </div>}
                    </div>; })}
                {!list.length && <p className="text-center text-xs font-bold text-gray-400 py-4">لسه مفيش مقالات من اللوحة — المقالات الأساسية ظاهرة في المدونة عادي.</p>}
            </>;
        };

        // ===== لوحة تحكم الموقع =====
        const ADMIN_TABS = [
            ['overview', 'نظرة عامة', '📊'], ['bookrep', 'التقارير', '📈'], ['booking', 'إعدادات كارت الحجز', '📅'], ['hero', 'الهيدر والأرقام', '🖼️'], ['services', 'الخدمات', '🦷'],
            ['gallery', 'المعرض', '📷'], ['reviews', 'آراء العملاء', '⭐'], ['faqs', 'الأسئلة الشائعة', '❓'], ['texts', 'النصوص', '✏️'], ['sections', 'الترتيب والإعلان', '🧩'], ['custom', 'أقسام جديدة', '➕'],
            ['contact', 'التواصل', '📞'], ['marketer', 'المسوّق الذكي', '🚀'], ['seo', 'جوجل (SEO)', '🔎'], ['blog', 'المدونة', '📝'], ['general', 'الإعدادات', '⚙️'], ['backup', 'النسخ الاحتياطي والاسترجاع', '💾']
        ];
        // ترتيب أقسام الصفحة الرئيسية (بيتغير من لوحة التحكم ← الأقسام)
        const HOME_ORDER = ['about', 'services', 'vision', 'gallery', 'reviews', 'consult', 'booking', 'faq'];
        const homeOrder = cfg => { const o = (cfg.order || []).filter(k => HOME_ORDER.includes(k)); return [...o, ...HOME_ORDER.filter(k => !o.includes(k))]; };
        const SITE_VERSION = '3.6';
        // ===== مصدر الحجز: حملة ميتا / جوجل / الموقع / واتساب / مباشر — بيتحفظ أول ما الزائر يدخل (30 يوم) ويتسجل مع الحجز =====
        const ATTR_KEY = 'ne_attrib_v1';
        const neAttrib = (() => {
            try {
                const q = new URLSearchParams(location.search), g = k => String(q.get(k) || '').slice(0, 100);
                const ref = (() => { try { return document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { return ''; } })();
                const utm = { utm_source: g('utm_source'), utm_medium: g('utm_medium'), utm_campaign: g('utm_campaign'), utm_content: g('utm_content'), utm_term: g('utm_term') };
                const src = (utm.utm_source || '').toLowerCase(), med = (utm.utm_medium || '').toLowerCase();
                let channel = q.get('fbclid') || /facebook|fb|instagram|ig|meta/.test(src) ? 'meta' : q.get('gclid') || q.get('gbraid') || q.get('wbraid') || /google/.test(src) ? 'google' : /whatsapp|wa/.test(src) || /whatsapp|wa\.me/.test(ref) ? 'whatsapp' : /tiktok/.test(src) ? 'tiktok' : /neweradentalcenter/.test(ref) ? 'website' : /facebook|instagram/.test(ref) ? 'meta' : /google\./.test(ref) ? 'google' : '';
                if (q.get('src')) channel = g('src').toLowerCase();
                const paid = !!(q.get('fbclid') || q.get('gclid') || q.get('gbraid') || q.get('wbraid') || /cpc|paid|ads?|cpm/.test(med));
                const cur = { channel: channel || 'direct', paid, ...Object.fromEntries(Object.entries(utm).filter(([, v]) => v)), ...(q.get('fbclid') ? { fbclid: '1' } : {}), ...(q.get('gclid') || q.get('gbraid') || q.get('wbraid') ? { gclid: '1' } : {}), ...(ref ? { ref: ref.slice(0, 80) } : {}), landing: location.pathname.slice(0, 60), at: new Date().toISOString() };
                const old = lsGetA();
                // أول لمسة إعلانية بتكسب (لو الزائر رجع بعدين مباشر، الحجز بيتحسب للإعلان اللي جابه)
                const keep = old && Date.now() - Date.parse(old.at || 0) < 30 * 864e5 && (old.channel !== 'direct' && (cur.channel === 'direct' || cur.channel === 'website')) ? old : cur;
                try { localStorage.setItem(ATTR_KEY, JSON.stringify(keep)); } catch (e) { }
                return keep;
            } catch (e) { return { channel: 'direct' }; }
            function lsGetA() { try { return JSON.parse(localStorage.getItem(ATTR_KEY) || 'null'); } catch (e) { return null; } }
        })();
        const attribDoc = () => { const a = neAttrib || {}, o = {}; ['channel', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ref', 'landing'].forEach(k => { if (a[k]) o[k] = String(a[k]).slice(0, 100); }); o.paid = !!a.paid; o.via = 'website'; return o; };
        const SITE_LOGO = 'https://i.ibb.co/qLw7Tcqv/logo-Dr-shahenda-original.png';
        // أسماء وعناوين الفروع بالإنجليزي (من اللوحة ← التواصل) — للعرض بس، الحجز بيتسجل بنفس الفرع
        let BR_EN = {};
        const brName = (b, lang) => (lang === 'en' && BR_EN[b.id] && BR_EN[b.id].name) || b.name;
        const brAddr = (b, lang) => (lang === 'en' && BR_EN[b.id] && BR_EN[b.id].address) || b.address;
        // نص طويل: سطر بيبدأ بـ ## = عنوان فرعي، وسطر فاضي = فقرة جديدة
        const richBlocks = t => { const out = []; let cur = null, buf = []; const flush = () => { const x = buf.join(' ').trim(); if (x) { if (!cur) { cur = ['', []]; out.push(cur); } cur[1].push(x); } buf = []; };
            String(t || '').replace(/\r/g, '').split('\n').forEach(l => { const m = l.match(/^\s*#{1,3}\s*(.+)$/); if (m) { flush(); cur = [m[1].trim(), []]; out.push(cur); } else if (!l.trim()) flush(); else buf.push(l.trim()); }); flush(); return out.filter(s => s[1].length); };
        // ===== أدوات القياس: جوجل أناليتكس 4 / تاج مانجر / بيكسل فيسبوك / بيكسل تيك توك (الأكواد من اللوحة) =====
        const TRK_RE = { ga4: /^G-[A-Z0-9]{4,}$/i, gtm: /^GTM-[A-Z0-9]{4,}$/i, pixel: /^\d{8,20}$/, tiktok: /^[A-Z0-9]{10,30}$/i, adsBook: /^AW-\d{6,}\/[\w-]{4,}$/i, adsContact: /^AW-\d{6,}\/[\w-]{4,}$/i };
        const trkOk = (k, v) => TRK_RE[k].test(String(v || '').trim());
        const addScript = (id, src, inline) => { if (document.getElementById(id)) return; const s = document.createElement('script'); s.id = id; if (src) { s.async = true; s.src = src; } if (inline) s.text = inline; document.head.appendChild(s); };
        const loadTrackers = se => {
            if (location.hash === '#admin') return; // زيارات اللوحة متتحسبش
            try {
                const ga = String(se.ga4 || '').trim().toUpperCase(), gtm = String(se.gtm || '').trim().toUpperCase(), px = String(se.pixel || '').trim(), tt = String(se.tiktok || '').trim().toUpperCase();
                if (trkOk('gtm', gtm)) addScript('trk-gtm', null, "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','" + gtm + "');");
                if (trkOk('ga4', ga)) { addScript('trk-ga4', 'https://www.googletagmanager.com/gtag/js?id=' + ga); addScript('trk-ga4i', null, "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','" + ga + "');"); }
                // Google Ads: تحويلات مباشرة (AW-رقم/label) — عشان الإعلانات تشوف الحجوزات وتتعلم منها
                const awFix = v => { v = String(v || '').trim(); return /^AW-\d{6,}\/[\w-]{4,}$/i.test(v) ? 'AW-' + v.slice(3) : ''; };
                window.__neAds = { adsBook: awFix(se.adsBook), adsContact: awFix(se.adsContact) };
                const aw = (window.__neAds.adsBook || window.__neAds.adsContact).split('/')[0];
                if (aw) { if (!trkOk('ga4', ga)) addScript('trk-aw', 'https://www.googletagmanager.com/gtag/js?id=' + aw); addScript('trk-awi', null, "window.dataLayer=window.dataLayer||[];if(!window.gtag){window.gtag=function(){dataLayer.push(arguments);};window.gtag('js',new Date());}window.gtag('config','" + aw + "');"); }
                if (trkOk('pixel', px)) addScript('trk-fb', null, "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','" + px + "');fbq('track','PageView');");
                if (trkOk('tiktok', tt)) addScript('trk-tt', null, "!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement('script');o.type='text/javascript';o.async=!0;o.src=i+'?sdkid='+e+'&lib='+t;var a=d.getElementsByTagName('script')[0];a.parentNode.insertBefore(o,a)};ttq.load('" + tt + "');ttq.page();}(window,document,'ttq');");
            } catch (e) { }
        };
        // تسجيل التحويلات (حجز / استشارة / واتساب / اتصال) في كل الأدوات المربوطة — من غير أي بيانات شخصية
        // Conversions API: نفس الحجز بيتبعت لفيسبوك من السيرفر (مشروع صفحة الحجز /api/capi) بنفس الكود عشان ميتحسبش مرتين
        const neCk = n => (document.cookie.match('(?:^|; )' + n + '=([^;]*)') || [])[1] || '';
        const neCapi = (code, phone) => { try { fetch('https://newera-booking.vercel.app/api/capi', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, phone, url: location.href, fbp: neCk('_fbp'), fbc: neCk('_fbc') }) }).catch(() => { }); } catch (e) { } };
        const neTrack = (ev, p = {}, eid) => {
            try {
                const m = { booking: ['generate_lead', 'Lead', 'SubmitForm'], consult: ['generate_lead', 'Contact', 'SubmitForm'], whatsapp: ['contact_whatsapp', 'Contact', 'ClickButton'], call: ['contact_call', 'Contact', 'Contact'] }[ev] || [ev, ev, ev];
                if (window.dataLayer) window.dataLayer.push({ event: 'ne_' + ev, ...p });
                if (window.gtag) window.gtag('event', m[0], { method: ev, ...p });
                const st = (window.__neAds || {})[{ booking: 'adsBook', consult: 'adsBook', whatsapp: 'adsContact', call: 'adsContact' }[ev]];
                if (window.gtag && st) window.gtag('event', 'conversion', { send_to: st });
                if (window.fbq) window.fbq('track', m[1], p, eid ? { eventID: eid } : undefined);
                if (window.ttq && window.ttq.track) window.ttq.track(m[2], p);
            } catch (e) { }
        };
        document.addEventListener('click', e => { if (location.hash === '#admin') return; const a = e.target && e.target.closest && e.target.closest('a[href]'); if (!a) return; const u = a.getAttribute('href') || ''; if (/wa\.me|whatsapp\.com/i.test(u)) neTrack('whatsapp'); else if (/^tel:/i.test(u)) neTrack('call'); }, true);
        // روابط صفحات جوجل (كل فرع وكل خدمة ليه صفحة حقيقية — لازم تفضل زي اللي في api/_content.js)
        const SEO_SVC_SLUG = { exam: 'dental-checkup', xray: '3d-dental-xray', fillings: 'cosmetic-fillings', 'fixed-prosthetics': 'crowns-and-bridges', 'removable-prosthetics': 'dentures', ortho: 'orthodontics', implants: 'dental-implants', kids: 'kids-dentistry', whitening: 'teeth-whitening', 'jaw-surgery': 'jaw-surgery', hollywood: 'hollywood-smile', 'root-canal': 'root-canal', rootcanal: 'root-canal', endo: 'root-canal' };
        const SEO_AREA = [['فيصل', 'faisal'], ['حلوان', 'helwan'], ['الصف', 'saff'], ['الهرم', 'haram'], ['المعادي', 'maadi'], ['أكتوبر', 'october'], ['اكتوبر', 'october'], ['التجمع', 'new-cairo'], ['مدينة نصر', 'nasr-city'], ['الجيزة', 'giza'], ['الدقي', 'dokki'], ['المهندسين', 'mohandessin']];
        const seoLatin = x => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const seoBranchSlug = b => { if (seoLatin(b.slug)) return seoLatin(b.slug); const h = SEO_AREA.find(([a]) => String(b.name || '').includes(a)); return h ? h[1] : 'branch-' + seoLatin(b.id).slice(0, 12); };
        const SEO_TITLE = [[/فينير|قشور|لومينير/, 'veneers'], [/عصب/, 'root-canal'], [/جير|تنظيف/, 'teeth-cleaning'], [/خلع/, 'tooth-extraction'], [/لث[ةه]/, 'gum-treatment'], [/زراع/, 'dental-implants'], [/تقويم/, 'orthodontics'], [/تبييض/, 'teeth-whitening'], [/هوليود/, 'hollywood-smile'], [/أطفال|اطفال/, 'kids-dentistry']];
        const seoSvcSlug = sv => { if (seoLatin(sv.slug)) return seoLatin(sv.slug); if (SEO_SVC_SLUG[sv.id]) return SEO_SVC_SLUG[sv.id]; const h = SEO_TITLE.find(([re]) => re.test(String(sv.titleAr || sv.title || ''))); return h ? h[1] : (seoLatin(sv.titleEn) || seoLatin(sv.id) || 'service'); };
        // مجموعات لوحة التحكم (كل مجموعة جواها تبويبات)
        const ADMIN_GROUPS = [
            ['overview', 'نظرة عامة', '📊', ['overview']],
            ['site', 'الأقسام', '🧩', ['hero', 'services', 'gallery', 'reviews', 'faqs', 'texts', 'sections', 'custom', 'contact']],
            ['bookings', 'الحجوزات والاستشارات', '📅', ['bookrep', 'booking']],
            ['marketing', 'التسويق و SEO', '🚀', ['marketer', 'seo', 'blog']],
            ['settings', 'الإعدادات', '⚙️', ['general', 'backup']]
        ];
        const groupOf = t => ADMIN_GROUPS.find(g => g[3].includes(t)) || ADMIN_GROUPS[0];
        const SECTION_NAMES = { announce: 'شريط الإعلان', counters: 'الأرقام في الهيدر', about: 'من نحن', services: 'الخدمات', vision: 'الرؤية والرسالة', gallery: 'المعرض', reviews: 'آراء العملاء', faq: 'الأسئلة الشائعة', consult: 'احجز استشارتك أونلاين', booking: 'الحجز أونلاين', whatsapp: 'زرار واتساب العائم' };
        // ===== 🚀 المسوّق الذكي: يسأل كام سؤال ← يعمل خطة SEO + إعلانات جوجل وفيسبوك + جوجل ماب + محتوى ← ويطبّق على الموقع =====
        const MK_GOALS = [['bookings', '📅 حجوزات أكتر'], ['service', '🦷 أروّج لخدمة معينة'], ['calls', '📞 مكالمات وواتساب أكتر'], ['maps', '📍 أظهر في جوجل ماب'], ['reviews', '⭐ تقييمات أكتر على جوجل'], ['brand', '📣 الناس تعرفنا']];
        const MK_CH = [['google', 'إعلانات جوجل (البحث)'], ['maps', 'جوجل ماب (Business Profile)'], ['meta', 'فيسبوك وإنستجرام'], ['tiktok', 'تيك توك'], ['seo', 'جوجل من غير إعلانات (SEO)']];
        const MK_USP = ['أسعار مناسبة', 'تقسيط', 'أحدث الأجهزة', 'دكاترة متخصصين', 'مواعيد بالليل', 'تعقيم كامل', 'كشف مجاني/مخفّض', 'فروع قريبة', 'ضمان على الشغل', 'متابعة بعد العلاج'];
        const MK_AUD = ['عائلات', 'أطفال', 'شباب', 'سيدات', 'كبار السن', 'موظفين', 'طلبة'];
        const mkLen = (s, n) => { const l = String(s || '').length; return <span className={`text-[10px] font-black ${l > n ? 'text-red-500' : 'text-gray-400'}`}>{l}/{n}</span>; };
        const copyTxt = (t, done) => { const ok = () => done && done('اتنسخ ✓'); try { navigator.clipboard.writeText(t).then(ok).catch(() => { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); ok(); }); } catch (e) { } };
        // فحص سريع للموقع من غير ذكاء اصطناعي
        const seoHealth = (d, branches, faqsN) => {
            const se = d.seo || {}, svc = d.services.filter(s => !s.hidden);
            const items = [
                [(se.title || '').length >= 20 && (se.title || '').length <= 60, 'عنوان الموقع لجوجل (20-60 حرف)', 'seo'],
                [(se.desc || '').length >= 110 && (se.desc || '').length <= 160, 'وصف الموقع لجوجل (110-160 حرف)', 'seo'],
                [svc.length >= 5 && svc.every(s => (s.desc || '').length >= 80), 'كل خدمة ليها وصف كويس (80 حرف على الأقل)', 'services'],
                [svc.every(s => s.titleEn && s.descEn), 'الخدمات ليها نسخة إنجليزي', 'services'],
                [svc.every(s => s.image), 'كل خدمة ليها صورة', 'services'],
                [branches.length > 0 && branches.every(b => b.address), 'كل فرع ليه عنوان مكتوب', null],
                [branches.length > 0 && branches.every(b => b.mapsLink), 'كل فرع ليه لينك خريطة', null],
                [branches.every(b => b.phone) || (d.phones || []).filter(Boolean).length > 0, 'أرقام التليفون ظاهرة', 'contact'],
                [!!(d.hours && d.hours.ar), 'مواعيد العمل مكتوبة', 'contact'],
                [faqsN >= 6, 'أسئلة شائعة منشورة (6 على الأقل)', 'marketer'],
                [Object.values(d.socials || {}).filter(Boolean).length >= 2, 'لينكات السوشيال', 'contact'],
                [branches.every(b => b.reviewLink), 'لينك تقييم جوجل لكل فرع', null],
                [!!(se.titleEn && se.descEn), 'عنوان ووصف إنجليزي للموقع', 'seo'],
                [!!(se.ogImage || (d.heroImages || []).filter(Boolean).length), 'صورة مشاركة اللينك', 'seo'],
                [trkOk('ga4', se.ga4) || trkOk('gtm', se.gtm), 'جوجل أناليتكس مربوط', 'seo'],
                [!!(se.gsc || se.gscFile || se.gscDns), 'Search Console مربوط', 'seo'],
                [(se.keywords || []).filter(Boolean).length >= 5, 'الكلمات المستهدفة (5 على الأقل)', 'seo']
            ];
            return { score: Math.round(items.filter(x => x[0]).length / items.length * 100), items };
        };

        // ربط سكريبت جوجل + مفتاح الذكاء الاصطناعي (نفس إعداد السيستم بالظبط — settings/inv_ai + private_config/ai)
        const AiLink = ({ cfg, onClose }) => {
            const [busy, setBusy] = useState(''); const [msg, setMsg] = useState(null);
            const url = (cfg.url || '').trim();
            const save = async e => {
                e.preventDefault(); const f = e.target, u = f.url.value.trim(), k = f.key.value.trim(), m = f.model.value.trim();
                if (!/^https:\/\/script\.google\.com\/.+\/exec/.test(u)) { setMsg(['err', 'الرابط لازم يكون رابط الـ Web app وبيخلص بـ /exec']); return; }
                setBusy('save'); setMsg(null);
                try {
                    if (k || m !== (cfg.model || '')) await db.collection('private_config').doc('ai').set({ ...(k ? { key: k } : {}), model: m }, { merge: true });
                    await db.collection('settings').doc('inv_ai').set({ url: u, model: m, hasKey: !!(k || cfg.hasKey) }, { merge: true });
                    f.key.value = ''; setMsg(['ok', 'اتحفظ ✅ — دوسي "جرّبي الربط" تتأكدي']);
                } catch (err) { setMsg(['err', err.message]); }
                setBusy('');
            };
            const test = async () => {
                if (!url) { setMsg(['err', 'احفظي الرابط الأول']); return; }
                setBusy('test'); setMsg(null);
                try {
                    const tok = await auth.currentUser.getIdToken();
                    const r = await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'ping', idToken: tok }) });
                    let j; try { j = await r.json(); } catch (e) { throw new Error('الرابط مش راجع رد صحيح — اتأكدي إنه رابط الـ Web app وإن الصلاحية Anyone'); }
                    if (!j.ok) throw new Error(j.error || 'حصلت مشكلة');
                    setMsg(j.ai ? ['ok', '✅ شغال — ' + (j.provider === 'claude' ? 'Claude' : 'Gemini') + ' (' + j.model + ')'] : ['err', 'الرابط شغال بس مفيش مفتاح AI محفوظ — حطي المفتاح واحفظي']);
                } catch (err) { setMsg(['err', err.message.includes('Failed to fetch') ? 'مقدرتش أوصل للرابط — اتأكدي إنه صح وإن الصلاحية Anyone' : err.message]); }
                setBusy('');
            };
            const inp = 'w-full border border-gray-200 focus:border-pharaonic rounded-xl p-2.5 text-sm outline-none';
            return (
                <div className="bg-white rounded-2xl p-4 shadow-sm border-2 space-y-3" style={{ borderColor: "#D4AF37" }}>
                    <div className="flex justify-between items-center gap-2"><p className="font-black text-gray-900">🔌 ربط الذكاء الاصطناعي {url ? <span className="text-xs text-green-600">• مربوط</span> : <span className="text-xs text-red-500">• مش مربوط لسه</span>}</p>{url && onClose && <button type="button" onClick={onClose} className="text-xs font-black text-gray-400">إخفاء</button>}</div>
                    <p className="text-xs font-bold text-gray-500">بتعمليه مرة واحدة بس، وهو نفس ربط السيستم (قراءة الفواتير وملفات الحالات) — لو عملتيه هنا يشتغل هناك والعكس.</p>
                    <ol className="list-decimal pr-5 space-y-1.5 text-xs font-bold text-gray-600 leading-5">
                        <li>افتحي سكريبت جوجل بتاع الإشعارات (اللي فيه Code.gs) ← فوق على اليمين <b>Deploy</b> ← <b>New deployment</b>.</li>
                        <li>من الترس جنب Select type اختاري <b>Web app</b> ← Execute as: <b>Me</b> ← Who has access: <b>Anyone</b> ← <b>Deploy</b> (ووافقي على الصلاحيات لو طلب).</li>
                        <li>انسخي <b>Web app URL</b> (بيخلص بـ /exec) وحطيه تحت.</li>
                        <li>مفتاح الذكاء الاصطناعي: مجاني من <b dir="ltr">aistudio.google.com</b> ← Get API key (Gemini)، أو مفتاح Claude من <b dir="ltr">console.anthropic.com</b> (بيبدأ بـ sk-ant).</li>
                    </ol>
                    <form onSubmit={save} className="space-y-2">
                        <input name="url" defaultValue={url} dir="ltr" placeholder="https://script.google.com/macros/s/.../exec" className={inp} />
                        <input name="key" type="password" dir="ltr" autoComplete="off" placeholder={cfg.hasKey ? '•••••• (المفتاح محفوظ — سيبيه فاضي لو مش هتغيريه)' : 'API key'} className={inp} />
                        <input name="model" defaultValue={cfg.model || ''} dir="ltr" placeholder="الموديل (اختياري — سيبيه فاضي للافتراضي)" className={inp} />
                        <div className="flex gap-2">
                            <button disabled={!!busy} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white font-black text-sm disabled:opacity-60">{busy === 'save' ? '...' : '💾 احفظي'}</button>
                            <button type="button" disabled={!!busy} onClick={test} className="flex-1 py-2.5 rounded-xl bg-gray-100 font-black text-sm disabled:opacity-60">{busy === 'test' ? '...' : '🧪 جرّبي الربط'}</button>
                        </div>
                    </form>
                    {msg && <p className={'text-sm font-bold rounded-xl p-3 ' + (msg[0] === 'ok' ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50')}>{msg[1]}</p>}
                </div>);
        };

        const Marketer = ({ d, setD, go, user }) => {
            const [branches, setBranches] = useState([]);
            const [faqsN, setFaqsN] = useState(0);
            const [store, setStore] = useState(null); // { answers, plan, at }
            const [step, setStep] = useState(0);
            const [a, setA] = useState({ goals: ['bookings'], services: [], areas: [], extraAreas: '', budget: 3000, channels: ['google', 'maps', 'seo'], usp: [], uspText: '', audience: [], tone: 'ودود', notes: '' });
            const [busy, setBusy] = useState('');
            const [err, setErr] = useState('');
            const [toast, setToast] = useState('');
            const [sec, setSec] = useState('summary');
            const [ask, setAsk] = useState(''); const [askRes, setAskRes] = useState(null);
            const [aiCfg, setAiCfg] = useState(null); const [showLink, setShowLink] = useState(false);
            useEffect(() => { if (!db) return; return db.collection('settings').doc('inv_ai').onSnapshot(s => { const v = s.exists ? s.data() : {}; setAiCfg(v); if (!(v.url || '').trim()) setShowLink(true); }, () => setAiCfg({})); }, []);
            const linked = !!(aiCfg && (aiCfg.url || '').trim());
            const linkCard = aiCfg && (!linked || showLink) ? <AiLink cfg={aiCfg} onClose={() => setShowLink(false)} /> : (aiCfg ? <button type="button" onClick={() => setShowLink(true)} className="text-[11px] font-black text-gray-400">🔌 إعداد ربط الذكاء الاصطناعي</button> : null);
            useEffect(() => { if (!db) return; const u1 = db.collection('branches').onSnapshot(s => setBranches(s.docs.map(x => ({ id: x.id, ...x.data() }))), () => {}); const u2 = db.collection('faqs').where('published', '==', true).onSnapshot(s => setFaqsN(s.size), () => {}); return () => { u1(); u2(); }; }, []);
            useEffect(() => { if (!db) return; db.collection('private_config').doc('marketing').get().then(s => { const v = s.exists ? s.data() : {}; setStore(v); if (v.answers) setA(x => ({ ...x, ...v.answers })); if (v.plan) setStep(9); }).catch(() => setStore({})); }, []);
            useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2200); return () => clearTimeout(t); }, [toast]);
            const H = seoHealth(d, branches, faqsN);
            const svcs = d.services.filter(s => !s.hidden);
            const tog = (k, v) => setA(x => ({ ...x, [k]: x[k].includes(v) ? x[k].filter(y => y !== v) : [...x[k], v] }));
            const chip = on => `px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${on ? 'bg-pharaonic text-white border-pharaonic' : 'bg-white border-gray-200 text-gray-700 hover:border-pharaonic'}`;
            const siteData = () => ({
                brand: 'New Era Dental Center — نيو إيرا لطب الأسنان', url: location.href.split('#')[0], whatsapp: d.whatsapp, phones: d.phones, hours: d.hours, socials: d.socials,
                currentSeo: d.seo, branches: branches.map(b => ({ name: b.name, address: b.address || '', hours: b.hours || '', phone: b.phone || '', hasMap: !!b.mapsLink })),
                services: svcs.map(s => ({ id: s.id, title: s.title, titleEn: s.titleEn || '', desc: s.desc || '' }))
            });
            const call = async body => {
                const s = await db.collection('settings').doc('inv_ai').get(); const url = ((s.exists && s.data().url) || '').trim();
                if (!url) { setShowLink(true); throw new Error('لسه محتاجين نربط الذكاء الاصطناعي — اعمليه من كارت "🔌 ربط الذكاء الاصطناعي" اللي فوق (مرة واحدة بس)'); }
                const tok = await auth.currentUser.getIdToken();
                const r = await fetch(url, { method: 'POST', body: JSON.stringify({ ...body, idToken: tok }) });
                const j = await r.json(); if (!j.ok) throw new Error(j.error || 'حصلت مشكلة'); return j.data;
            };
            const build = async () => {
                setErr(''); const plan = {}; const parts = [['seo', '🔎 بجهّز الكلمات والـ SEO...'], ['ads', '💰 بجهّز الإعلانات والميزانية...'], ['local', '📍 بجهّز جوجل ماب والمحتوى...']];
                try {
                    for (const [p, l] of parts) { setBusy(l); const r = await call({ action: 'marketing', part: p, answers: a, site: siteData(), context: plan.summary ? plan.summary + '\nKeywords: ' + (plan.keywords || []).slice(0, 15).map(k => k.kw).join(', ') : '' }); Object.assign(plan, r); }
                    const v = { answers: a, plan, at: new Date().toISOString(), by: (user && user.email) || '' };
                    await db.collection('private_config').doc('marketing').set(v);
                    setStore(v); setStep(9); setSec('summary');
                } catch (e) { setErr(e.message.includes('Failed to fetch') ? 'مقدرتش أوصل للسكريبت — اتأكدي من النت ومن الرابط' : e.message); }
                setBusy('');
            };
            const doAsk = async () => { if (!ask.trim()) return; setBusy('✍️ بكتب...'); setErr(''); try { setAskRes(await call({ action: 'marketing', mode: 'ask', question: ask, site: siteData(), planSummary: store && store.plan ? store.plan.summary : '' })); } catch (e) { setErr(e.message); } setBusy(''); };
            const plan = store && store.plan;
            // تطبيق على الموقع (بيتحفظ لما تدوسي "حفظ" فوق)
            const applySeo = () => { setD(p => ({ ...p, seo: { ...p.seo, title: plan.seo.title || p.seo.title, desc: plan.seo.desc || p.seo.desc, titleEn: plan.seo.titleEn || '', descEn: plan.seo.descEn || '', keywords: (plan.keywords || []).slice(0, 20).map(k => k.kw) } })); setToast('اتحط ✓ — دوسي "حفظ" تحت'); };
            const applySvc = (id, x) => { setD(p => ({ ...p, services: p.services.map(s => s.id === id ? { ...s, desc: x.desc || s.desc, descEn: x.descEn || s.descEn } : s) })); setToast('اتحط ✓ — دوسي "حفظ"'); };
            const applyAllSvc = () => { (plan.services || []).forEach(x => applySvc(x.id, x)); };
            const addFaqs = async () => { const b = db.batch(); (plan.faqs || []).forEach(f => b.set(db.collection('faqs').doc(), { q: f.q, a: f.a, topic: f.topic || '', published: true, source: 'ai', createdAt: new Date().toISOString() })); await b.commit(); setToast('اتنشرت ' + (plan.faqs || []).length + ' سؤال على الموقع ✓'); };
            const Copy = ({ t, label = 'نسخ' }) => <button type="button" onClick={() => copyTxt(t, setToast)} className="shrink-0 text-[11px] font-black bg-gray-900 text-white px-2.5 py-1 rounded-lg">{label}</button>;
            const card = 'bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 space-y-3';
            const STEPS = ['الهدف', 'الخدمات', 'الأماكن', 'الميزانية والقنوات', 'إيه اللي يميزكم'];
            const healthCard = (
                <div className={card}>
                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 shrink-0"><svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#eee" strokeWidth="3.5" /><circle cx="18" cy="18" r="15.9" fill="none" stroke={H.score >= 75 ? '#10b981' : H.score >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="3.5" strokeDasharray={H.score + ' 100'} strokeLinecap="round" /></svg><span className="absolute inset-0 flex items-center justify-center font-black text-lg">{H.score}%</span></div>
                        <div><p className="font-black text-gray-900">جاهزية الموقع لجوجل</p><p className="text-xs font-bold text-gray-500">فحص سريع لأهم حاجات بيبص عليها جوجل في البحث والخريطة.</p></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-1.5">{H.items.map(([ok, t, tab], i) => <button key={i} type="button" disabled={ok || !tab} onClick={() => tab && go(tab)} className={`text-right text-xs font-bold rounded-lg px-2.5 py-2 ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>{ok ? '✓ ' : '✕ '}{t}{!ok && !tab ? ' (من السيستم ← الفروع)' : ''}</button>)}</div>
                    <p className="text-[11px] font-bold text-gray-400">✨ الموقع بيبعت لجوجل بيانات منظمة (Schema) فيها الفروع والعناوين والخدمات والأسئلة الشائعة تلقائي — ده بيساعد في الظهور في الخريطة والنتايج.</p>
                </div>);
            if (store === null) return <p className="text-sm font-bold text-gray-400 p-6">...</p>;
            // ===== الأسئلة =====
            if (step < 9) return (
                <div className="space-y-3">
                    {linkCard}
                    {healthCard}
                    <div className={card}>
                        <div className="flex items-center justify-between gap-2"><p className="font-black text-gray-900">🚀 المسوّق الذكي — {STEPS[step]}</p><span className="text-xs font-black text-gray-400">{step + 1}/{STEPS.length}</span></div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-pharaonic transition-all" style={{ width: ((step + 1) / STEPS.length * 100) + '%' }} /></div>
                        {step === 0 && <><p className="text-sm font-bold text-gray-600">عايزة إيه من الإعلانات والظهور على جوجل؟ (اختاري أكتر من حاجة)</p><div className="flex flex-wrap gap-2">{MK_GOALS.map(([k, l]) => <button key={k} type="button" onClick={() => tog('goals', k)} className={chip(a.goals.includes(k))}>{l}</button>)}</div></>}
                        {step === 1 && <><p className="text-sm font-bold text-gray-600">أنهي خدمات عايزة تركّزي عليها؟ (لو سيبتيها فاضية هنشتغل على كله)</p><div className="flex flex-wrap gap-2">{svcs.map(s => <button key={s.id} type="button" onClick={() => tog('services', s.id)} className={chip(a.services.includes(s.id))}>{s.title}</button>)}</div>
                            <p className="text-sm font-bold text-gray-600 pt-2">مين الناس اللي عايزاهم؟</p><div className="flex flex-wrap gap-2">{MK_AUD.map(x => <button key={x} type="button" onClick={() => tog('audience', x)} className={chip(a.audience.includes(x))}>{x}</button>)}</div></>}
                        {step === 2 && <><p className="text-sm font-bold text-gray-600">عايزة تجيبي ناس من أنهي مناطق؟</p><div className="flex flex-wrap gap-2">{branches.map(b => <button key={b.id} type="button" onClick={() => tog('areas', b.name)} className={chip(a.areas.includes(b.name))}>📍 حوالين فرع {b.name}</button>)}</div>
                            <input value={a.extraAreas} onChange={e => setA({ ...a, extraAreas: e.target.value })} placeholder="مناطق تانية قريبة (مثال: الهرم، العمرانية، المعادي)" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" /></>}
                        {step === 3 && <><p className="text-sm font-bold text-gray-600">ميزانية الإعلانات في الشهر (بالجنيه)</p>
                            <div className="flex items-center gap-3"><input type="range" min="0" max="50000" step="500" value={a.budget} onChange={e => setA({ ...a, budget: +e.target.value })} className="flex-1 accent-[#D4AF37]" /><input type="number" value={a.budget} onChange={e => setA({ ...a, budget: +e.target.value || 0 })} className="w-28 border border-gray-200 rounded-xl p-2 text-sm font-black text-center" /></div>
                            <p className="text-[11px] font-bold text-gray-400">{a.budget ? '≈ ' + Math.round(a.budget / 30) + ' ج في اليوم. ' : 'صفر = من غير إعلانات مدفوعة، هنركّز على الظهور المجاني. '}تقدري تبدأي بمبلغ صغير وتزوّدي لما تشوفي النتيجة.</p>
                            <p className="text-sm font-bold text-gray-600 pt-1">فين؟</p><div className="flex flex-wrap gap-2">{MK_CH.map(([k, l]) => <button key={k} type="button" onClick={() => tog('channels', k)} className={chip(a.channels.includes(k))}>{l}</button>)}</div></>}
                        {step === 4 && <><p className="text-sm font-bold text-gray-600">إيه اللي يميّزكم؟ (اختاري اللي صح بس — الإعلانات ممنوع تقول حاجة مش حقيقية)</p><div className="flex flex-wrap gap-2">{MK_USP.map(x => <button key={x} type="button" onClick={() => tog('usp', x)} className={chip(a.usp.includes(x))}>{x}</button>)}</div>
                            <textarea rows="2" value={a.uspText} onChange={e => setA({ ...a, uspText: e.target.value })} placeholder="أي حاجة تانية: عروض حالية، أسعار تحبي تعلني عنها، أسماء دكاترة..." className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" />
                            <p className="text-sm font-bold text-gray-600">أسلوب الكلام</p><div className="flex gap-2">{['ودود', 'رسمي', 'شبابي'].map(x => <button key={x} type="button" onClick={() => setA({ ...a, tone: x })} className={chip(a.tone === x)}>{x}</button>)}</div></>}
                        {err && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl p-3">{err}</p>}
                        <div className="flex gap-2 pt-1">
                            {step > 0 && <button type="button" disabled={!!busy} onClick={() => setStep(step - 1)} className="px-5 py-3 rounded-xl bg-gray-100 font-black text-sm">رجوع</button>}
                            {step < STEPS.length - 1 ? <button type="button" onClick={() => setStep(step + 1)} className="flex-1 py-3 rounded-xl bg-pharaonic text-white font-black text-sm">التالي ←</button>
                                : <button type="button" disabled={!!busy} onClick={build} className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-black text-sm disabled:opacity-60">{busy || '✨ اعملي الخطة'}</button>}
                        </div>
                        {busy && <p className="text-xs font-bold text-gray-400 text-center">ده بياخد حوالي دقيقة — متقفليش الصفحة</p>}
                        {plan && <button type="button" onClick={() => setStep(9)} className="w-full text-xs font-black text-gray-500">↩ رجوع للخطة الحالية</button>}
                    </div>
                </div>);
            // ===== الخطة =====
            const P = plan, ga = P.googleAds || {}, me = P.meta || {}, gb = P.gbp || {};
            const SECS = [['summary', '🧭 الخطة'], ['seo', '🔎 الموقع وجوجل'], ['google', '💰 إعلانات جوجل'], ['meta', '📱 فيسبوك وإنستا'], ['gbp', '📍 جوجل ماب'], ['content', '🗓️ المحتوى'], ['ask', '✍️ اطلبي أي حاجة']];
            const Box = ({ title, children, right }) => <div className={card}><div className="flex justify-between items-center gap-2"><p className="font-black text-gray-900 text-sm">{title}</p>{right}</div>{children}</div>;
            const Line = ({ t, n }) => <div className="flex items-start justify-between gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5"><p className="text-sm font-bold text-gray-800 whitespace-pre-line">{t}</p><div className="flex items-center gap-1.5 shrink-0">{n && mkLen(t, n)}<Copy t={t} /></div></div>;
            return (
                <div className="space-y-3">
                    {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-xl">{toast}</div>}
                    {linkCard}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div><p className="font-black text-gray-900">📋 خطتك الحالية</p><p className="text-[11px] font-bold text-gray-400">اتعملت: {new Date(store.at).toLocaleString('ar-EG')} • ميزانية {store.answers.budget || 0} ج/شهر</p></div>
                        <button type="button" onClick={() => setStep(0)} className="text-xs font-black bg-white border border-gray-200 px-3 py-2 rounded-xl">✏️ غيّري الأهداف واعملي خطة جديدة</button>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto hide-scroll-bar pb-1">{SECS.map(([k, l]) => <button key={k} type="button" onClick={() => setSec(k)} className={`shrink-0 px-3 py-2 rounded-xl text-xs font-black ${sec === k ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{l}</button>)}</div>
                    {err && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl p-3">{err}</p>}
                    {sec === 'summary' && <>
                        <Box title="🧭 الخطة باختصار"><p className="text-sm font-bold text-gray-700 leading-7 whitespace-pre-line">{P.summary}</p></Box>
                        {healthCard}
                        {(P.checklist || []).length > 0 && <Box title="✅ اعملي إيه بالترتيب"><div className="space-y-1.5">{P.checklist.map((c, i) => <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-lg p-2.5"><span className="w-6 h-6 rounded-full bg-pharaonic text-white text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span><div><p className="text-sm font-black text-gray-800">{c.task}</p>{c.why && <p className="text-xs font-bold text-gray-500">{c.why}</p>}</div></div>)}</div></Box>}
                    </>}
                    {sec === 'seo' && <>
                        <Box title="🔎 العنوان والوصف في نتايج جوجل" right={<button type="button" onClick={applySeo} className="text-xs font-black bg-pharaonic text-white px-3 py-1.5 rounded-lg">طبّقي على الموقع</button>}>
                            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50"><p className="text-[#1a0dab] text-base font-bold">{P.seo && P.seo.title}</p><p className="text-gray-600 text-xs mt-1">{P.seo && P.seo.desc}</p></div>
                            <div className="flex gap-3 text-[11px] font-bold text-gray-500"><span>العنوان {mkLen(P.seo && P.seo.title, 60)}</span><span>الوصف {mkLen(P.seo && P.seo.desc, 160)}</span></div>
                            {P.seo && P.seo.titleEn && <div className="text-xs font-bold text-gray-500" dir="ltr"><p className="text-[#1a0dab]">{P.seo.titleEn}</p><p>{P.seo.descEn}</p></div>}
                        </Box>
                        <Box title={'🔑 الكلمات اللي الناس بتدوّر بيها (' + (P.keywords || []).length + ')'} right={<Copy t={(P.keywords || []).map(k => k.kw).join('\n')} label="نسخ الكل" />}>
                            <div className="flex flex-wrap gap-1.5">{(P.keywords || []).map((k, i) => <span key={i} className={`text-xs font-bold px-2 py-1 rounded-lg ${k.priority === 1 ? 'bg-pharaonic/15 text-[#8a6d12]' : 'bg-gray-100 text-gray-700'}`}>{k.kw}</span>)}</div>
                        </Box>
                        <Box title="🦷 وصف الخدمات (محسّن لجوجل)" right={<button type="button" onClick={applyAllSvc} className="text-xs font-black bg-pharaonic text-white px-3 py-1.5 rounded-lg">طبّقي الكل</button>}>
                            {(P.services || []).map(x => { const s = d.services.find(y => y.id === x.id); if (!s) return null; return <div key={x.id} className="bg-gray-50 rounded-xl p-3 space-y-1"><div className="flex justify-between items-center gap-2"><p className="font-black text-sm">{s.title}</p><button type="button" onClick={() => applySvc(x.id, x)} className="text-[11px] font-black text-[#8a6d12]">طبّقي</button></div><p className="text-xs font-bold text-gray-700">{x.desc}</p>{x.descEn && <p className="text-xs text-gray-500" dir="ltr">{x.descEn}</p>}</div>; })}
                        </Box>
                        <Box title={'❓ أسئلة شائعة جاهزة (' + (P.faqs || []).length + ')'} right={<button type="button" onClick={addFaqs} className="text-xs font-black bg-pharaonic text-white px-3 py-1.5 rounded-lg">انشريهم على الموقع</button>}>
                            {(P.faqs || []).map((f, i) => <div key={i} className="bg-gray-50 rounded-xl p-3"><p className="font-black text-sm">{f.q}</p><p className="text-xs font-bold text-gray-600 mt-1">{f.a}</p></div>)}
                            <p className="text-[11px] font-bold text-gray-400">بيتنشروا في قسم الأسئلة الشائعة، وبيتبعتوا لجوجل كـ FAQ. تقدري تعدّلي أو تمسحي أي سؤال من السيستم.</p>
                        </Box>
                    </>}
                    {sec === 'google' && (!(ga.campaigns || []).length ? <Box title="💰 إعلانات جوجل"><p className="text-sm font-bold text-gray-500">مفيش ميزانية إعلانات في الخطة دي — غيّري الأهداف وحطي ميزانية لو عايزة إعلانات.</p></Box> : <>
                        <Box title="💰 الإعداد العام"><div className="grid sm:grid-cols-2 gap-2 text-sm font-bold text-gray-700">
                            <p className="bg-gray-50 rounded-lg p-2.5">💵 الميزانية: <b>{ga.dailyBudget} ج/يوم</b></p><p className="bg-gray-50 rounded-lg p-2.5">🎯 طريقة المزايدة: {ga.bidding}</p>
                            <p className="bg-gray-50 rounded-lg p-2.5">🕐 المواعيد: {ga.schedule}</p><p className="bg-gray-50 rounded-lg p-2.5">📍 الأماكن: {(ga.locations || []).map(l => l.branch + ' (' + l.radiusKm + ' كم)').join('، ')}</p></div></Box>
                        {(ga.campaigns || []).map((c, ci) => <Box key={ci} title={'📢 حملة: ' + c.name} right={<span className="text-xs font-black text-gray-500">{c.dailyBudget} ج/يوم</span>}>
                            {(c.adGroups || []).map((g, gi) => <div key={gi} className="border border-gray-100 rounded-xl p-3 space-y-2">
                                <p className="font-black text-sm text-[#8a6d12]">مجموعة: {g.name}</p>
                                <div className="flex justify-between items-center"><p className="text-xs font-black text-gray-500">الكلمات</p><Copy t={(g.keywords || []).join('\n')} label="نسخ الكلمات" /></div>
                                <div className="flex flex-wrap gap-1" dir="auto">{(g.keywords || []).map((k, i) => <span key={i} className="text-xs bg-gray-100 rounded px-1.5 py-0.5 font-bold">{k}</span>)}</div>
                                <div className="flex justify-between items-center"><p className="text-xs font-black text-gray-500">العناوين (30 حرف)</p><Copy t={(g.headlines || []).join('\n')} label="نسخ الكل" /></div>
                                <div className="space-y-1">{(g.headlines || []).map((h, i) => <Line key={i} t={h} n={30} />)}</div>
                                <div className="flex justify-between items-center"><p className="text-xs font-black text-gray-500">الوصف (90 حرف)</p><Copy t={(g.descriptions || []).join('\n')} label="نسخ الكل" /></div>
                                <div className="space-y-1">{(g.descriptions || []).map((h, i) => <Line key={i} t={h} n={90} />)}</div>
                            </div>)}
                        </Box>)}
                        <Box title="🚫 كلمات سلبية (عشان فلوسك متروحش على ناس مش عايزة تحجز)" right={<Copy t={(ga.negatives || []).join('\n')} label="نسخ" />}><div className="flex flex-wrap gap-1">{(ga.negatives || []).map((k, i) => <span key={i} className="text-xs bg-red-50 text-red-700 rounded px-1.5 py-0.5 font-bold">{k}</span>)}</div></Box>
                        {((ga.sitelinks || []).length > 0 || (ga.callouts || []).length > 0) && <Box title="🔗 إضافات الإعلان">{(ga.sitelinks || []).map((s, i) => <Line key={i} t={s.text + (s.desc ? ' — ' + s.desc : '')} />)}<div className="flex flex-wrap gap-1">{(ga.callouts || []).map((c, i) => <span key={i} className="text-xs bg-gray-100 rounded px-2 py-1 font-bold">{c}</span>)}</div></Box>}
                        <Box title="📘 إزاي أحطها في جوجل"><ol className="list-decimal pr-5 text-sm font-bold text-gray-600 space-y-1 leading-7"><li>ادخلي ads.google.com ← New campaign ← الهدف: Leads ← Search.</li><li>الأماكن: اختاري Location ← Radius حوالين كل فرع بالأرقام اللي فوق، وخلي الخيار "Presence" (الناس اللي موجودين فعلاً).</li><li>كل "مجموعة" فوق = Ad group: الصقي الكلمات، وبعدين اعملي Responsive search ad والصقي العناوين والوصف.</li><li>Keywords ← Negative keywords: الصقي الكلمات السلبية.</li><li>فعّلي Call extension برقم الفرع، وSitelinks من فوق.</li><li>بعد أسبوعين بصّي على النتايج (الكليكات والمكالمات والحجوزات)، واكتبيها في "✍️ اطلبي أي حاجة" واطلبي تظبيط الحملة.</li></ol></Box>
                    </>)}
                    {sec === 'meta' && (!(me.ads || []).length ? <Box title="📱 فيسبوك وإنستجرام"><p className="text-sm font-bold text-gray-500">مفيش إعلانات فيسبوك في الخطة دي.</p></Box> : <>
                        <Box title="📱 الإعداد"><p className="text-sm font-bold text-gray-700 bg-gray-50 rounded-lg p-2.5">💵 {me.dailyBudget} ج/يوم • 🎯 {me.objective}</p>{(me.audiences || []).map((x, i) => <p key={i} className="text-sm font-bold text-gray-700 bg-gray-50 rounded-lg p-2.5">👥 <b>{x.name}:</b> {x.targeting}</p>)}</Box>
                        {(me.ads || []).map((x, i) => <Box key={i} title={'إعلان ' + (i + 1)} right={<Copy t={x.primary + '\n\n' + x.headline} />}><p className="text-sm font-bold text-gray-800 whitespace-pre-line">{x.primary}</p><p className="text-sm font-black text-gray-900 border-t pt-2">{x.headline} {mkLen(x.headline, 40)}</p><p className="text-xs font-bold text-gray-500">الزرار: {x.cta}</p></Box>)}
                        <p className="text-[11px] font-bold text-gray-400 px-1">⚠️ فيسبوك بيرفض الإعلانات اللي بتكلم الشخص عن حالته الصحية ("عندك تسوس؟")، فالنصوص دي متكتبة بطريقة مقبولة.</p>
                    </>)}
                    {sec === 'gbp' && <>
                        <Box title="📍 وصف النشاط على جوجل ماب" right={<Copy t={gb.description || ''} />}><p className="text-sm font-bold text-gray-700 whitespace-pre-line">{gb.description}</p><p className="text-[11px] font-bold text-gray-400">{mkLen(gb.description, 750)} — الصقيه في Google Business Profile ← Edit profile ← Description لكل فرع.</p></Box>
                        <Box title="🏷️ الفئات (Categories)"><div className="flex flex-wrap gap-1.5" dir="ltr">{(gb.categories || []).map((c, i) => <span key={i} className={`text-xs font-bold px-2 py-1 rounded-lg ${i === 0 ? 'bg-pharaonic text-white' : 'bg-gray-100'}`}>{c}{i === 0 ? ' (primary)' : ''}</span>)}</div></Box>
                        <Box title="📝 بوستات أسبوعية لجوجل ماب">{(gb.posts || []).map((x, i) => <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1"><div className="flex justify-between gap-2"><p className="font-black text-sm">{x.title}</p><Copy t={x.text} /></div><p className="text-xs font-bold text-gray-600 whitespace-pre-line">{x.text}</p><p className="text-[10px] font-black text-gray-400" dir="ltr">CTA: {x.cta}</p></div>)}</Box>
                        <Box title="⭐ التقييمات">{P.reviews && <Line t={P.reviews.ask} />}{(P.reviews && P.reviews.tips || []).map((t, i) => <p key={i} className="text-xs font-bold text-gray-600">• {t}</p>)}
                            {gb.replyTemplates && <><p className="text-xs font-black text-gray-500 pt-2">الرد على التقييمات</p><Line t={gb.replyTemplates.positive || ''} /><Line t={gb.replyTemplates.negative || ''} /></>}</Box>
                    </>}
                    {sec === 'content' && <Box title="🗓️ خطة المحتوى">{(P.content || []).map((x, i) => <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1"><div className="flex justify-between gap-2"><p className="font-black text-sm">أسبوع {x.week} • {x.channel}: {x.idea}</p>{x.text && <Copy t={x.text} />}</div>{x.text && <p className="text-xs font-bold text-gray-600 whitespace-pre-line">{x.text}</p>}</div>)}</Box>}
                    {sec === 'ask' && <Box title="✍️ اطلبي أي حاجة من المسوّق">
                        <textarea rows="3" value={ask} onChange={e => setAsk(e.target.value)} placeholder="مثال: اكتبلي بوست عن زراعة الأسنان لفرع حلوان • 5 عناوين إعلان لتقويم الأطفال • رد على تقييم سلبي بيقول الانتظار طويل" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" />
                        <div className="flex flex-wrap gap-1.5">{['اكتبلي 3 بوستات فيسبوك عن تبييض الأسنان', 'إعلان جوجل لعرض كشف مخفّض', 'رسالة واتساب للمرضى القدام يرجعوا يكشفوا', 'سكريبت فيديو تيك توك 30 ثانية عن الزراعة'].map(x => <button key={x} type="button" onClick={() => setAsk(x)} className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-lg">{x}</button>)}</div>
                        <button type="button" disabled={!!busy || !ask.trim()} onClick={doAsk} className="w-full py-3 rounded-xl bg-gray-900 text-white font-black text-sm disabled:opacity-50">{busy || '✨ اكتبي'}</button>
                        {askRes && <div className="bg-gray-50 rounded-xl p-3 space-y-2"><div className="flex justify-between gap-2"><p className="font-black text-sm">{askRes.title}</p><Copy t={[askRes.text, ...(askRes.items || [])].filter(Boolean).join('\n\n')} /></div><p className="text-sm font-bold text-gray-700 whitespace-pre-line">{askRes.text}</p>{(askRes.items || []).map((t, i) => <Line key={i} t={t} />)}</div>}
                    </Box>}
                </div>
            );
        };

        const ownerOk = u => u && !u.isAnonymous && u.email && !u.email.endsWith('@neweraclinic.app');

        const Admin = ({ cfg }) => {
            const [user, setUser] = useState(undefined);
            const [d, setD] = useState(cfg);
            const [saved, setSaved] = useState(() => JSON.stringify(cfg));
            const [tab, setTab] = useState('overview');
            const [msg, setMsg] = useState('');
            const [saving, setSaving] = useState(false);
            const [err, setErr] = useState('');
            const [openSvc, setOpenSvc] = useState(null);
            // لوحة الموقع لصاحبة الحساب بس (حسابات موظفين السيستم مش بتفتحها حتى لو على نفس الدومين)
            useEffect(() => auth ? auth.onAuthStateChanged(u => setUser(ownerOk(u) ? u : null)) : setUser(null), []);
            const dirty = JSON.stringify(d) !== saved;
            useEffect(() => {
                const h = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
                window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h);
            }, [dirty]);
            const up = (k, v) => setD(p => ({ ...p, [k]: v }));
            const upObj = (k, kk, v) => setD(p => ({ ...p, [k]: { ...(p[k] || {}), [kk]: v } }));
            const upAt = (k, i, v) => setD(p => ({ ...p, [k]: p[k].map((x, j) => j === i ? v : x) }));
            const ds = useDragSort((k, a, b) => setD(p => k === 'order' ? { ...p, order: moveIdx(homeOrder(p), a, b) } : k === 'fields' ? { ...p, booking: { ...bkCfg(p), fields: moveIdx(bkCfg(p).fields, a, b) } } : { ...p, [k]: moveIdx(p[k], a, b) }));
            const setText = (lng, k, v) => setD(p => ({ ...p, texts: { ...p.texts, [lng]: { ...(p.texts[lng] || {}), [k]: v } } }));
            const save = async () => {
                if (saving) return;
                setSaving(true); setMsg('');
                try {
                    const out = { ...d, updatedAt: new Date().toISOString(), updatedBy: (user && user.email) || '' };
                    await db.collection('settings').doc('site').set(out);
                    setD(out); setSaved(JSON.stringify(out)); setMsg('تم الحفظ ✓ والتغييرات ظهرت على الموقع');
                } catch (e) { setMsg('فشل الحفظ: ' + (e.code === 'permission-denied' ? 'الحساب ده مالوش صلاحية' : e.message)); }
                setSaving(false); setTimeout(() => setMsg(''), 4000);
            };
            useEffect(() => {
                const h = e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (dirty) save(); } };
                window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
            });
            const discard = () => { if (confirm('ترجعي لآخر نسخة محفوظة؟ التغييرات اللي متحفظتش هتضيع.')) setD(JSON.parse(saved)); };
            const login = async (e) => { e.preventDefault(); setErr(''); try { await auth.signInWithEmailAndPassword(e.target.em.value.trim(), e.target.pw.value); } catch (x) { setErr(x.code === 'auth/too-many-requests' ? 'محاولات كتير — استني شوية' : 'الإيميل أو الباسورد غلط'); } };
            const resetPw = async (e) => { const em = e.target.form.em.value.trim(); if (!em) { setErr('اكتبي الإيميل الأول'); return; } try { await auth.sendPasswordResetEmail(em); setErr('اتبعت لينك تغيير الباسورد على الإيميل ✓'); } catch (x) { setErr('مقدرناش نبعت اللينك: ' + x.message); } };

            const inp = "w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:border-pharaonic outline-none";
            const card = "bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 space-y-3";
            const H = ({ t, s }) => <div className="mb-1"><h2 className="text-lg font-black text-gray-900">{t}</h2>{s && <p className="text-xs text-gray-500 font-bold mt-0.5">{s}</p>}</div>;
            const sl = (lab, val, min, max, step, set) => <label className="block text-[11px] font-bold text-gray-600">{lab}: {val}<input type="range" min={min} max={max} step={step} value={typeof val === 'string' ? parseFloat(val) : val} onChange={e => set(+e.target.value)} className="w-full accent-[#D4AF37]" /></label>;
            const Toggle = ({ on, set, label, sub }) => <label className="flex items-center justify-between gap-3 py-2 cursor-pointer"><span><span className="block text-sm font-black text-gray-800">{label}</span>{sub && <span className="block text-[11px] text-gray-500 font-bold">{sub}</span>}</span><span onClick={e => { e.preventDefault(); set(!on); }} className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-pharaonic' : 'bg-gray-300'}`}><span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? 'right-0.5' : 'right-[22px]'}`}></span></span></label>;
            const OrderBtns = ({ k, i, n }) => n > 1 ? <Grip g={ds.grip(k, i)} /> : null;

            if (user === undefined) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">...</div>;
            if (!user) return (
                <div dir="rtl" className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                    <form onSubmit={login} className="bg-white rounded-3xl p-7 w-full max-w-sm space-y-3 shadow-2xl">
                        <div className="text-center mb-2"><h1 className="text-2xl font-black text-gray-900">NEW ERA</h1><p className="text-pharaonic text-[10px] font-black tracking-[0.26em]">DENTAL CENTER</p><p className="text-sm font-bold text-gray-500 mt-3">لوحة تحكم الموقع</p></div>
                        <input name="em" type="email" required placeholder="الإيميل" dir="ltr" autoComplete="username" className={inp} />
                        <input name="pw" type="password" required placeholder="الباسورد" dir="ltr" autoComplete="current-password" className={inp} />
                        {err && <p className={`text-sm font-bold ${err.includes('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{err}</p>}
                        <button className="w-full bg-pharaonic text-white font-black py-3 rounded-xl hover:bg-[#B5952F]">دخول</button>
                        <div className="flex justify-between text-xs font-bold"><button type="button" onClick={resetPw} className="text-gray-500 hover:text-pharaonic">نسيتي الباسورد؟</button><a href="/" className="text-gray-500 hover:text-pharaonic">الرجوع للموقع</a></div>
                    </form>
                </div>
            );

            const siteUrl = location.href.split('#')[0];
            const warnings = [
                !d.heroImages.filter(Boolean).length && ['الهيدر من غير صورة خلفية', 'hero'],
                d.services.some(s => !s.image) && ['فيه خدمات من غير صورة', 'services'],
                d.services.some(s => !s.titleEn) && ['فيه خدمات من غير اسم إنجليزي (بتظهر بالعربي في النسخة الإنجليزي)', 'services'],
                !d.whatsapp && ['رقم الواتساب فاضي', 'contact'],
                !(d.seo && d.seo.desc) && ['وصف الموقع لجوجل فاضي', 'seo'],
                !(d.seo && d.seo.titleEn) && ['عنوان الموقع الإنجليزي لجوجل فاضي', 'seo'],
                !(d.hours && d.hours.ar) && ['مواعيد العمل (الفوتر) فاضية', 'contact'],
                d.services.some(s => !s.hidden && !s.descEn) && ['فيه خدمات من غير وصف إنجليزي', 'services']
            ].filter(Boolean);

            return (
                <div dir="rtl" className="min-h-screen bg-gray-50 pb-28">
                    <header className="bg-gray-900 text-white sticky top-0 z-30 shadow-lg">
                        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0"><span className="font-black tracking-tight">NEW ERA</span><span className="text-xs text-gray-400 font-bold hidden sm:inline">لوحة تحكم الموقع</span><span className="text-[10px] text-gray-300 font-bold">v{SITE_VERSION}</span></div>
                            <div className="flex items-center gap-2 text-xs font-bold">
                                <a href={siteUrl} target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">معاينة الموقع ↗</a>
                                <span className="hidden md:inline text-gray-400" dir="ltr">{user.email}</span>
                                <button onClick={() => { if (!dirty || confirm('فيه تغييرات مش محفوظة. تخرجي برضه؟')) auth.signOut(); }} className="text-red-300 hover:text-red-200 px-2">خروج</button>
                            </div>
                        </div>
                    </header>
                    <div className="max-w-6xl mx-auto md:flex md:gap-5 md:px-4 md:pt-5">
                        <nav className="md:w-56 md:shrink-0">
                            <div className="flex md:flex-col gap-1.5 p-3 md:p-0 overflow-x-auto hide-scroll-bar md:sticky md:top-20">
                                {ADMIN_GROUPS.map(([k, n, ic, tabs]) => { const on = tabs.includes(tab); return <button key={k} onClick={() => setTab(on ? tab : tabs[0])} className={`flex items-center gap-2 px-3.5 py-2 md:py-2.5 rounded-xl font-black text-sm whitespace-nowrap text-right transition-colors ${on ? 'bg-pharaonic text-white shadow' : 'bg-white md:bg-transparent text-gray-600 hover:bg-white'}`}><span className="text-base">{ic}</span>{n}</button>; })}
                            </div>
                        </nav>
                        <main className="flex-1 min-w-0 px-3 md:px-0 space-y-3">
                            {(() => { const g = groupOf(tab); return g[3].length > 1 ? <div className="flex gap-1 bg-white border border-gray-100 shadow-sm p-1 rounded-2xl overflow-x-auto hide-scroll-bar">{g[3].map(k => { const t = ADMIN_TABS.find(x => x[0] === k) || [k, k, '']; return <button key={k} type="button" onClick={() => setTab(k)} className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-colors ${tab === k ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}><span>{t[2]}</span>{t[1]}</button>; })}</div> : null; })()}
                            {tab === 'overview' && <AdminOverview d={d} warnings={warnings} go={setTab} />}
                            {tab === 'bookrep' && <BookingReports />}

                            {tab === 'hero' && <><H t="الهيدر والأرقام" s="أول حاجة الزائر بيشوفها. لو حطيتي أكتر من صورة بتتبدل لوحدها كل 5 ثواني." />
                                <div className={card}><p className="font-black text-sm">صور الخلفية</p><ImgList slot={SLOTS.hero} list={d.heroImages} onChange={v => up('heroImages', v)} /></div>
                                <div className={card}><p className="font-black text-sm">ضبط الصورة</p>
                                    <div className="relative h-36 rounded-xl overflow-hidden bg-gray-900"><HeroBG imgs={d.heroImages.filter(Boolean).slice(0, 1)} x={d.heroX} y={d.heroY} dim={d.heroDim} zoom={d.heroZoom || 100} /><div className="absolute inset-0 flex items-center justify-center text-white font-black text-lg drop-shadow">{(d.texts.ar || {}).heroTitle || t.ar.heroTitle}</div></div>
                                    <div className="grid sm:grid-cols-2 gap-x-4">{sl('وضوح الصورة', d.heroDim + '%', 20, 100, 1, v => up('heroDim', v))}{sl('تكبير', (d.heroZoom || 100) + '%', 100, 200, 5, v => up('heroZoom', v))}{sl('أفقي', d.heroX + '%', 0, 100, 1, v => up('heroX', v))}{sl('رأسي', d.heroY + '%', 0, 100, 1, v => up('heroY', v))}</div>
                                </div>
                                <div className={card}><div className="flex items-center justify-between gap-2"><p className="font-black text-sm">🔢 الأرقام اللي في الهيدر</p><Toggle on={d.show.counters !== false} set={v => upObj('show', 'counters', v)} label="إظهار" /></div><p className="text-xs font-bold text-gray-400 -mt-1">العدّاد اللي تحت العنوان (زي: +10,000 حالة).</p>
                                    <div className="space-y-2">{d.counters.map((c, i) => <div key={i} {...ds.item('counters', i)} className="bg-gray-50 rounded-xl p-3 space-y-2">
                                    <div className="flex items-center justify-between"><span className="font-black text-pharaonic" dir="ltr">+{Number(c.n || 0).toLocaleString('en-US')}</span><OrderBtns k="counters" i={i} n={d.counters.length} /></div>
                                    <div className="grid sm:grid-cols-3 gap-2"><input type="number" value={c.n} onChange={e => upAt('counters', i, { ...c, n: +e.target.value })} className={inp} placeholder="الرقم" />
                                        <input value={c.ar} onChange={e => upAt('counters', i, { ...c, ar: e.target.value })} className={inp} placeholder="العنوان بالعربي" />
                                        <input value={c.en} onChange={e => upAt('counters', i, { ...c, en: e.target.value })} className={inp} dir="ltr" placeholder="English label" /></div>
                                    <button onClick={() => up('counters', d.counters.filter((_, j) => j !== i))} className="text-red-500 text-xs font-black">حذف</button>
                                </div>)}<button onClick={() => up('counters', [...d.counters, { n: 100, ar: '', en: '' }])} className="font-black text-pharaonic text-sm">+ إضافة رقم</button></div></div></>}


                            {tab === 'services' && <><H t="الخدمات" s={d.services.length + ' خدمة • دوسي على الخدمة عشان تفتحيها'} />
                                {d.services.map((s, i) => { const open = openSvc === s.id; return <div key={s.id} {...ds.item('services', i)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50" onClick={() => setOpenSvc(open ? null : s.id)}>
                                        <img src={s.image || undefined} className="w-12 h-12 rounded-xl object-cover bg-gray-200 shrink-0" />
                                        <div className="min-w-0 flex-1"><p className="font-black text-sm text-gray-900 truncate">{s.title || 'خدمة بدون اسم'}</p><p className="text-[11px] text-gray-400 font-bold truncate" dir="ltr">{s.titleEn || '— no English title'}</p></div>
                                        {s.hidden && <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">مخفية</span>}
                                        <OrderBtns k="services" i={i} n={d.services.length} />
                                        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
                                    </div>
                                    {open && <div className="p-4 pt-1 space-y-3 border-t border-gray-100">
                                        <div className="grid sm:grid-cols-2 gap-2"><input value={s.title} onChange={e => upAt('services', i, { ...s, title: e.target.value })} className={inp + ' font-black'} placeholder="اسم الخدمة" />
                                            <input value={s.titleEn || ''} onChange={e => upAt('services', i, { ...s, titleEn: e.target.value })} className={inp + ' font-black'} dir="ltr" placeholder="Service name (English)" /></div>
                                        <textarea value={s.desc} rows="3" onChange={e => upAt('services', i, { ...s, desc: e.target.value })} className={inp} placeholder="الوصف" />
                                        <textarea value={s.descEn || ''} rows="3" dir="ltr" onChange={e => upAt('services', i, { ...s, descEn: e.target.value })} className={inp} placeholder="Description (English)" />
                                        <p className="text-xs font-black">تفاصيل الخدمة (بتظهر في صفحة الخدمة تحت الوصف) <span className="text-[10px] text-gray-400">— سطر يبدأ بـ ## = عنوان فرعي، وسطر فاضي بين الفقرات</span></p>
                                        <div className="grid md:grid-cols-2 gap-2"><textarea value={s.details || ''} rows="7" onChange={e => upAt('services', i, { ...s, details: e.target.value })} className={inp + ' leading-7'} placeholder={'## مين محتاج الخدمة دي؟\n...\n\n## خطوات العلاج\n...'} /><textarea value={s.detailsEn || ''} rows="7" dir="ltr" onChange={e => upAt('services', i, { ...s, detailsEn: e.target.value })} className={inp + ' leading-7'} placeholder={'## Who needs it?\n...'} /></div>
                                        <div className="bg-gray-50 rounded-xl p-3 space-y-2"><p className="text-xs font-black flex items-center justify-between gap-2"><span>🔎 صفحة الخدمة على جوجل</span><a href={'/' + seoSvcSlug(s)} target="_blank" rel="noreferrer" className="text-pharaonic text-[11px]" dir="ltr">/{seoSvcSlug(s)} ↗</a></p>
                                            <label className="block text-[11px] font-bold text-gray-600">عنوان الصفحة في جوجل (اختياري — لو فاضي بيتعمل لوحده بالكلمة والأسعار) {seoCnt(s.seoTitle, 30, 65)}<input value={s.seoTitle || ''} onChange={e => upAt('services', i, { ...s, seoTitle: e.target.value })} className={inp + ' mt-1'} /></label>
                                            <label className="block text-[11px] font-bold text-gray-600">وصف الصفحة في جوجل (اختياري) {seoCnt(s.seoDesc, 110, 160)}<textarea rows="2" value={s.seoDesc || ''} onChange={e => upAt('services', i, { ...s, seoDesc: e.target.value })} className={inp + ' mt-1'} /></label>
                                            <label className="block text-[11px] font-bold text-gray-600">رابط الصفحة بالإنجليزي (اختياري) <span className="text-amber-600">— متغيّريهوش لو الصفحة ظاهرة على جوجل بالفعل</span><input value={s.slug || ''} dir="ltr" onChange={e => upAt('services', i, { ...s, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className={inp + ' mt-1'} placeholder={seoSvcSlug({ ...s, slug: '' })} /></label>
                                        </div>
                                        <p className="text-xs font-black">الصورة الرئيسية</p>
                                        <ImgField slot={SLOTS.svc} value={s.image} onChange={v => upAt('services', i, { ...s, image: v })} />
                                        <div className="grid grid-cols-3 gap-2">{sl('تكبير', s.zoom || 1, 1, 2.5, 0.05, v => upAt('services', i, { ...s, zoom: v }))}{sl('أفقي', s.x ?? 50, 0, 100, 1, v => upAt('services', i, { ...s, x: v }))}{sl('رأسي', s.y ?? 50, 0, 100, 1, v => upAt('services', i, { ...s, y: v }))}</div>
                                        <p className="text-xs font-black">صور إضافية في صفحة الخدمة</p>
                                        <ImgList slot={SLOTS.svcx} list={s.gallery || []} onChange={v => upAt('services', i, { ...s, gallery: v })} />
                                        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                                            <Toggle on={!s.hidden} set={v => upAt('services', i, { ...s, hidden: !v })} label="ظاهرة على الموقع" />
                                            <button className="text-red-500 text-xs font-black" onClick={() => confirm('حذف الخدمة نهائياً؟') && up('services', d.services.filter((_, j) => j !== i))}>حذف الخدمة</button>
                                        </div>
                                    </div>}
                                </div>; })}
                                <button onClick={() => { const id = 's' + Date.now(); up('services', [...d.services, { id, title: 'خدمة جديدة', titleEn: '', desc: '', descEn: '', image: '', gallery: [] }]); setOpenSvc(id); }} className="font-black text-pharaonic text-sm">+ إضافة خدمة</button></>}

                            {tab === 'gallery' && <><H t="المعرض" s="صور المركز اللي بتتحرك لوحدها في الصفحة الرئيسية." />
                                <div className={card}><div className="grid sm:grid-cols-2 gap-2"><input value={d.galleryTitle} onChange={e => up('galleryTitle', e.target.value)} className={inp + ' font-black'} placeholder="عنوان المعرض" /><input value={d.galleryTitleEn || ''} onChange={e => up('galleryTitleEn', e.target.value)} className={inp + ' font-black'} dir="ltr" placeholder="Gallery title (English)" /></div>
                                    <div className="border-t border-gray-100 pt-3">{sl('سرعة الحركة', (d.gallerySpeed ?? 40) === 0 ? 'واقف' : (d.gallerySpeed ?? 40), 0, 150, 5, v => up('gallerySpeed', v))}
                                        <p className="text-[10px] text-gray-400 font-bold">0 = المعرض واقف (الزائر بيحركه بالأسهم أو بإيده). الحركة بتلف بلا نهاية وبتقف لوحدها لما الزائر يلمس صورة.</p></div>
                                    <p className="font-black text-sm pt-2">الصور (رتبيها بالسحب من ⋮⋮)</p>
                                    <ImgList slot={SLOTS.gal} list={d.gallery} onChange={v => up('gallery', v)} /></div></>}

                            {tab === 'reviews' && <><H t="آراء العملاء" s={d.reviews.filter(r => !r.hidden).length + ' رأي ظاهر من ' + d.reviews.length} />
                                <div className={card}><Toggle on={d.googleReviews !== false} set={v => up('googleReviews', v)} label="علامة Google على الكروت" sub="شغّليها بس لو الآراء دي فعلاً من صفحتكم على جوجل" /></div>
                                {d.reviews.map((r, i) => <div key={i} {...ds.item('reviews', i)} className={card + (r.hidden ? ' opacity-60' : '')}>
                                    <div className="flex items-center gap-2"><input value={r.name} onChange={e => upAt('reviews', i, { ...r, name: e.target.value })} className={inp + ' font-black'} placeholder="اسم العميل" /><OrderBtns k="reviews" i={i} n={d.reviews.length} /></div>
                                    <textarea value={r.text} rows="2" onChange={e => upAt('reviews', i, { ...r, text: e.target.value })} className={inp} placeholder="الرأي" />
                                    <div className="grid sm:grid-cols-3 gap-2"><input value={r.nameEn || ''} dir="ltr" onChange={e => upAt('reviews', i, { ...r, nameEn: e.target.value })} className={inp} placeholder="Name (English)" /><textarea value={r.textEn || ''} rows="2" dir="ltr" onChange={e => upAt('reviews', i, { ...r, textEn: e.target.value })} className={inp + ' sm:col-span-2'} placeholder="Review (English translation)" /></div>
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <span className="flex gap-0.5" dir="ltr">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" onClick={() => upAt('reviews', i, { ...r, stars: n })} className={`text-xl leading-none ${n <= (r.stars || 5) ? 'text-[#FBBC04]' : 'text-gray-300'}`}>★</button>)}</span>
                                        <span className="flex items-center gap-3"><button onClick={() => upAt('reviews', i, { ...r, hidden: !r.hidden })} className="text-xs font-black text-gray-600">{r.hidden ? 'إظهار' : 'إخفاء'}</button>
                                            <button onClick={() => confirm('حذف الرأي؟') && up('reviews', d.reviews.filter((_, j) => j !== i))} className="text-red-500 text-xs font-black">حذف</button></span>
                                    </div>
                                </div>)}
                                <button onClick={() => up('reviews', [{ name: '', text: '', stars: 5 }, ...d.reviews])} className="font-black text-pharaonic text-sm">+ إضافة رأي</button></>}

                            {tab === 'texts' && <><H t="النصوص" s="كل نص بالعربي والإنجليزي. سيبي الخانة زي ما هي لو مش عايزة تغيّريها." />
                                {TEXT_FIELDS.map(([k, n]) => <div key={k} className={card}>
                                    <div className="flex items-center justify-between"><p className="font-black text-sm">{n}</p>{(((d.texts.ar || {})[k] ?? null) !== null || ((d.texts.en || {})[k] ?? null) !== null) && <button onClick={() => setD(p => { const tx = { ar: { ...p.texts.ar }, en: { ...p.texts.en } }; delete tx.ar[k]; delete tx.en[k]; return { ...p, texts: tx }; })} className="text-[11px] font-bold text-gray-400 hover:text-pharaonic">رجوع للنص الأصلي</button>}</div>
                                    <div className="grid md:grid-cols-2 gap-2">{['ar', 'en'].map(lng => <textarea key={lng} rows="2" dir={lng === 'ar' ? 'rtl' : 'ltr'} value={(d.texts[lng] || {})[k] ?? t[lng][k] ?? ''} onChange={e => setText(lng, k, e.target.value)} className={inp} />)}</div>
                                </div>)}</>}

                            {tab === 'sections' && <><H t="الأقسام والإعلان" s="اخفي أو اظهري أي قسم من غير ما تمسحي محتواه." />
                                <div className={card}><p className="font-black text-sm">شريط الإعلان (عروض / مواعيد خاصة)</p>
                                    <Toggle on={!!d.announce.on} set={v => upObj('announce', 'on', v)} label="إظهار الشريط فوق الموقع" />
                                    <div className="grid md:grid-cols-2 gap-2"><input value={d.announce.ar || ''} onChange={e => upObj('announce', 'ar', e.target.value)} className={inp} placeholder="مثال: خصم 20% على التبييض لحد آخر الشهر" /><input value={d.announce.en || ''} dir="ltr" onChange={e => upObj('announce', 'en', e.target.value)} className={inp} placeholder="English text (optional)" /></div>
                                    <input value={d.announce.link || ''} dir="ltr" onChange={e => upObj('announce', 'link', e.target.value)} className={inp} placeholder="رابط (اختياري) — لو فاضي بيودي على الحجز" />
                                    {d.announce.on && (d.announce.ar || d.announce.en) && <div className="bg-pharaonic text-white text-center text-sm font-black py-2 rounded-lg">{d.announce.ar || d.announce.en}</div>}
                                </div>
                                <div className={card}><p className="font-black text-sm">ترتيب الأقسام في الصفحة الرئيسية</p><p className="text-xs font-bold text-gray-400 -mt-1">اسحبي أي قسم من ⋮⋮ وحطيه في المكان اللي عايزاه — والمفتاح عشان تخفيه.</p>
                                    <div className="space-y-1.5">{homeOrder(d).map((k, i, arr) => { const on = d.show[k] !== false; return (
                                        <div key={k} {...ds.item('order', i)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${on ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                                            <Grip g={ds.grip('order', i)} />
                                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                                            <span className="flex-1 font-black text-sm text-gray-800">{SECTION_NAMES[k] || k}</span>
                                            <button type="button" onClick={() => upObj('show', k, !on)} className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${on ? 'bg-emerald-500' : 'bg-gray-300'}`} title={on ? 'إخفاء' : 'إظهار'}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'right-0.5' : 'right-[22px]'}`} /></button>
                                        </div>); })}</div>
                                    {d.order && d.order.length > 0 && <button type="button" onClick={() => up('order', [])} className="text-xs font-black text-gray-500">↺ رجّعي الترتيب الافتراضي</button>}
                                </div>
                                <div className={card + ' divide-y divide-gray-100'}><p className="font-black text-sm pb-2">أجزاء تانية</p>{Object.entries(SECTION_NAMES).filter(([k]) => k !== 'announce' && !HOME_ORDER.includes(k)).map(([k, n]) => <Toggle key={k} on={d.show[k] !== false} set={v => upObj('show', k, v)} label={n} />)}</div></>}

                            {tab === 'custom' && <><H t="أقسام جديدة" s="اعملي أي قسم جديد للموقع بنفسك (نص وصورة، كروت، معرض، أسئلة، فيديو، شريط حجز) واختاري مكانه." />
                                <CustomSectionsAdmin list={d.customSections || []} onChange={v => up('customSections', v)} inp={inp} card={card} /></>}

                            {tab === 'contact' && <><H t="التواصل" s="الأرقام والواتساب والسوشيال ومواعيد العمل." />
                                <div className={card}><p className="font-black text-sm">أرقام التليفون (الفوتر)</p>
                                    {d.phones.map((p, i) => <div key={i} className="flex gap-2"><input value={p} dir="ltr" onChange={e => upAt('phones', i, e.target.value)} className={inp} /><button onClick={() => up('phones', d.phones.filter((_, j) => j !== i))} className="text-red-500 font-black px-2">✕</button></div>)}
                                    <button onClick={() => up('phones', [...d.phones, ''])} className="text-sm font-black text-pharaonic">+ إضافة رقم</button></div>
                                <div className={card}><p className="font-black text-sm">رقم واتساب (بالكود الدولي، مثال 201121593393)</p>
                                    <input value={d.whatsapp} dir="ltr" onChange={e => up('whatsapp', e.target.value.replace(/[^\d]/g, ''))} className={inp} />
                                    {d.whatsapp && <a href={'https://wa.me/' + d.whatsapp} target="_blank" rel="noreferrer" className="text-xs font-black text-green-600">جرّبي الرقم ↗</a>}</div>
                                <div className={card}><p className="font-black text-sm">مواعيد العمل (بتظهر في الفوتر)</p>
                                    <div className="grid md:grid-cols-2 gap-2"><input value={d.hours.ar || ''} onChange={e => upObj('hours', 'ar', e.target.value)} className={inp} placeholder="يومياً من 4 العصر لـ 10 بالليل" /><input value={d.hours.en || ''} dir="ltr" onChange={e => upObj('hours', 'en', e.target.value)} className={inp} placeholder="Daily 4 PM – 10 PM" /></div></div>
                                <div className={card}><p className="font-black text-sm">روابط السوشيال ميديا (اللي فاضي مش بيظهر)</p>
                                    {[['facebook', 'فيسبوك'], ['instagram', 'إنستجرام'], ['youtube', 'يوتيوب'], ['tiktok', 'تيك توك']].map(([k, n]) => <label key={k} className="block text-xs font-bold text-gray-600">{n}<input value={d.socials[k] || ''} dir="ltr" onChange={e => upObj('socials', k, e.target.value.trim())} className={inp + ' mt-1'} placeholder="https://..." /></label>)}</div>
                                <BranchEnAdmin d={d} setD={setD} inp={inp} card={card} />
                                <p className="text-[11px] text-gray-500 font-bold px-1">عناوين الفروع ولينكات الخريطة بتتعدل من السيستم (الإعدادات ← الفروع)، وبتظهر هنا تلقائي.</p></>}

                            {tab === 'marketer' && <><H t="🚀 المسوّق الذكي" s="جاوبي على كام سؤال، وهو يعملك خطة الظهور على جوجل والإعلانات والمحتوى — ويطبّق اللي يخص الموقع بدوسة." /><Marketer d={d} setD={setD} go={setTab} user={user} /></>}
                            {tab === 'seo' && <><H t="الظهور على جوجل (SEO)" s="العنوان والوصف، صورة المشاركة، ربط Search Console وأناليتكس والبيكسل، وكل صفحات الموقع." /><SeoAdmin d={d} setD={setD} inp={inp} card={card} go={setTab} /></>}
                            {tab === 'faqs' && <><H t="❓ الأسئلة الشائعة" s="كل سؤال بالعربي والإنجليزي — بيظهر في الموقع وفي صفحات جوجل. التعديل بيتحفظ لكل سؤال لوحده." /><FaqAdmin inp={inp} card={card} /></>}
                            {tab === 'blog' && <><H t="📝 المدونة" s="اكتبي مقالات جديدة تنزل على الموقع وجوجل يقراها — مقال كل أسبوع بيفرق جداً في الظهور." /><BlogAdmin d={d} setD={setD} inp={inp} card={card} /></>}

                            {tab === 'backup' && <><H t="نسخة احتياطية" s="نزّلي نسخة من كل إعدادات الموقع على جهازك قبل أي تعديل كبير." />
                                <div className={card}>
                                    <button onClick={() => { const b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'new-era-site-' + new Date().toLocaleDateString('en-CA') + '.json'; a.click(); }} className="w-full bg-gray-900 text-white font-black py-3 rounded-xl">⬇ تنزيل نسخة احتياطية</button>
                                    <label className="block w-full text-center bg-gray-100 font-black py-3 rounded-xl cursor-pointer">⬆ استرجاع من نسخة<input type="file" accept="application/json" hidden onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; f.text().then(x => { try { const j = JSON.parse(x); if (!j || !Array.isArray(j.services)) throw 0; setD(mergeCfg(j)); alert('اتحمّلت النسخة. راجعيها ودوسي "حفظ" عشان تنزل على الموقع.'); } catch (z) { alert('الملف ده مش نسخة احتياطية صحيحة'); } }); }} /></label>
                                    <button onClick={() => confirm('ترجعي كل إعدادات الموقع للأصل؟ (مش هيتحفظ غير لما تدوسي حفظ)') && setD(mergeCfg({}))} className="w-full text-red-500 font-black py-2 text-sm">رجوع للإعدادات الأصلية</button>
                                    {d.updatedAt && <p className="text-[11px] text-gray-400 font-bold text-center">آخر حفظ: {new Date(d.updatedAt).toLocaleString('ar-EG')}</p>}
                                </div></>}

                            {tab === 'booking' && (() => { const bk = bkCfg(d); const setBk = patch => setD(p => ({ ...p, booking: { ...bkCfg(p), ...patch } })); const setF = (i, patch) => setBk({ fields: bk.fields.map((x, j) => j === i ? { ...x, ...patch } : x) }); const mvF = (i, dir) => { const a = [...bk.fields]; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setBk({ fields: a }); }; const setBT = (lng, k, v) => setBk({ texts: { ...bk.texts, [lng]: { ...(bk.texts[lng] || {}), [k]: v } } });
                                return <><H t="الحجز والاستشارة" s={'كارت الحجز جوه الموقع. اللينك المباشر للحجز (ابعتيه للمرضى): ' + location.href.split('#')[0] + '#book'} />
                                <div className={card}>
                                    <div className="flex flex-wrap gap-2"><a href={location.href.split('#')[0] + '#book'} target="_blank" rel="noreferrer" className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-black">افتح صفحة الحجز ↗</a>
                                        <button type="button" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(location.href.split('#')[0] + '#book'); alert('اتنسخ اللينك'); }} className="bg-gray-100 px-3 py-2 rounded-lg text-xs font-black">نسخ لينك الحجز</button>
                                        <button type="button" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(location.href.split('#')[0] + '#consult'); alert('اتنسخ لينك الاستشارة'); }} className="bg-gray-100 px-3 py-2 rounded-lg text-xs font-black">نسخ لينك الاستشارة</button></div>
                                    <Toggle on={bk.showServices} set={v => setBk({ showServices: v })} label="خانة الخدمة" sub="المريض يختار الخدمة اللي محتاجها" />
                                    {bk.showServices && <Toggle on={bk.serviceRequired} set={v => setBk({ serviceRequired: v })} label="الخدمة إجبارية" />}
                                    <Toggle on={bk.showCost} set={v => setBk({ showCost: v })} label="إظهار الأسعار والتكلفة المتوقعة" />
                                    <Toggle on={bk.showMap} set={v => setBk({ showMap: v })} label="خريطة الفرع" />
                                </div>
                                <BkBranchesAdmin bk={bk} setBk={setBk} card={card} />
                                <div className={card}><p className="font-black text-sm">خانات البيانات</p><p className="text-[11px] text-gray-500 font-bold">الاسم والموبايل أساسيين. ضيفي أي خانة (السن، ملاحظات…) وهتظهر مع الحجز في السيستم.</p>
                                    {bk.fields.map((fl, i) => <div key={fl.id} {...ds.item('fields', i)} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-white">
                                        <div className="flex items-center gap-2"><Grip g={ds.grip('fields', i)} />
                                            <span className="text-xs font-black text-gray-800 flex-1">{fl.label || 'خانة جديدة'}{fl.system ? <span className="text-[10px] text-gray-400"> (أساسية)</span> : ''}</span>
                                            {!fl.system && <button type="button" onClick={() => confirm('حذف الخانة؟') && setBk({ fields: bk.fields.filter((_, j) => j !== i) })} className="text-red-500 text-xs font-black">حذف</button>}</div>
                                        <div className="grid sm:grid-cols-2 gap-2"><input value={fl.label || ''} onChange={e => setF(i, { label: e.target.value })} className={inp} placeholder="اسم الخانة" /><input value={fl.labelEn || ''} dir="ltr" onChange={e => setF(i, { labelEn: e.target.value })} className={inp} placeholder="Label (English)" /></div>
                                        <input value={fl.placeholder || ''} onChange={e => setF(i, { placeholder: e.target.value })} className={inp} placeholder="مثال يظهر جوه الخانة (اختياري)" />
                                        {!fl.system && <div className="flex flex-wrap gap-2 items-center">
                                            <select value={fl.type || 'text'} onChange={e => setF(i, { type: e.target.value })} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"><option value="text">نص</option><option value="number">رقم</option><option value="textarea">نص طويل</option><option value="select">اختيارات</option></select>
                                            <label className="flex items-center gap-1 text-xs font-bold"><input type="checkbox" checked={!!fl.required} onChange={e => setF(i, { required: e.target.checked })} /> إجبارية</label>
                                            <label className="flex items-center gap-1 text-xs font-bold"><input type="checkbox" checked={!!fl.hidden} onChange={e => setF(i, { hidden: e.target.checked })} /> مخفية</label></div>}
                                        {fl.type === 'select' && <input value={fl.options || ''} onChange={e => setF(i, { options: e.target.value })} className={inp} placeholder="الاختيارات بينها فاصلة: ذكر، أنثى" />}
                                    </div>)}
                                    <button type="button" onClick={() => setBk({ fields: [...bk.fields, { id: 'f' + Date.now(), label: '', type: 'text', required: false }] })} className="text-sm font-black text-pharaonic">+ إضافة خانة</button>
                                </div>
                                <BkServicesAdmin card={card} inp={inp} />
                                <div className={card}><p className="font-black text-sm">نصوص كارت الحجز</p>
                                    {Object.entries(BK_TEXTS).map(([k, [ar, en]]) => <div key={k} className="grid md:grid-cols-2 gap-2"><input value={(bk.texts.ar || {})[k] ?? ''} placeholder={ar} onChange={e => setBT('ar', k, e.target.value)} className={inp} /><input value={(bk.texts.en || {})[k] ?? ''} placeholder={en} dir="ltr" onChange={e => setBT('en', k, e.target.value)} className={inp} /></div>)}
                                    <p className="text-[10px] text-gray-400 font-bold">الخانة الفاضية بتاخد النص الرمادي اللي جواها.</p></div>
                                <div className={card}><p className="font-black text-sm">قسم "احجز استشارتك أونلاين" في الصفحة الرئيسية</p>
                                    <Toggle on={d.show.consult !== false} set={v => upObj('show', 'consult', v)} label="إظهار القسم" />
                                    {[['consultTitle', 'العنوان'], ['consultText', 'النص'], ['consultBtn', 'الزرار']].map(([k, n]) => <div key={k}><p className="text-[11px] font-bold text-gray-500 mb-1">{n}</p><div className="grid md:grid-cols-2 gap-2">{['ar', 'en'].map(lng => <textarea key={lng} rows={k === 'consultText' ? 3 : 1} dir={lng === 'ar' ? 'rtl' : 'ltr'} value={(d.texts[lng] || {})[k] ?? t[lng][k] ?? ''} onChange={e => setText(lng, k, e.target.value)} className={inp} />)}</div></div>)}
                                    <p className="text-[11px] font-bold text-gray-500">الصورة</p>
                                    <ImgField slot={SLOTS.consult} value={d.consultImg || ''} onChange={v => up('consultImg', v)} onRemove={() => up('consultImg', '')} />
                                </div></>; })()}

                            {tab === 'general' && <><H t="إعدادات" />

                                <div className={card}><p className="font-black text-sm">مفتاح رفع الصور (ImgBB) — اختياري</p><p className="text-[11px] text-gray-500 font-bold">لو Firebase Storage مش متفعّل، الصور بتترفع على ImgBB المجاني. المفتاح بيتحفظ على الجهاز ده بس.</p>
                                    <input defaultValue={localStorage.getItem('imgbbKey') || ''} dir="ltr" onChange={e => localStorage.setItem('imgbbKey', e.target.value.trim())} className={inp} /></div>
                                <div className={card}><p className="font-black text-sm">باسورد اللوحة</p><button onClick={() => auth.sendPasswordResetEmail(user.email).then(() => alert('اتبعت لينك تغيير الباسورد على ' + user.email)).catch(e => alert(e.message))} className="bg-gray-100 font-black text-sm px-4 py-2 rounded-xl">ابعتيلي لينك تغيير الباسورد</button></div></>}
                        </main>
                    </div>
                    <div className={`fixed bottom-0 inset-x-0 border-t p-3 z-40 transition-colors ${dirty ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
                        <div className="max-w-6xl mx-auto flex items-center gap-3">
                            <button onClick={save} disabled={!dirty || saving} className="flex-1 md:flex-none md:px-10 bg-pharaonic text-white font-black py-3 rounded-xl disabled:opacity-40">{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</button>
                            {dirty && <button onClick={discard} className="text-sm font-black text-gray-600 px-2">تراجع</button>}
                            <span className={`text-xs font-bold ${msg.startsWith('فشل') ? 'text-red-600' : msg ? 'text-emerald-600' : 'text-amber-700'}`}>{msg || (dirty ? 'فيه تغييرات مش محفوظة' : '')}</span>
                        </div>
                    </div>
                </div>
            );
        };

        // ===== 📈 تقارير الحجوزات والاستشارات اللي جت من الموقع =====
        const BookingReports = () => {
            const [days, setDays] = useState(30);
            const [apps, setApps] = useState(null), [cons, setCons] = useState(null), [brs, setBrs] = useState([]);
            const from = (() => { const x = new Date(); x.setDate(x.getDate() - days + 1); return x.toLocaleDateString('en-CA'); })();
            useEffect(() => { if (!db) return; const u = db.collection('branches').onSnapshot(s => setBrs(s.docs.map(x => ({ id: x.id, ...x.data() }))), () => {}); return u; }, []);
            useEffect(() => {
                if (!db) return; setApps(null); setCons(null);
                const back = (() => { const x = new Date(); x.setDate(x.getDate() - days - 60); return x.toLocaleDateString('en-CA'); })();
                const u1 = db.collection('appointments').where('date', '>=', back).onSnapshot(s => setApps(s.docs.map(x => ({ id: x.id, ...x.data() })).filter(a => a.source === 'online' && (a.createdAt || a.date || '').slice(0, 10) >= from)), () => setApps([]));
                const u2 = db.collection('consults').where('createdAt', '>=', from).onSnapshot(s => setCons(s.docs.map(x => ({ id: x.id, ...x.data() }))), () => setCons([]));
                return () => { u1(); u2(); };
            }, [days]);
            const bn = id => (brs.find(b => b.id === id) || {}).name || '—';
            const A = apps || [], C = cons || [];
            const cnt = (arr, f) => { const m = {}; arr.forEach(x => { const k = f(x) || '—'; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
            const att = A.filter(a => a.status === 'arrived' || a.status === 'done').length, can = A.filter(a => a.status === 'canceled').length, pend = A.filter(a => a.needsSchedule).length;
            const answered = C.filter(c => (c.replies || []).length || c.status === 'answered').length;
            const rt = C.map(c => { const r = (c.replies || [])[0]; return r && r.at && c.createdAt ? (new Date(r.at) - new Date(c.createdAt)) / 36e5 : null; }).filter(x => x != null);
            const avgRt = rt.length ? rt.reduce((a, b) => a + b, 0) / rt.length : null;
            const dayList = Array.from({ length: Math.min(days, 31) }, (_, i) => { const x = new Date(); x.setDate(x.getDate() - (Math.min(days, 31) - 1 - i)); return x.toLocaleDateString('en-CA'); });
            const perDay = dayList.map(d => [d, A.filter(a => (a.createdAt || a.date || '').slice(0, 10) === d).length, C.filter(c => (c.createdAt || '').slice(0, 10) === d).length]);
            const mx = Math.max(1, ...perDay.map(x => x[1] + x[2]));
            const Stat = ({ l, v, s, c = 'text-gray-900' }) => <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"><p className="text-[11px] font-black text-gray-400">{l}</p><p className={`text-2xl font-black mt-1 ${c}`}>{v}</p>{s && <p className="text-[11px] font-bold text-gray-500 mt-0.5">{s}</p>}</div>;
            const Bars = ({ t, rows, total }) => <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2"><p className="font-black text-sm text-gray-900">{t}</p>{!rows.length ? <p className="text-xs font-bold text-gray-400">مفيش بيانات</p> : rows.slice(0, 8).map(([k, v]) => <div key={k} className="space-y-0.5"><div className="flex justify-between text-xs font-bold text-gray-700"><span className="truncate">{k}</span><span>{v} <span className="text-gray-400">({Math.round(v / Math.max(1, total) * 100)}%)</span></span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-pharaonic rounded-full" style={{ width: (v / Math.max(1, rows[0][1]) * 100) + '%' }} /></div></div>)}</div>;
            const loading = apps === null || cons === null;
            return <>
                <div className="flex items-end justify-between gap-2 flex-wrap"><div><h2 className="text-lg font-black text-gray-900">📈 تقارير الحجوزات والاستشارات</h2><p className="text-xs text-gray-500 font-bold">اللي جه من الموقع وصفحة الحجز</p></div>
                    <div className="flex gap-1 bg-white border border-gray-100 p-1 rounded-xl">{[[7, '7 أيام'], [30, '30 يوم'], [90, '3 شهور']].map(([v, l]) => <button key={v} type="button" onClick={() => setDays(v)} className={`px-3 py-1.5 rounded-lg text-xs font-black ${days === v ? 'bg-pharaonic text-white' : 'text-gray-500'}`}>{l}</button>)}</div></div>
                {loading ? <p className="text-sm font-bold text-gray-400 p-6 text-center">جاري التحميل...</p> : <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Stat l="حجوزات أونلاين" v={A.length} s={A.length ? 'متوسط ' + (A.length / days).toFixed(1) + ' في اليوم' : ''} />
                        <Stat l="حضروا" v={A.length ? Math.round(att / A.length * 100) + '%' : '—'} s={att + ' حجز'} c="text-emerald-600" />
                        <Stat l="اتلغوا" v={A.length ? Math.round(can / A.length * 100) + '%' : '—'} s={can + ' حجز' + (pend ? ' • ' + pend + ' محتاج ميعاد' : '')} c="text-red-500" />
                        <Stat l="استشارات" v={C.length} s={C.length ? Math.round(answered / C.length * 100) + '% اترد عليها' + (avgRt != null ? ' • الرد في ' + (avgRt < 1 ? Math.round(avgRt * 60) + ' دقيقة' : avgRt.toFixed(1) + ' ساعة') : '') : ''} />
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"><div className="flex justify-between items-center mb-3"><p className="font-black text-sm text-gray-900">كل يوم</p><div className="flex gap-3 text-[11px] font-bold text-gray-500"><span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-pharaonic align-middle ml-1" />حجوزات</span><span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-gray-800 align-middle ml-1" />استشارات</span></div></div>
                        <div className="flex items-end gap-[3px] h-32" dir="ltr">{perDay.map(([d, a, c]) => <div key={d} className="flex-1 h-full flex flex-col justify-end min-w-0 group relative" title={d + ': ' + a + ' حجز، ' + c + ' استشارة'}><div className="bg-gray-800 rounded-t-sm" style={{ height: (c / mx * 100) + '%' }} /><div className="bg-pharaonic" style={{ height: (a / mx * 100) + '%', borderRadius: c ? 0 : '2px 2px 0 0' }} /></div>)}</div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1" dir="ltr"><span>{dayList[0].slice(5)}</span><span>{dayList[dayList.length - 1].slice(5)}</span></div>{days > 31 && <p className="text-[10px] font-bold text-gray-400">الرسم بيعرض آخر 31 يوم.</p>}</div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Bars t="🏥 حسب الفرع" rows={cnt(A, a => bn(a.branchId))} total={A.length} />
                        <Bars t="🦷 حسب الخدمة" rows={cnt(A, a => a.service)} total={A.length} />
                        <Bars t="🕐 الحجز بيتعمل الساعة كام" rows={cnt(A.filter(a => a.createdAt), a => { const h = new Date(a.createdAt).getHours(); return (h % 12 || 12) + (h < 12 ? ' ص' : ' م'); })} total={A.length} />
                        <Bars t="💬 مواضيع الاستشارات" rows={cnt(C, c => c.topic)} total={C.length} />
                    </div>
                    <p className="text-[11px] font-bold text-gray-400">التفاصيل والتحكم في الحجوزات نفسها من السيستم.</p>
                </>}
            </>;
        };

        // نظرة عامة: حجوزات الموقع + تنبيهات
        const AdminOverview = ({ d, warnings, go }) => {
            const [apps, setApps] = useState(null);
            useEffect(() => {
                if (!db) return;
                const from = new Date(); from.setDate(from.getDate() - 30);
                return db.collection('appointments').where('date', '>=', from.toLocaleDateString('en-CA')).onSnapshot(
                    s => setApps(s.docs.map(x => ({ id: x.id, ...x.data() })).filter(a => a.source === 'online')), () => setApps([]));
            }, []);
            const today = new Date().toLocaleDateString('en-CA'), wk = (() => { const x = new Date(); x.setDate(x.getDate() - 6); return x.toLocaleDateString('en-CA'); })();
            const made = a => (a.createdAt || '').slice(0, 10);
            const list = (apps || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            const Stat = ({ l, v, s }) => <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"><p className="text-[11px] font-black text-gray-400">{l}</p><p className="text-2xl font-black text-gray-900 mt-1">{v}</p>{s && <p className="text-[11px] font-bold text-gray-500">{s}</p>}</div>;
            return <>
                <div className="mb-1"><h2 className="text-lg font-black text-gray-900">نظرة عامة</h2><p className="text-xs text-gray-500 font-bold">الحجوزات اللي جت من الموقع وصفحة الحجز (آخر 30 يوم)</p></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat l="حجوزات اتعملت النهاردة" v={apps ? list.filter(a => made(a) === today).length : '…'} />
                    <Stat l="آخر 7 أيام" v={apps ? list.filter(a => made(a) >= wk).length : '…'} />
                    <Stat l="آخر 30 يوم" v={apps ? list.length : '…'} s={apps && list.length ? Math.round(list.filter(a => a.status === 'arrived' || a.status === 'done').length / list.length * 100) + '% حضروا' : ''} />
                    <Stat l="خدمات ظاهرة" v={d.services.filter(s => !s.hidden).length} s={d.reviews.filter(r => !r.hidden).length + ' رأي عميل'} />
                </div>
                {warnings.length > 0 && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2"><p className="font-black text-sm text-amber-800">محتاج تكمّليه</p>{warnings.map(([w, k], i) => <button key={i} onClick={() => go(k)} className="block w-full text-right text-xs font-bold text-amber-800 hover:underline">• {w} ←</button>)}</div>}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="font-black text-sm mb-3">آخر الحجوزات أونلاين</p>
                    {!apps ? <p className="text-xs text-gray-400 font-bold">...</p> : list.length === 0 ? <p className="text-xs text-gray-400 font-bold py-4 text-center">مفيش حجوزات أونلاين في آخر 30 يوم</p> :
                        <div className="divide-y divide-gray-50">{list.slice(0, 10).map(a => <div key={a.id} className="flex items-center gap-3 py-2.5">
                            <div className="min-w-0 flex-1"><p className="text-sm font-black text-gray-800 truncate">{a.patientName}</p><p className="text-[11px] text-gray-400 font-bold truncate">{[a.service, a.doctorName && 'د. ' + a.doctorName].filter(Boolean).join(' • ')}</p></div>
                            <span className="text-[11px] font-black text-gray-600 shrink-0" dir="ltr">{a.date} {a.time}</span>
                        </div>)}</div>}
                    <p className="text-[11px] text-gray-400 font-bold mt-3">إدارة الحجوزات (تأكيد، حضور، إلغاء) من السيستم.</p>
                </div>
            </>;
        };

        // ===================== أقسام مخصصة (بتتعمل من لوحة التحكم ← أقسام جديدة) =====================
        const CS_TYPES = [
            ['text', 'نص + صورة', '📝', 'عنوان وكلام وصورة جنبه وزرار (مثلاً: عن الدكتور، عرض خاص، نصايح)'],
            ['cards', 'كروت', '🗂️', 'مجموعة كروت كل واحد بصورة وعنوان ووصف (مثلاً: الأجهزة، الفريق، الباقات)'],
            ['gallery', 'معرض صور', '🖼️', 'شبكة صور (قبل وبعد، الفرع من جوه...)'],
            ['faq', 'أسئلة وأجوبة', '❓', 'أسئلة بتتفتح وتتقفل'],
            ['cta', 'شريط دعوة', '📣', 'جملة كبيرة وزرار (احجز الآن / كلّمنا واتساب)'],
            ['video', 'فيديو', '🎬', 'فيديو من يوتيوب مع عنوان وكلام']
        ];
        const CS_PLACES = [['hero', 'بعد الهيدر'], ['about', 'بعد "من نحن"'], ['services', 'بعد الخدمات'], ['vision', 'بعد الرؤية والرسالة'], ['gallery', 'بعد المعرض'], ['reviews', 'بعد آراء العملاء'], ['faq', 'بعد الأسئلة الشائعة'], ['consult', 'بعد الاستشارة'], ['booking', 'آخر الصفحة (بعد الحجز)']];
        const CS_BG = [['white', 'أبيض', 'bg-white'], ['cream', 'كريمي', 'bg-[#FDFCFB]'], ['gray', 'رمادي فاتح', 'bg-gray-50'], ['dark', 'غامق', 'bg-gray-900 text-white'], ['gold', 'دهبي', 'bg-pharaonic text-white']];
        const csNew = type => ({ id: 'cs' + Date.now().toString(36), type, title: '', titleEn: '', sub: '', subEn: '', place: 'booking', bg: type === 'cta' ? 'gold' : 'white', hidden: false, text: '', textEn: '', image: '', side: 'start', btn: '', btnEn: '', link: '#book', cols: 3, items: type === 'cards' ? [{ image: '', title: '', titleEn: '', text: '', textEn: '' }] : type === 'faq' ? [{ q: '', qEn: '', a: '', aEn: '' }] : [], images: [], video: '' });
        const csT = (lang, ar, en) => (lang === 'en' && en) || ar || '';
        const csHref = link => { const l = String(link || '').trim(); if (!l) return ''; if (/^\d{9,15}$/.test(l.replace(/\D/g, '')) && /^(wa:|\+?\d)/.test(l)) return 'https://wa.me/' + l.replace(/\D/g, ''); return l; };
        const ytId = u => { const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : ''; };
        const CsBtn = ({ s, lang, dark }) => { const t = csT(lang, s.btn, s.btnEn), h = csHref(s.link); if (!t || !h) return null; const ext = /^https?:/.test(h);
            return <a href={h} target={ext ? '_blank' : undefined} rel="noreferrer" className={`inline-block mt-5 px-7 py-3 rounded-2xl font-black shadow-lg transition-transform hover:-translate-y-0.5 ${dark ? 'bg-white text-gray-900' : 'bg-pharaonic text-white'}`}>{t}</a>; };
        const CustomSection = ({ s, lang }) => {
            const [open, setOpen] = useState(null);
            const bg = (CS_BG.find(b => b[0] === s.bg) || CS_BG[0])[2], dark = s.bg === 'dark' || s.bg === 'gold';
            const title = csT(lang, s.title, s.titleEn), sub = csT(lang, s.sub, s.subEn), text = csT(lang, s.text, s.textEn);
            const Head = () => (title || sub) ? <div className="text-center mb-7">{title && <h2 className={`text-3xl md:text-4xl font-black mb-3 ${dark ? '' : 'text-gray-900'}`}>{title}</h2>}<div className={`w-16 h-1 mx-auto rounded-full ${dark ? 'bg-white/70' : 'bg-pharaonic'}`}></div>{sub && <p className={`mt-3 font-bold ${dark ? 'opacity-80' : 'text-gray-500'}`}>{sub}</p>}</div> : null;
            let body = null;
            if (s.type === 'text') body = <div className={`grid gap-8 items-center ${s.image ? 'md:grid-cols-2' : ''}`}>
                {s.image && <img src={s.image} alt={title} loading="lazy" className={`w-full rounded-3xl shadow-xl object-cover max-h-[420px] ${s.side === 'end' ? 'md:order-2' : ''}`} />}
                <div className={s.image ? '' : 'text-center max-w-3xl mx-auto'}>{title && <h2 className={`text-3xl md:text-4xl font-black mb-4 ${dark ? '' : 'text-gray-900'}`}>{title}</h2>}{sub && <p className="font-black text-pharaonic mb-3">{sub}</p>}<p className={`leading-loose font-bold whitespace-pre-line ${dark ? 'opacity-90' : 'text-gray-600'}`}>{text}</p><CsBtn s={s} lang={lang} dark={dark} /></div></div>;
            else if (s.type === 'cards') { const items = (s.items || []).filter(x => x.title || x.image || x.text); body = <><Head /><div className={`grid gap-5 sm:grid-cols-2 ${({ 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' })[s.cols] || 'lg:grid-cols-3'}`}>{items.map((x, i) => <div key={i} className={`rounded-3xl overflow-hidden shadow-md border ${dark ? 'bg-white/10 border-white/10' : 'bg-white border-gray-100'}`}>
                {x.image && <img src={x.image} alt="" loading="lazy" className="w-full h-48 object-cover" />}<div className="p-5"><h3 className={`font-black text-lg mb-1.5 ${dark ? '' : 'text-gray-900'}`}>{csT(lang, x.title, x.titleEn)}</h3><p className={`text-sm font-bold leading-relaxed whitespace-pre-line ${dark ? 'opacity-80' : 'text-gray-500'}`}>{csT(lang, x.text, x.textEn)}</p></div></div>)}</div>{text && <p className="text-center mt-6 font-bold opacity-80">{text}</p>}<div className="text-center"><CsBtn s={s} lang={lang} dark={dark} /></div></>; }
            else if (s.type === 'gallery') body = <><Head /><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{(s.images || []).filter(Boolean).map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" loading="lazy" className="w-full h-44 md:h-60 object-cover rounded-2xl shadow hover:scale-[1.02] transition-transform" /></a>)}</div><div className="text-center"><CsBtn s={s} lang={lang} dark={dark} /></div></>;
            else if (s.type === 'faq') body = <div className="max-w-3xl mx-auto"><Head /><div className="space-y-2">{(s.items || []).filter(x => x.q).map((x, i) => { const o = open === i; return <div key={i} className={`rounded-2xl border transition-all ${o ? 'border-pharaonic bg-pharaonic/5' : dark ? 'border-white/20' : 'border-gray-200 bg-white'}`}>
                <button type="button" onClick={() => setOpen(o ? null : i)} className="w-full flex items-center justify-between gap-3 p-4 text-start"><span className={`font-black ${dark ? '' : 'text-gray-900'}`}>{csT(lang, x.q, x.qEn)}</span><span className={`text-pharaonic text-xl font-black transition-transform ${o ? 'rotate-45' : ''}`}>+</span></button>
                {o && <div className={`px-4 pb-4 font-bold leading-relaxed whitespace-pre-line ${dark ? 'opacity-90' : 'text-gray-700'}`}>{csT(lang, x.a, x.aEn)}</div>}</div>; })}</div></div>;
            else if (s.type === 'cta') body = <div className="text-center max-w-3xl mx-auto"><h2 className="text-3xl md:text-4xl font-black mb-3">{title}</h2>{(sub || text) && <p className="font-bold opacity-90 whitespace-pre-line">{sub || text}</p>}<CsBtn s={s} lang={lang} dark={dark} /></div>;
            else if (s.type === 'video') { const id = ytId(s.video); body = <div className="max-w-4xl mx-auto"><Head />{id && <div className="relative rounded-3xl overflow-hidden shadow-xl bg-black" style={{ paddingTop: '56.25%' }}><iframe className="absolute inset-0 w-full h-full" src={'https://www.youtube-nocookie.com/embed/' + id} title={title || 'video'} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>}{text && <p className={`text-center mt-5 font-bold whitespace-pre-line ${dark ? 'opacity-90' : 'text-gray-600'}`}>{text}</p>}<div className="text-center"><CsBtn s={s} lang={lang} dark={dark} /></div></div>; }
            return <section id={s.id} className={`py-12 ${bg}`}><FadeUp><div className="container mx-auto px-4 max-w-6xl">{body}</div></FadeUp></section>;
        };
        const CustomAt = ({ cfg, lang, place }) => <>{(cfg.customSections || []).filter(s => !s.hidden && (s.place || 'booking') === place).map(s => <CustomSection key={s.id} s={s} lang={lang} />)}</>;

        // --- الأسئلة الشائعة (من اللي الأدمن نشره في السيستم) ---
        // السؤال يخص الخدمة دي؟ (بالربط المباشر من السيستم، أو بالتصنيف لو بيتطابق مع اسم الخدمة)
        const faqNorm = t => String(t || '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/^ال/, '').trim();
        const faqForSvc = (f, sv) => { if (!sv) return true; if (f.svc) return f.svc === sv.id; const tp = faqNorm(f.topic); if (tp.length < 3) return false; const ti = faqNorm(sv.title) + ' ' + faqNorm(sv.titleEn); return ti.split(/\s+/).some(w => w.replace(/^ال/, '').length >= 3 && (tp.includes(w.replace(/^ال/, '')) || w.replace(/^ال/, '').includes(tp))); };
        const FaqSection = ({ l, svc, lang }) => {
            const [faqs, setFaqs] = useState([]);
            const [open, setOpen] = useState(null);
            const [q, setQ] = useState('');
            const [topic, setTopic] = useState('');
            const [more, setMore] = useState(false);
            useEffect(() => { setMore(false); }, [topic, q]);
            useEffect(() => { if (!db) return; return db.collection('faqs').where('published', '==', true).onSnapshot(s => setFaqs(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (b.createdAt || '').localeCompare(a.createdAt || ''))), e => console.error(e)); }, []);
            const en = lang === 'en';
            const mine = (svc ? faqs.filter(f => faqForSvc(f, svc)) : faqs).map(f => en ? { ...f, q: f.qEn || f.q, a: f.aEn || f.a, topicL: f.topicEn || f.topic } : { ...f, topicL: f.topic });
            if (!mine.length) return null;
            const topics = svc ? [] : [...new Set(mine.map(f => f.topic).filter(Boolean))];
            const list = mine.filter(f => (!topic || f.topic === topic) && (!q || (f.q + ' ' + f.a).includes(q)));
            return (
                <section id={svc ? 'faq-' + svc.id : 'faq'} className={svc ? 'py-6 mb-6 px-3' : 'py-10 bg-white border-y border-gray-100'}>
                    <div className={svc ? 'max-w-3xl mx-auto' : 'container mx-auto px-4 max-w-3xl'}>
                        <FadeUp><div className="text-center mb-5"><h2 className={`${svc ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'} font-black text-gray-900 mb-2`}>{svc ? l.faqTitle + ' — ' + svc.title : l.faqTitle}</h2><div className="w-16 h-1 bg-pharaonic mx-auto rounded-full"></div></div></FadeUp>
                        {mine.length > 6 && <input value={q} onChange={e => setQ(e.target.value)} placeholder={l.faqSearch} className="w-full bg-gray-50 border border-gray-200 focus:border-pharaonic px-3 py-2 rounded-xl outline-none font-bold text-sm mb-3" />}
                        {topics.length > 1 && <div className="flex flex-wrap gap-2 mb-4">{['', ...topics].map(t => <button key={t || 'all'} type="button" onClick={() => setTopic(t)} className={`px-3 py-1.5 rounded-full text-xs font-black border ${topic === t ? 'bg-pharaonic text-white border-pharaonic' : 'bg-white text-gray-600 border-gray-200'}`}>{t ? ((mine.find(f => f.topic === t) || {}).topicL || t) : l.faqAll}</button>)}</div>}
                        {(() => { const N = 6, shown = more || q ? list.slice(0, 60) : list.slice(0, N); return (<>
                        <div className="space-y-1.5">{shown.map(f => { const o = open === f.id; return (
                            <div key={f.id} className={`rounded-xl border transition-colors ${o ? 'border-pharaonic bg-pharaonic/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                <button type="button" onClick={() => setOpen(o ? null : f.id)} className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-start"><span className="font-bold text-gray-900 text-sm md:text-[15px] leading-snug">{f.q}</span><span className={`text-pharaonic text-lg font-black leading-none transition-transform shrink-0 ${o ? 'rotate-45' : ''}`}>+</span></button>
                                {o && <div className="px-4 pb-3 -mt-0.5 text-gray-600 text-sm font-semibold leading-relaxed whitespace-pre-line">{f.a}</div>}
                            </div>); })}
                            {!list.length && <p className="text-center text-gray-400 font-bold py-4 text-sm">{l.faqNone}</p>}
                        </div>
                        {!q && list.length > N && <div className="text-center mt-3"><button type="button" onClick={() => { setMore(!more); if (more) { const el = document.getElementById(svc ? 'faq-' + svc.id : 'faq'); el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-pharaonic text-pharaonic font-black text-sm hover:bg-pharaonic hover:text-white transition-colors">{more ? l.faqLess : l.faqMore + ' (' + (list.length - N) + ')'} <span className={more ? 'rotate-180 inline-block' : 'inline-block'}>⌄</span></button></div>}
                        </>); })()}
                    </div>
                </section>
            );
        };

        // ===================== كارت الحجز والاستشارة (جوه الموقع) =====================
        // كل حاجة فيه بتتحكم من لوحة الموقع ← "الحجز والاستشارة". لينك الحجز المباشر: رابط الموقع/#book
        const BK_TEXTS = {
            bookTab: ['حجز موعد', 'Book'], consultTab: ['استشارة أونلاين مجانية', 'Free online consultation'], trackTab: ['متابعة بالكود', 'Track by code'],
            branchStep: ['اختار الفرع', 'Choose a branch'], serviceStep: ['محتاج إيه؟', 'What do you need?'], dateStep: ['اليوم والوقت', 'Date & time'], detailsStep: ['بياناتك', 'Your details'],
            submit: ['تأكيد الحجز', 'Confirm booking'], costLabel: ['التكلفة المتوقعة', 'Expected cost'], costNote: ['السعر تقريبي وبيتحدد نهائياً بعد الكشف.', 'Approximate — the final price is set after examination.'],
            success: ['تم الحجز بنجاح!', 'Booked successfully!'], successNote: ['هنكلمك قبل الميعاد للتأكيد. احتفظ بالكود عشان تعدّل أو تلغي.', 'We will call to confirm. Keep the code to change or cancel.'],
            noTimes: ['مواعيد النهارده خلصت — اختار يوم تاني.', 'Today\'s times are over — pick another day.'],
            consultIntro: ['ابعت سؤالك لدكاترتنا مجاناً، والدكتور المختص هيرد عليك في أقرب وقت. تقدر تتابع الرد بالكود اللي هيظهرلك.', 'Send your question to our doctors for free. Track the reply with the code you get.'],
            consultSubmit: ['ابعت الاستشارة', 'Send question'], consultDone: ['استشارتك اتبعتت!', 'Question sent!']
        };
        const BK_FIELDS_DEFAULT = [
            { id: 'name', label: 'الاسم بالكامل', labelEn: 'Full name', type: 'text', required: true, system: true },
            { id: 'phone', label: 'رقم الموبايل', labelEn: 'Mobile number', type: 'tel', required: true, system: true }
        ];
        const BK_DEFAULT = { fields: BK_FIELDS_DEFAULT, branchOrder: [], hiddenBranches: [], showMap: true, showCost: true, showServices: true, serviceRequired: false, texts: { ar: {}, en: {} } };
        const bkCfg = cfg => { const b = { ...BK_DEFAULT, ...(cfg.booking || {}) }; if (!Array.isArray(b.fields) || !b.fields.length) b.fields = BK_FIELDS_DEFAULT; BK_FIELDS_DEFAULT.forEach(f => { if (!b.fields.some(x => x.id === f.id)) b.fields = [f, ...b.fields]; }); b.texts = { ar: {}, en: {}, ...(b.texts || {}) }; return b; };
        const bkT = (bk, lang, k) => ((bk.texts[lang] || {})[k]) || (BK_TEXTS[k] ? BK_TEXTS[k][lang === 'en' ? 1 : 0] : k);
        const bkBranches = (bk, branches) => { const ord = bk.branchOrder || []; return branches.filter(b => !(bk.hiddenBranches || []).includes(b.id)).sort((a, b) => { const x = ord.indexOf(a.id), y = ord.indexOf(b.id); return (x < 0 ? 999 : x) - (y < 0 ? 999 : y) || (a.name || '').localeCompare(b.name || '', 'ar'); }); };

        // مواعيد الحجز بتيجي من إعدادات كل فرع في السيستم (أول ميعاد / آخر ميعاد / كل كام دقيقة / الإجازات)
        const bkSlots = b => {
            const tm = x => { const [h, m] = String(x || '').split(':').map(Number); return isNaN(h) ? null : h * 60 + (m || 0); };
            let a = tm(b && b.bookFrom), z = tm(b && b.bookTo); const step = Math.max(10, Number(b && b.slotMin) || 30);
            if (a === null || z === null || z <= a) { a = 16 * 60; z = 22 * 60; }
            const out = []; for (let t = a; t <= z && out.length < 96; t += step) out.push(Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'));
            return out;
        };
        const bkDayOff = (b, date) => !!(b && date && ((Array.isArray(b.daysOff) && b.daysOff.includes(new Date(date + 'T00:00:00').getDay())) || (Array.isArray(b.holidays) && b.holidays.includes(date))));
        const bkCode = () => { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let r = ''; for (let i = 0; i < 8; i++) r += c.charAt(Math.floor(Math.random() * c.length)); return r; };
        const bkDay = () => new Date().toLocaleDateString('en-CA');
        // حد أقصى للحجوزات الجاية لكل رقم موبايل (phone_book/{آخر 10 أرقام} = [{ d: التاريخ, t: علامة الحجز }])
        const BK_MAX_PER_PHONE = 2;
        const bkPhoneKey = ph => String(ph || '').replace(/\D/g, '').slice(-10);
        const bkPb = list => ({ list, toks: list.map(x => x.t), at: Date.now() });
        const bkSlotId = (b, d, date, time) => [b, d || 'none', date, time].join('_');
        const bkWorks = (doc, branchId, date) => { const days = doc && doc.days && doc.days[branchId]; return !date || !Array.isArray(days) || !days.length || days.includes(new Date(date + 'T00:00:00').getDay()); };
        const bkNum = x => Number(x) || 0;
        const bkMapSrc = (b, lang) => {
            const e = String(b.mapEmbed || '').trim(), m = e.match(/src=["']([^"']+)["']/); if (m) return m[1];
            if (/^https:\/\/(www\.)?google\.[^/]+\/maps\/embed/.test(e)) return e;
            const ll = String(b.mapsLink || '').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            const q = ll ? ll[1] + ',' + ll[2] : (e || [b.name, b.address].filter(Boolean).join(' ') || 'New Era Dental Center');
            return 'https://maps.google.com/maps?q=' + encodeURIComponent(q) + '&z=16&hl=' + lang + '&output=embed';
        };
        // البيانات العامة اللي الكارت محتاجها (دكاترة للمواعيد بس — مش بيظهروا — وخدمات وتخصصات)
        const useBookingData = () => {
            const [st, setSt] = useState({ doctors: [], services: [], specialties: [], ready: false });
            useEffect(() => {
                if (!db) return;
                const map = s => s.docs.map(d => ({ id: d.id, ...d.data() }));
                const sortO = a => a.sort((x, y) => (x.order ?? 999) - (y.order ?? 999) || (x.name || '').localeCompare(y.name || '', 'ar'));
                const u = [
                    db.collection('public_doctors').onSnapshot(s => setSt(p => ({ ...p, doctors: map(s), ready: true })), e => console.error(e)),
                    db.collection('services').onSnapshot(s => setSt(p => ({ ...p, services: sortO(map(s)) })), e => console.error(e)),
                    db.collection('specialties').onSnapshot(s => setSt(p => ({ ...p, specialties: sortO(map(s)) })), e => console.error(e))
                ];
                return () => u.forEach(f => f());
            }, []);
            return st;
        };

        const BookingWidget = ({ cfg, lang, branches, tab: tab0 = 'book', presetService = '', initialCode = '', tabRef }) => {
            const bk = bkCfg(cfg), L = k => bkT(bk, lang, k), T = (ar, en) => lang === 'en' ? en : ar;
            const data = useBookingData();
            const [tab, setTab] = useState(tab0);
            const [done, setDone] = useState(null);
            const [editApp, setEditApp] = useState(null);
            useEffect(() => { if (tabRef) tabRef.current = t => { setTab(t); setDone(null); setEditApp(null); }; });
            const bl = bkBranches(bk, branches);
            // الخدمات: من "الخدمات والأسعار" (السيستم/اللوحة). لو لسه فاضية بنستخدم خدمات الموقع
            const svcList = data.services.filter(s => s.active !== false).length
                ? data.services.filter(s => s.active !== false).map(s => ({ ...s, label: (lang === 'en' && s.nameEn) || s.name }))
                : (cfg.services || []).filter(s => !s.hidden).map(s => ({ id: 'site_' + s.id, name: s.title, label: (lang === 'en' && s.titleEn) || s.title, priceFrom: s.priceFrom, priceTo: s.priceTo }));
            const go = t => { setTab(t); setDone(null); setEditApp(null); };
            const TABS = [['book', L('bookTab')], ['consult', L('consultTab')], ['track', L('trackTab')]];
            // بيانات الفرع + التكلفة المتوقعة (بتيجي من فورم الحجز) — بتظهر على جنب الكارت
            const [info, setInfo] = useState(null);
            const side = tab === 'book' && !done && bl.length && info && info.branch ? info : null;
            const dir = lang === 'en' ? 'ltr' : 'rtl';
            return (
                // dir="rtl" ثابت للترتيب: الخريطة يمين الكارت، والبيانات والتكلفة شماله (في الموبايل تحت بعض)
                <div dir="rtl" className="grid gap-4 items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)_minmax(0,1fr)]">
                    <div className="order-3 lg:order-1 lg:sticky lg:top-24" dir={dir}>{side && bk.showMap && <BkMapPanel b={side.branch} lang={lang} />}</div>
                    <div className="order-1 lg:order-2 bg-white w-full rounded-[28px] shadow-2xl border border-gray-100 p-4 sm:p-7" dir={dir}>
                        <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 overflow-x-auto">{TABS.map(([k, n]) => <button key={k} type="button" onClick={() => go(k)} className={`flex-1 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${tab === k ? 'bg-white shadow text-pharaonic' : 'text-gray-500'}`}>{n}</button>)}</div>
                        {!bl.length ? <p className="text-center font-bold text-gray-400 p-6 animate-pulse">{T('جاري التحميل...', 'Loading...')}</p>
                        : done ? <BkDone d={done} lang={lang} L={L} onBack={() => go(done.type === 'consult' ? 'consult' : 'book')} />
                        : tab === 'book' ? <BkForm key={editApp ? 'e' + editApp.id : 'n'} bk={bk} lang={lang} L={L} branches={bl} data={data} svcList={svcList} presetService={presetService} initial={editApp} onInfo={setInfo} onDone={d => setDone({ type: 'booking', ...d })} />
                        : tab === 'consult' ? <BkConsult lang={lang} L={L} branches={bl} data={data} onDone={d => setDone({ type: 'consult', ...d })} />
                        : <BkTrack lang={lang} branches={branches} initialCode={initialCode} onEdit={a => { setEditApp(a); setTab('book'); }} />}
                    </div>
                    <div className="order-2 lg:order-3 lg:sticky lg:top-24" dir={dir}>{side && <BkInfoPanel b={side.branch} lang={lang} L={L} bk={bk} chosen={side.chosen} estimate={side.estimate} />}</div>
                </div>
            );
        };

        const BkStep = ({ n, children }) => <p className="text-sm font-black text-gray-800 mb-2 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-pharaonic text-white text-xs flex items-center justify-center shrink-0">{n}</span>{children}</p>;
        const bkInp = "w-full bg-gray-50 border border-gray-200 focus:border-pharaonic p-3 rounded-xl outline-none font-bold transition-colors";

        // الخريطة (يمين الكارت)
        const BkMapPanel = ({ b, lang }) => (
            <div className="bg-white rounded-[28px] shadow-xl border border-gray-100 p-2 animate-fade-in">
                <div className="rounded-[22px] overflow-hidden bg-gray-100 h-[260px] lg:h-[440px] relative"><iframe key={b.id} title="map" src={bkMapSrc(b, lang)} className="absolute inset-0 w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen></iframe></div>
                {b.mapsLink && <a href={b.mapsLink} target="_blank" rel="noreferrer" className="block text-center text-xs font-black text-blue-600 py-2">{lang === 'en' ? 'Open in Google Maps ↗' : 'افتح على جوجل مابس ↗'}</a>}
            </div>
        );
        // بيانات الفرع + التكلفة المتوقعة (شمال الكارت)
        const BkInfoPanel = ({ b, lang, L, bk, chosen, estimate }) => {
            const T = (ar, en) => lang === 'en' ? en : ar;
            const rows = [
                b.address && ['📍', T('العنوان', 'Address'), b.address],
                b.hours && ['🕓', T('مواعيد العمل', 'Working hours'), b.hours],
                b.waitTime && ['⏳', T('مدة الانتظار المتوقعة', 'Expected waiting time'), b.waitTime],
                b.phone && ['📞', T('تليفون الفرع', 'Branch phone'), <a href={'tel:' + b.phone} dir="ltr" className="underline">{b.phone}</a>]
            ].filter(Boolean);
            const cost = bk.showCost && (estimate || b.consultFee);
            return (
                <div className="space-y-3 animate-fade-in">
                    <div className="bg-white rounded-[28px] shadow-xl border border-gray-100 p-5 space-y-3">
                        <p className="font-black text-gray-900 text-lg">{T('فرع ', '')}{brName(b, lang)}</p>
                        {rows.map(([ic, l, v], i) => <div key={i} className="flex gap-2.5"><span className="shrink-0">{ic}</span><div className="min-w-0"><p className="text-[11px] font-bold text-gray-400">{l}</p><div className="text-sm font-bold text-gray-800 break-words">{v}</div></div></div>)}
                        {!rows.length && <p className="text-xs font-bold text-gray-400">{T('هنتواصل معاك لتأكيد الميعاد.', 'We will contact you to confirm.')}</p>}
                    </div>
                    {cost && <div className="bg-pharaonic/10 border border-pharaonic/30 rounded-[28px] p-5">
                        <p className="text-sm font-black text-gray-800 mb-1">💳 {L('costLabel')}</p>
                        {chosen.length > 0 && <ul className="text-xs font-bold text-gray-600 mb-2 space-y-0.5">{chosen.map(s => <li key={s.id}>• {s.label}</li>)}</ul>}
                        <p className="text-2xl font-black text-[#B5952F]" dir="auto">{estimate || T('الكشف: ', 'Consultation: ') + b.consultFee}</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-1">{L('costNote')}</p>
                    </div>}
                </div>
            );
        };
        // قايمة منسدلة لاختيار خدمة أو أكتر (من غير أسعار)
        const BkMulti = ({ groups, value, onChange, lang, placeholder }) => {
            const T = (ar, en) => lang === 'en' ? en : ar;
            const [open, setOpen] = useState(false);
            const [q, setQ] = useState('');
            const box = useRef(null);
            useEffect(() => { if (!open) return; const h = e => { if (box.current && !box.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); document.addEventListener('touchstart', h); return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h); }; }, [open]);
            const all = groups.flatMap(g => g.items);
            const sel = all.filter(s => value.includes(s.id));
            const toggle = id => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
            const shown = groups.map(g => ({ ...g, items: g.items.filter(s => !q || (s.label + ' ' + s.name).toLowerCase().includes(q.toLowerCase())) })).filter(g => g.items.length);
            return (
                <div ref={box} className="relative">
                    <button type="button" onClick={() => setOpen(o => !o)} className={bkInp + ' flex items-center justify-between gap-2 text-start ' + (open ? 'border-pharaonic' : '')}>
                        <span className="flex flex-wrap gap-1.5 min-w-0">{sel.length ? sel.map(s => <span key={s.id} className="bg-pharaonic/15 text-gray-800 text-xs font-black px-2 py-1 rounded-lg">{s.label}</span>) : <span className="text-gray-400">{placeholder}</span>}</span>
                        <span className={`text-gray-400 text-xs shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {open && <div className="absolute z-30 inset-x-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 max-h-80 overflow-y-auto">
                        {all.length > 8 && <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={T('ابحث عن خدمة...', 'Search...')} className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl outline-none text-sm font-bold mb-2" />}
                        {shown.map((g, gi) => <div key={gi} className="mb-1">{g.name && <p className="text-[11px] font-black text-gray-400 px-2 pt-1">{g.name}</p>}
                            {g.items.map(s => { const on = value.includes(s.id); return (
                                <label key={s.id} title={s.note || ''} className={`flex items-center gap-2.5 px-2 py-2 rounded-xl cursor-pointer ${on ? 'bg-pharaonic/10' : 'hover:bg-gray-50'}`}>
                                    <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="w-4 h-4 accent-[#D4AF37]" />
                                    <span className="text-sm font-bold text-gray-800">{s.label}</span>
                                </label>); })}</div>)}
                        {!shown.length && <p className="text-center text-xs font-bold text-gray-400 p-3">{T('مفيش نتايج', 'No results')}</p>}
                        <button type="button" onClick={() => setOpen(false)} className="sticky bottom-0 w-full mt-1 bg-pharaonic text-white text-sm font-black py-2 rounded-xl">{T('تم', 'Done')}{sel.length ? ` (${sel.length})` : ''}</button>
                    </div>}
                </div>
            );
        };

        const BkForm = ({ bk, lang, L, branches, data, svcList, presetService, initial, onInfo, onDone }) => {
            const T = (ar, en) => lang === 'en' ? en : ar;
            const editing = !!(initial && initial.id);
            const fields = bk.fields.filter(f => !f.hidden || f.system);
            const [f, setF] = useState(() => ({ branchId: editing ? initial.branchId : (branches.length === 1 ? branches[0].id : ''), serviceIds: [], date: editing ? initial.date : '', time: editing ? initial.time : '', vals: editing ? { name: initial.patientName, phone: initial.phone } : {} }));
            const [slotsTaken, setSlotsTaken] = useState([]);
            const [busy, setBusy] = useState(false);
            const [err, setErr] = useState('');
            const set = p => setF(x => ({ ...x, ...p }));
            const preset = useRef(false);
            useEffect(() => {
                if (preset.current || !svcList.length) return;
                const want = editing ? (initial.service || '') : presetService;
                if (!want && !(editing && (initial.serviceIds || []).length)) return;
                preset.current = true;
                const ids = editing && (initial.serviceIds || []).length ? initial.serviceIds.filter(id => svcList.some(s => s.id === id))
                    : svcList.filter(s => want.split(/[،,]/).map(x => x.trim()).some(w => w && (s.name === w || s.label === w || w.includes(s.name) || s.name.includes(w)))).map(s => s.id).slice(0, editing ? 20 : 1);
                if (ids.length) set({ serviceIds: ids });
            }, [svcList.length]);
            useEffect(() => { if (!f.date || !db) { setSlotsTaken([]); return; } return db.collection('booked_slots').where('date', '==', f.date).onSnapshot(s => setSlotsTaken(s.docs.map(d => d.data())), e => console.error(e)); }, [f.date]);

            const branch = branches.find(b => b.id === f.branchId);
            const chosen = svcList.filter(s => f.serviceIds.includes(s.id));
            const specIds = [...new Set(chosen.map(s => s.specialtyId).filter(Boolean))];
            // الدكاترة مش بيظهروا للمريض: بنختار الدكتور المناسب الفاضي لوحدنا
            const branchDocs = data.doctors.filter(d => (d.branchIds || []).includes(f.branchId));
            const fit = specIds.length ? branchDocs.filter(d => specIds.some(id => (d.specs || []).includes(id))) : branchDocs;
            const pool = (fit.length ? fit : branchDocs).filter(d => bkWorks(d, f.branchId, f.date));
            const docsForSlots = branchDocs.length ? pool : [{ id: 'any', name: '' }];
            const own = editing && initial.branchId === f.branchId && initial.date === f.date ? { doc: initial.doctorId, time: initial.time } : null;
            const taken = new Set(slotsTaken.filter(x => x.branchId === f.branchId).map(x => (x.doctorId || 'none') + '|' + x.time));
            const freeDocs = time => docsForSlots.filter(d => !taken.has(d.id + '|' + time) || (own && own.doc === d.id && own.time === time));
            const today = bkDay(), now = new Date();
            const dayOff = bkDayOff(branch, f.date);
            const times = (!f.branchId || !f.date || dayOff) ? [] : bkSlots(branch).filter(v => { if (f.date === today) { const [h, m] = v.split(':').map(Number); if (h * 60 + m <= now.getHours() * 60 + now.getMinutes() && !(own && own.time === v)) return false; } return true; });
            // المريض يقدر يحجز أي وقت. لو مفيش دكتور مناسب فاضي، الحجز بيتسجل "محتاج تظبيط" والسكرتارية تتابع معاه
            useEffect(() => { if (f.time && !times.includes(f.time)) set({ time: '' }); }, [slotsTaken, f.branchId, f.date, f.serviceIds.join()]);
            const lo = chosen.reduce((t, s) => t + bkNum(s.priceFrom), 0), hi = chosen.reduce((t, s) => t + (bkNum(s.priceTo) || bkNum(s.priceFrom)), 0);
            const money = n => bkNum(n).toLocaleString('en-US') + ' ' + T('ج', 'EGP');
            const estimate = chosen.length && (lo || hi) ? (hi > lo ? bkNum(lo).toLocaleString('en-US') + ' – ' + money(hi) : money(lo)) : '';
            const fmt = v => { const [h, m] = v.split(':').map(Number); return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h >= 12 ? T('م', 'PM') : T('ص', 'AM')); };
            const grouped = (() => { const sp = data.specialties; const g = sp.map(x => ({ name: (lang === 'en' && x.nameEn) || x.name, items: svcList.filter(s => s.specialtyId === x.id) })).filter(x => x.items.length); const rest = svcList.filter(s => !sp.some(x => x.id === s.specialtyId)); if (rest.length) g.push({ name: g.length ? T('خدمات تانية', 'Other services') : '', items: rest }); return g; })();
            useEffect(() => { if (onInfo) onInfo(branch ? { branch, chosen, estimate } : null); }, [f.branchId, f.serviceIds.join(), estimate, branch && JSON.stringify(branch)]);
            useEffect(() => () => onInfo && onInfo(null), []);
            let n = 1;

            const submit = async e => {
                e.preventDefault(); setErr('');
                if (!f.branchId) return setErr(T('اختار الفرع', 'Choose a branch'));
                if (bk.showServices && bk.serviceRequired && !chosen.length) return setErr(T('اختار الخدمة', 'Choose a service'));
                if (!f.time) return setErr(T('اختار اليوم والوقت', 'Choose date & time'));
                for (const fl of fields) if (fl.required && !String(f.vals[fl.id] || '').trim()) return setErr(T('كمّل خانة: ', 'Please fill: ') + ((lang === 'en' && fl.labelEn) || fl.label));
                const phoneClean = String(f.vals.phone || '').replace(/[^\d+]/g, '').slice(0, 20), pk = bkPhoneKey(phoneClean);
                if (pk.length < 10) return setErr(T('رقم الموبايل مش صحيح — اكتبه كامل', 'Please enter a valid mobile number'));
                setBusy(true);
                const pbRef = db.collection('phone_book').doc(pk), tok = bkCode() + bkCode();
                // بيقرا حجوزات الرقم (لازم قبل أي كتابة في المعاملة) وبيرجّع دالة الكتابة
                const pbAdd = async tx => { const sn = await tx.get(pbRef); const list = ((sn.exists && sn.data().list) || []).filter(x => x && x.d >= bkDay()); if (list.length >= BK_MAX_PER_PHONE) throw new Error('LIMIT'); return () => tx.set(pbRef, bkPb([...list, { d: f.date, t: tok }])); };
                const oldPb = editing && initial.pbTok && initial.phoneKey ? db.collection('phone_book').doc(initial.phoneKey) : null;
                const pbMove = async tx => { if (!oldPb) return () => {}; const sn = await tx.get(oldPb); const list = ((sn.exists && sn.data().list) || []).filter(x => x && x.d >= bkDay()).map(x => x.t === initial.pbTok ? { ...x, d: f.date } : x); return () => tx.set(oldPb, bkPb(list.slice(-BK_MAX_PER_PHONE))); };
                const extra = {}; fields.filter(fl => !fl.system && String(f.vals[fl.id] || '').trim()).slice(0, 20).forEach(fl => { extra[(fl.label || fl.id).slice(0, 60)] = String(f.vals[fl.id]).trim().slice(0, 500); });
                const base = { patientName: String(f.vals.name || '').trim().slice(0, 100), phone: phoneClean, branchId: f.branchId, service: (chosen.map(s => s.name).join('، ') || T('كشف', 'Checkup')).slice(0, 200), serviceIds: chosen.map(s => s.id).slice(0, 20), estimate: (estimate || (branch && branch.consultFee ? T('الكشف: ', 'Consultation: ') + branch.consultFee : '')).slice(0, 80), extra, date: f.date, time: f.time };
                // الدكاترة الفاضيين في الميعاد ده — بنجرّب واحد ورا التاني
                const cands = freeDocs(f.time).sort((a, b) => (own && a.id === own.doc ? -1 : 0) - (own && b.id === own.doc ? -1 : 0) || Math.random() - 0.5);
                try {
                    let res = null;
                    for (const d of cands) {
                        const sid = bkSlotId(f.branchId, d.id, f.date, f.time), sRef = db.collection('booked_slots').doc(sid);
                        const full = { ...base, doctorId: d.id, doctorName: d.name || '', ...(editing && initial.needsSchedule ? { needsSchedule: false } : {}) };
                        try {
                            if (editing) {
                                const oldSid = bkSlotId(initial.branchId, initial.doctorId, initial.date, initial.time), appRef = db.collection('appointments').doc(initial.id);
                                const ch = (full.date !== initial.date || full.time !== initial.time || full.doctorId !== (initial.doctorId || '')) ? { rescheduledAt: new Date().toISOString(), rescheduledBy: 'patient', prevDate: initial.date || '', prevTime: initial.time || '', prevDoctorId: initial.doctorId || '', prevDoctorName: initial.doctorName || '' } : {};
                                await db.runTransaction(async tx => {
                                    const cur = await tx.get(appRef); if (!cur.exists) throw new Error('GONE');
                                    const slotTaken = sid !== oldSid && (await tx.get(sRef)).exists, pbW = await pbMove(tx);
                                    if (slotTaken) throw new Error('SLOT_TAKEN');
                                    pbW();
                                    if (sid !== oldSid) { tx.set(sRef, { branchId: full.branchId, doctorId: full.doctorId, date: full.date, time: full.time, at: Date.now(), appId: initial.id }); }
                                    tx.update(appRef, { ...full, ...ch });
                                });
                                res = { ...initial, ...full };
                            } else {
                                for (let i = 0; i < 4 && !res; i++) {
                                    const code = bkCode(), appRef = db.collection('appointments').doc(), bRef = db.collection('online_bookings').doc(code);
                                    try {
                                        await db.runTransaction(async tx => {
                                            const [bs, ss] = await Promise.all([tx.get(bRef), tx.get(sRef)]);
                                            const pbW = await pbAdd(tx);
                                            if (ss.exists) throw new Error('SLOT_TAKEN'); if (bs.exists) throw new Error('CODE_TAKEN');
                                            pbW();
                                            tx.set(appRef, { ...full, phoneKey: pk, pbTok: tok, attrib: attribDoc(), bookingCode: code, source: 'online', status: 'unconfirmed', createdAt: new Date().toISOString() });
                                            tx.set(bRef, { appointmentId: appRef.id });
                                            tx.set(sRef, { branchId: full.branchId, doctorId: full.doctorId, date: full.date, time: full.time, at: Date.now(), appId: appRef.id });
                                        });
                                        res = { id: appRef.id, ...full, bookingCode: code };
                                    } catch (x) { if (x.message !== 'CODE_TAKEN') throw x; }
                                }
                            }
                        } catch (x) { if (x.message !== 'SLOT_TAKEN') throw x; }
                        if (res) break;
                    }
                    // مفيش دكتور فاضي (أو مفيش دكتور اليوم ده): نسجّل الحجز برضه من غير دكتور، والسكرتارية تظبطه
                    if (!res) {
                        const full = { ...base, doctorId: 'none', doctorName: '', needsSchedule: true };
                        if (editing) {
                            const appRef = db.collection('appointments').doc(initial.id);
                            const ch = (full.date !== initial.date || full.time !== initial.time || full.doctorId !== (initial.doctorId || '')) ? { rescheduledAt: new Date().toISOString(), rescheduledBy: 'patient', prevDate: initial.date || '', prevTime: initial.time || '', prevDoctorId: initial.doctorId || '', prevDoctorName: initial.doctorName || '' } : {};
                            await db.runTransaction(async tx => { const cur = await tx.get(appRef); if (!cur.exists) throw new Error('GONE'); const pbW = await pbMove(tx); pbW(); tx.update(appRef, { ...full, ...ch }); });
                            res = { ...initial, ...full };
                        } else {
                            for (let i = 0; i < 4 && !res; i++) {
                                const code = bkCode(), appRef = db.collection('appointments').doc(), bRef = db.collection('online_bookings').doc(code);
                                try {
                                    await db.runTransaction(async tx => {
                                        const bs = await tx.get(bRef), pbW = await pbAdd(tx);
                                        if (bs.exists) throw new Error('CODE_TAKEN');
                                        pbW();
                                        tx.set(appRef, { ...full, phoneKey: pk, pbTok: tok, attrib: attribDoc(), bookingCode: code, source: 'online', status: 'unconfirmed', createdAt: new Date().toISOString() });
                                        tx.set(bRef, { appointmentId: appRef.id });
                                    });
                                    res = { id: appRef.id, ...full, bookingCode: code };
                                } catch (x) { if (x.message !== 'CODE_TAKEN') throw x; }
                            }
                        }
                    }
                    if (!res) setErr(T('حصل خطأ، جرب تاني', 'Something went wrong, try again'));
                    else { if (!editing) { neTrack('booking', { branch: (branch && branch.name) || '' }, res.bookingCode); if (res.bookingCode) neCapi(res.bookingCode, res.phone); } onDone({ ...res, edited: editing, branch }); }
                } catch (x) { console.error(x); setErr(x.message === 'LIMIT' ? T('الرقم ده عليه ' + BK_MAX_PER_PHONE + ' حجز جايين بالفعل. تقدر تعدّل أو تلغي حجز منهم من "متابعة بالكود"، أو كلّمنا على تليفون الفرع.', 'This number already has ' + BK_MAX_PER_PHONE + ' upcoming bookings. Change or cancel one from "Track by code", or call the branch.') : x.message === 'GONE' ? T('الحجز ده مبقاش موجود', 'Booking no longer exists') : T('حصل خطأ، اتأكد من النت وجرب تاني', 'Something went wrong, check your connection')); }
                setBusy(false);
            };

            return (
                <form onSubmit={submit} className="space-y-6">
                    {editing && <p className="text-sm font-black text-pharaonic">{T('تعديل الحجز ', 'Editing ')}#{initial.bookingCode}</p>}
                    {branches.length > 1 && <div><BkStep n={n++}>{L('branchStep')}</BkStep>
                        <div className="flex flex-wrap gap-2">{branches.map(b => <button key={b.id} type="button" onClick={() => set({ branchId: b.id, time: '' })} className={`px-4 py-2.5 rounded-xl text-sm font-black border-2 transition-all ${f.branchId === b.id ? 'bg-pharaonic text-white border-pharaonic shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-pharaonic'}`}>{brName(b, lang)}</button>)}</div></div>}

                    {branch && bk.showServices && svcList.length > 0 && <div className="animate-fade-in"><BkStep n={n++}>{L('serviceStep')}<span className="text-[11px] text-gray-400 font-bold">{bk.serviceRequired ? T('(تقدر تختار أكتر من خدمة)', '(you can pick more than one)') : T('(اختياري — تقدر تختار أكتر من خدمة)', '(optional — pick one or more)')}</span></BkStep>
                        <BkMulti groups={grouped} value={f.serviceIds} onChange={ids => set({ serviceIds: ids })} lang={lang} placeholder={T('اختار الخدمة...', 'Choose a service...')} />
                        {bk.showCost && estimate && <div className="lg:hidden mt-2 bg-pharaonic/10 border border-pharaonic/30 rounded-xl p-2.5 flex items-center justify-between gap-2"><span className="text-xs font-black text-gray-700">{L('costLabel')}</span><span className="text-sm font-black text-[#B5952F]">{estimate}</span></div>}
                    </div>}

                    {branch && <div className="animate-fade-in"><BkStep n={n++}>{L('dateStep')}</BkStep>
                        <input type="date" required value={f.date} min={today} onChange={e => set({ date: e.target.value, time: '' })} className={bkInp + ' mb-3'} />
                        {f.date && (times.length ? <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" dir="ltr">{times.map(v => <button key={v} type="button" onClick={() => set({ time: v })} className={`py-2.5 rounded-xl text-xs font-black border-2 transition-all ${f.time === v ? 'bg-pharaonic text-white border-pharaonic shadow' : 'bg-white text-gray-600 border-gray-100 hover:border-pharaonic/50'}`}>{fmt(v)}</button>)}</div>
                            : <p className="text-sm font-bold text-red-500 bg-red-50 p-3 rounded-xl text-center">{dayOff ? T('الفرع إجازة اليوم ده — اختار يوم تاني.', 'The branch is closed on this day — pick another.') : L('noTimes')}</p>)}
                    </div>}

                    {f.time && <div className="animate-fade-in space-y-3"><BkStep n={n++}>{L('detailsStep')}</BkStep>
                        {fields.filter(fl => !fl.hidden).map(fl => { const lab = ((lang === 'en' && fl.labelEn) || fl.label) + (fl.required ? ' *' : ''); const v = f.vals[fl.id] || ''; const ch = e => set({ vals: { ...f.vals, [fl.id]: e.target.value } }); const ph = (lang === 'en' && fl.placeholderEn) || fl.placeholder || '';
                            return <label key={fl.id} className="block"><span className="block text-xs font-black text-gray-500 mb-1">{lab}</span>
                                {fl.type === 'textarea' ? <textarea rows="3" value={v} onChange={ch} placeholder={ph} maxLength={500} className={bkInp} />
                                : fl.type === 'select' ? <select value={v} onChange={ch} className={bkInp}><option value="">{T('اختار...', 'Choose...')}</option>{String(fl.options || '').split(/[،,\n]/).map(o => o.trim()).filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}</select>
                                : <input type={fl.type === 'number' ? 'number' : fl.type === 'tel' ? 'tel' : 'text'} value={v} onChange={ch} placeholder={ph || (fl.id === 'phone' ? '01xxxxxxxxx' : '')} maxLength={fl.id === 'name' ? 100 : fl.id === 'phone' ? 30 : 500} dir={fl.type === 'tel' ? 'ltr' : undefined} className={bkInp + (fl.type === 'tel' ? ' text-left' : '')} />}
                            </label>; })}
                        <button disabled={busy} className="w-full bg-pharaonic text-white font-black py-4 rounded-2xl shadow-lg text-lg hover:bg-[#B5952F] transition-colors disabled:opacity-60">{busy ? '...' : editing ? T('حفظ التعديل', 'Save changes') : L('submit')}</button>
                    </div>}
                    {err && <p className="text-sm font-black text-red-600 bg-red-50 rounded-xl p-3 text-center">{err}</p>}
                </form>
            );
        };

        const BkConsult = ({ lang, L, branches, data, onDone }) => {
            const T = (ar, en) => lang === 'en' ? en : ar;
            const [f, setF] = useState({ name: '', phone: '', branchId: '', specId: '', question: '' });
            const [busy, setBusy] = useState(false);
            const [err, setErr] = useState('');
            const set = p => setF(x => ({ ...x, ...p }));
            const submit = async e => {
                e.preventDefault(); setErr('');
                if (!f.question.trim() || !f.name.trim() || !f.phone.trim()) return setErr(T('كمّل البيانات', 'Please fill all fields'));
                setBusy(true);
                const spec = data.specialties.find(s => s.id === f.specId);
                // بيروح للدكاترة المناسبين لوحده (من غير ما المريض يختار دكتور)
                const docs = data.doctors.filter(d => (!f.branchId || (d.branchIds || []).includes(f.branchId)) && (!f.specId || (d.specs || []).includes(f.specId)));
                const payload = { name: f.name.trim().slice(0, 100), phone: f.phone.trim().slice(0, 30), branchId: f.branchId, topic: spec ? spec.name : 'عام', doctorId: '', doctorName: '', targets: docs.slice(0, 30).map(d => d.id), question: f.question.trim().slice(0, 2000), status: 'new', createdAt: new Date().toISOString() };
                try {
                    let code = null;
                    for (let i = 0; i < 5 && !code; i++) { const c = bkCode(), ref = db.collection('consults').doc(c); try { await db.runTransaction(async tx => { if ((await tx.get(ref)).exists) throw new Error('TAKEN'); tx.set(ref, payload); }); code = c; } catch (x) { if (x.message !== 'TAKEN') throw x; } }
                    if (!code) throw new Error('TAKEN');
                    neTrack('consult'); onDone({ code, ...payload });
                } catch (x) { console.error(x); setErr(T('حصل خطأ، اتأكد من النت وجرب تاني', 'Something went wrong, check your connection')); }
                setBusy(false);
            };
            const chip = (on, label, onClick, key) => <button key={key} type="button" onClick={onClick} className={`px-3.5 py-2 rounded-xl text-xs font-black border-2 ${on ? 'bg-pharaonic text-white border-pharaonic' : 'bg-white text-gray-700 border-gray-200'}`}>{label}</button>;
            let n = 1;
            return (
                <form onSubmit={submit} className="space-y-6">
                    <p className="text-sm font-bold text-gray-500 leading-relaxed">{L('consultIntro')}</p>
                    {data.specialties.length > 0 && <div><BkStep n={n++}>{T('الموضوع', 'Topic')}</BkStep><div className="flex flex-wrap gap-2">{chip(!f.specId, T('عام / مش متأكد', 'General / not sure'), () => set({ specId: '' }), 'g')}{data.specialties.map(s => chip(f.specId === s.id, (lang === 'en' && s.nameEn) || s.name, () => set({ specId: s.id }), s.id))}</div></div>}
                    {branches.length > 1 && <div><BkStep n={n++}>{T('الفرع الأقرب ليك (اختياري)', 'Nearest branch (optional)')}</BkStep><div className="flex flex-wrap gap-2">{chip(!f.branchId, T('أي فرع', 'Any'), () => set({ branchId: '' }), 'a')}{branches.map(b => chip(f.branchId === b.id, b.name, () => set({ branchId: b.id }), b.id))}</div></div>}
                    <div className="space-y-3"><BkStep n={n++}>{T('سؤالك', 'Your question')}</BkStep>
                        <textarea rows="5" maxLength={2000} value={f.question} onChange={e => set({ question: e.target.value })} placeholder={T('اشرح المشكلة: فين بالظبط، من إمتى، فيه ألم ولا لأ...', 'Describe the issue: where, since when, any pain...')} className={bkInp} />
                        <input maxLength={100} value={f.name} onChange={e => set({ name: e.target.value })} placeholder={T('الاسم', 'Name')} className={bkInp} />
                        <input type="tel" maxLength={30} value={f.phone} onChange={e => set({ phone: e.target.value })} placeholder={T('رقم الموبايل (واتساب)', 'Mobile (WhatsApp)')} dir="ltr" className={bkInp + ' text-left'} />
                        <button disabled={busy} className="w-full bg-pharaonic text-white font-black py-4 rounded-2xl shadow-lg text-lg hover:bg-[#B5952F] disabled:opacity-60">{busy ? '...' : L('consultSubmit')}</button>
                    </div>
                    {err && <p className="text-sm font-black text-red-600 bg-red-50 rounded-xl p-3 text-center">{err}</p>}
                </form>
            );
        };

        const BkTrack = ({ lang, branches, initialCode, onEdit }) => {
            const T = (ar, en) => lang === 'en' ? en : ar;
            const [code, setCode] = useState(initialCode || '');
            const [res, setRes] = useState(null);
            const [busy, setBusy] = useState(false);
            const [err, setErr] = useState('');
            const fmt = v => { if (!v) return ''; const [h, m] = v.split(':').map(Number); return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h >= 12 ? T('م', 'PM') : T('ص', 'AM')); };
            const look = async (e, c0) => {
                e && e.preventDefault(); setErr(''); setRes(null);
                const c = (c0 || code).toUpperCase().trim();
                if (!/^[A-Z0-9]{3,12}$/.test(c)) return setErr(T('الكود غلط', 'Invalid code'));
                setBusy(true);
                try {
                    const bk = await db.collection('online_bookings').doc(c).get();
                    if (bk.exists) { const ap = await db.collection('appointments').doc(bk.data().appointmentId).get(); if (ap.exists) setRes({ type: 'booking', id: ap.id, ...ap.data() }); else setErr(T('مفيش حجز بالكود ده', 'No booking with this code')); }
                    else { const cs = await db.collection('consults').doc(c).get(); if (cs.exists) setRes({ type: 'consult', id: cs.id, ...cs.data() }); else setErr(T('مفيش حجز ولا استشارة بالكود ده', 'Nothing found with this code')); }
                } catch (x) { console.error(x); setErr(T('حصل خطأ في البحث', 'Search error')); }
                setBusy(false);
            };
            useEffect(() => { if (initialCode) look(null, initialCode); }, []);
            const cancel = async () => {
                if (!confirm(T('إلغاء الموعد نهائياً؟', 'Cancel this appointment?'))) return;
                setBusy(true);
                try {
                    const aRef = db.collection('appointments').doc(res.id), pbRef = res.pbTok && res.phoneKey ? db.collection('phone_book').doc(res.phoneKey) : null;
                    await db.runTransaction(async tx => {
                        const sn = pbRef ? await tx.get(pbRef) : null;
                        tx.update(aRef, { status: 'canceled', canceledAt: new Date().toISOString(), canceledBy: 'patient' });
                        // الحجز الملغي مبيتحسبش من حد الحجوزات
                        if (sn && sn.exists) tx.set(pbRef, bkPb((sn.data().list || []).filter(x => x && x.t !== res.pbTok && x.d >= bkDay())));
                    });
                    setRes({ ...res, status: 'canceled' }); }
                catch (x) { console.error(x); setErr(T('حصل خطأ في الإلغاء', 'Cancel failed')); }
                setBusy(false);
            };
            const b = res && branches.find(x => x.id === res.branchId);
            return (
                <div className="space-y-5">
                    <form onSubmit={look} className="flex gap-2"><input value={code} onChange={e => setCode(e.target.value)} placeholder={T('اكتب الكود', 'Enter your code')} dir="ltr" className={bkInp + ' text-center font-mono tracking-widest uppercase'} /><button disabled={busy} className="bg-gray-900 text-white px-6 rounded-xl font-black shrink-0">{busy ? '...' : T('بحث', 'Search')}</button></form>
                    {err && <p className="text-sm font-bold text-red-500 text-center">{err}</p>}
                    {res && res.type === 'booking' && <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-1.5 animate-fade-in">
                        <p className="font-black text-gray-900 text-lg">{res.patientName}</p>
                        <p className="text-sm font-bold text-gray-700">📅 {res.date} • {fmt(res.time)}{b ? T(' • فرع ', ' • ') + b.name : ''}</p>
                        {res.service && <p className="text-sm font-bold text-gray-500">{res.service}</p>}
                        {res.estimate && <p className="text-sm font-black text-[#B5952F]">{T('التكلفة المتوقعة: ', 'Expected cost: ')}{res.estimate}</p>}
                        {res.status === 'canceled' ? <p className="text-sm font-black text-red-600">{T('الحجز ده ملغي.', 'This booking is canceled.')}</p>
                            : <div className="flex gap-2 pt-2"><button type="button" onClick={() => onEdit(res)} className="flex-1 bg-pharaonic text-white py-3 rounded-xl font-black">{T('تعديل الموعد', 'Change')}</button><button type="button" disabled={busy} onClick={cancel} className="px-5 bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-black">{T('إلغاء', 'Cancel')}</button></div>}
                    </div>}
                    {res && res.type === 'consult' && <div className="space-y-3 animate-fade-in">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100"><p className="text-[11px] font-black text-gray-400 mb-1">{T('سؤالك', 'Your question')}{res.topic ? ' • ' + res.topic : ''}</p><p className="text-sm font-bold text-gray-800 whitespace-pre-line">{res.question}</p></div>
                        {(res.replies || []).length ? res.replies.map((r, i) => <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-[11px] font-black text-emerald-700 mb-1">{T('رد الدكتور', 'Doctor\'s reply')}</p><p className="text-sm font-bold text-gray-800 whitespace-pre-line">{r.text}</p></div>)
                            : <p className="text-sm font-bold text-amber-700 bg-amber-50 rounded-2xl p-4 text-center">{T('لسه مفيش رد — الدكتور هيرد عليك قريب. ارجع شوف بنفس الكود.', 'No reply yet — check back soon with the same code.')}</p>}
                    </div>}
                </div>
            );
        };

        const BkDone = ({ d, lang, L, onBack }) => {
            const T = (ar, en) => lang === 'en' ? en : ar;
            const consult = d.type === 'consult', code = consult ? d.code : d.bookingCode;
            const fmt = v => { if (!v) return ''; const [h, m] = v.split(':').map(Number); return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h >= 12 ? T('م', 'PM') : T('ص', 'AM')); };
            return (
                <div className="text-center space-y-5 animate-fade-in">
                    <div className="text-5xl">✅</div>
                    <h2 className="text-2xl font-black text-gray-800">{consult ? L('consultDone') : d.edited ? T('اتعدل الحجز!', 'Booking updated!') : L('success')}</h2>
                    {!consult && <div className="bg-gray-50 rounded-2xl p-5 text-start space-y-1.5 border border-gray-100">
                        <p className="font-black text-gray-900">{d.patientName}</p>
                        <p className="text-sm font-bold text-gray-700">📅 {d.date} • {fmt(d.time)}{d.branch ? T(' • فرع ', ' • ') + brName(d.branch, lang) : ''}</p>
                        {d.service && <p className="text-sm font-bold text-gray-500">{d.service}</p>}
                        {d.estimate && <p className="text-sm font-black text-[#B5952F]">{T('التكلفة المتوقعة: ', 'Expected cost: ')}{d.estimate}</p>}
                        {d.branch && d.branch.address && <p className="text-xs font-bold text-gray-500">📍 {d.branch.address}</p>}
                    </div>}
                    <p className="text-sm font-bold text-gray-500">{consult ? T('الدكتور هيرد عليك في أقرب وقت. تابع الرد من تبويب "متابعة بالكود".', 'A doctor will reply soon. Check it from "Track by code".') : L('successNote')}</p>
                    <div className="bg-pharaonic/10 border-2 border-dashed border-pharaonic rounded-2xl p-5">
                        <p className="text-xs font-black text-[#B5952F] mb-1">{consult ? T('كود الاستشارة', 'Consultation code') : T('كود الحجز', 'Booking code')}</p>
                        <p className="text-3xl font-black font-mono tracking-[0.25em] text-gray-900" dir="ltr">{code}</p>
                    </div>
                    <button type="button" onClick={onBack} className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-black">{T('رجوع', 'Back')}</button>
                </div>
            );
        };

        // ترتيب الفروع وإظهارها في كارت الحجز
        const BkBranchesAdmin = ({ bk, setBk, card }) => {
            const [br, setBr] = useState([]);
            useEffect(() => db ? db.collection('branches').onSnapshot(s => setBr(s.docs.map(x => ({ id: x.id, ...x.data() }))), () => {}) : undefined, []);
            const ord = bk.branchOrder || [], hid = bk.hiddenBranches || [];
            const list = [...br].sort((a, b) => { const x = ord.indexOf(a.id), y = ord.indexOf(b.id); return (x < 0 ? 999 : x) - (y < 0 ? 999 : y) || (a.name || '').localeCompare(b.name || '', 'ar'); });
            const ds = useDragSort((k, a, b) => setBk({ branchOrder: moveIdx(list.map(x => x.id), a, b) }));
            return (
                <div className={card}><p className="font-black text-sm">الفروع في كارت الحجز</p><p className="text-[11px] text-gray-500 font-bold">رتبيها بالسحب من ⋮⋮، واخفي اللي مش عايزاه يظهر للمرضى. بيانات كل فرع (العنوان، المواعيد، الخريطة…) بتتعدل من السيستم ← الإعدادات ← الفروع.</p>
                    {list.map((b, i) => { const off = hid.includes(b.id); return (
                        <div key={b.id} {...ds.item('br', i)} className={`flex items-center gap-2 border border-gray-100 rounded-xl p-2.5 bg-white ${off ? 'opacity-50' : ''}`}>
                            <Grip g={ds.grip('br', i)} />
                            <span className="flex-1 text-sm font-black text-gray-800">{b.name}</span>
                            <button type="button" onClick={() => setBk({ hiddenBranches: off ? hid.filter(x => x !== b.id) : [...hid, b.id] })} className={`text-xs font-black px-3 py-1.5 rounded-lg ${off ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}>{off ? 'مخفي' : 'ظاهر'}</button>
                        </div>); })}
                    {!list.length && <p className="text-xs text-gray-400 font-bold">...</p>}
                </div>
            );
        };

        // الخدمات والأسعار والتخصصات — نفس اللي في السيستم (بتتحفظ على طول)
        const BkServicesAdmin = ({ card, inp }) => {
            const [sv, setSv] = useState([]);
            const [sp, setSp] = useState([]);
            const [edit, setEdit] = useState(null);
            const [spName, setSpName] = useState('');
            useEffect(() => { if (!db) return; const a = db.collection('services').onSnapshot(s => setSv(s.docs.map(x => ({ id: x.id, ...x.data() })).sort((x, y) => (x.order ?? 999) - (y.order ?? 999))), e => console.error(e)); const b = db.collection('specialties').onSnapshot(s => setSp(s.docs.map(x => ({ id: x.id, ...x.data() })).sort((x, y) => (x.order ?? 999) - (y.order ?? 999))), e => console.error(e)); return () => { a(); b(); }; }, []);
            const err = e => alert('مشكلة: ' + e.message);
            const save = e => { e.preventDefault(); const f = e.target; const x = { name: f.n.value.trim(), nameEn: f.ne.value.trim(), specialtyId: f.sp.value, priceFrom: Number(f.pf.value) || 0, priceTo: Number(f.pt.value) || 0, duration: f.du.value.trim(), note: f.no.value.trim(), active: f.ac.checked, order: Number(f.or.value) || 0 }; if (!x.name) return; (edit.id ? db.collection('services').doc(edit.id).set(x, { merge: true }) : db.collection('services').add(x)).then(() => setEdit(null)).catch(err); };
            const price = s => { const a = Number(s.priceFrom) || 0, b = Number(s.priceTo) || 0; if (!a && !b) return 'حسب الحالة'; return (!b || b === a) ? a.toLocaleString('en-US') + ' ج' : a.toLocaleString('en-US') + ' – ' + b.toLocaleString('en-US') + ' ج'; };
            return (
                <div className={card}>
                    <p className="font-black text-sm">الخدمات والأسعار</p>
                    <p className="text-[11px] text-gray-500 font-bold">دي نفس قايمة "الخدمات والأسعار" اللي في السيستم — أي تعديل هنا بيتحفظ على طول ويظهر هناك وفي الحجز. لو القايمة فاضية، الحجز بيعرض خدمات الموقع من غير أسعار.</p>
                    <div className="border border-gray-100 rounded-xl p-3 space-y-2"><p className="text-xs font-black text-gray-600">التخصصات (بتستخدم عشان الحجز يروح للدكتور المناسب)</p>
                        <div className="flex flex-wrap gap-1.5">{sp.map(x => <span key={x.id} className="inline-flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs font-bold">{x.name}<button type="button" onClick={() => { const n = prompt('اسم التخصص', x.name); if (n && n.trim()) db.collection('specialties').doc(x.id).update({ name: n.trim() }).catch(err); }} className="text-gray-400">✏️</button><button type="button" onClick={() => confirm('حذف ' + x.name + '؟') && db.collection('specialties').doc(x.id).delete().catch(err)} className="text-red-400">✕</button></span>)}</div>
                        <div className="flex gap-2"><input value={spName} onChange={e => setSpName(e.target.value)} className={inp} placeholder="تخصص جديد" /><button type="button" onClick={() => { if (!spName.trim()) return; db.collection('specialties').add({ name: spName.trim(), order: sp.length + 1 }).then(() => setSpName('')).catch(err); }} className="bg-gray-900 text-white px-3 rounded-lg text-xs font-black shrink-0">إضافة</button></div></div>
                    {sv.map(s => <div key={s.id} className={`flex items-center gap-2 border border-gray-100 rounded-xl p-2.5 ${s.active === false ? 'opacity-50' : ''}`}>
                        <div className="flex-1 min-w-0"><p className="text-sm font-black text-gray-800 truncate">{s.name}</p><p className="text-[11px] font-bold text-[#B5952F]">{price(s)}{(sp.find(x => x.id === s.specialtyId) || {}).name ? ' • ' + sp.find(x => x.id === s.specialtyId).name : ''}</p></div>
                        <button type="button" onClick={() => setEdit(s)} className="text-xs font-black bg-gray-100 px-2.5 py-1.5 rounded-lg">✏️ تعديل</button>
                        <button type="button" onClick={() => confirm('حذف ' + s.name + '؟') && db.collection('services').doc(s.id).delete().catch(err)} className="text-xs font-black text-red-500 px-1">حذف</button>
                    </div>)}
                    <button type="button" onClick={() => setEdit({ active: true })} className="text-sm font-black text-pharaonic">+ إضافة خدمة</button>
                    {edit && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEdit(null)}>
                        <form onSubmit={save} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md p-5 space-y-2.5">
                            <p className="font-black">{edit.id ? 'تعديل خدمة' : 'خدمة جديدة'}</p>
                            <input name="n" defaultValue={edit.name} required placeholder="اسم الخدمة" className={inp} />
                            <input name="ne" defaultValue={edit.nameEn} dir="ltr" placeholder="Service name (English)" className={inp} />
                            <select name="sp" defaultValue={edit.specialtyId || ''} className={inp}><option value="">— بدون تخصص —</option>{sp.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                            <div className="grid grid-cols-2 gap-2"><input name="pf" type="number" min="0" defaultValue={edit.priceFrom || ''} placeholder="السعر من" className={inp} /><input name="pt" type="number" min="0" defaultValue={edit.priceTo || ''} placeholder="لحد (اختياري)" className={inp} /></div>
                            <div className="grid grid-cols-2 gap-2"><input name="du" defaultValue={edit.duration} placeholder="المدة (اختياري)" className={inp} /><input name="or" type="number" defaultValue={edit.order || ''} placeholder="الترتيب" className={inp} /></div>
                            <input name="no" defaultValue={edit.note} placeholder="ملاحظة للمريض (اختياري)" className={inp} />
                            <label className="flex items-center gap-2 text-xs font-black"><input name="ac" type="checkbox" defaultChecked={edit.active !== false} /> ظاهرة في الحجز</label>
                            <div className="flex gap-2"><button className="flex-1 bg-pharaonic text-white py-2.5 rounded-xl font-black">حفظ</button><button type="button" onClick={() => setEdit(null)} className="px-4 bg-gray-100 rounded-xl font-black">إلغاء</button></div>
                        </form></div>}
                </div>
            );
        };

        // --- Live Counter Component ---
        const LiveCounter = ({ targetNumber, title }) => {
            const [count, setCount] = useState(0);
            const [isVisible, setIsVisible] = useState(false);
            const counterRef = useRef(null);

            useEffect(() => {
                const observer = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) setIsVisible(true);
                }, { threshold: 0.1 });
                if (counterRef.current) observer.observe(counterRef.current);
                return () => observer.disconnect();
            }, []);

            useEffect(() => {
                if (!isVisible) return;
                let animationFrameId;
                let startTime = null;
                const duration = 2500; 
                const pause = 1500;    
                const total = duration + pause;

                const animate = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const elapsed = timestamp - startTime;

                    if (elapsed < duration) {
                        const progress = elapsed / duration;
                        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                        setCount(Math.floor(easeOutQuart * targetNumber));
                    } else if (elapsed < total) {
                        setCount(targetNumber);
                    } else {
                        startTime = timestamp; 
                        setCount(0);
                    }
                    animationFrameId = requestAnimationFrame(animate);
                };
                animationFrameId = requestAnimationFrame(animate);
                return () => cancelAnimationFrame(animationFrameId);
            }, [targetNumber, isVisible]);

            return (
                <div ref={counterRef} className="flex flex-row items-center justify-center gap-4 w-full">
                    <span className="text-3xl md:text-4xl font-black text-pharaonic drop-shadow-lg w-28 text-left" dir="ltr">
                        +{count.toLocaleString('en-US')}
                    </span>
                    <span className="text-base md:text-lg text-white font-bold tracking-wide w-36 text-right">{title}</span>
                </div>
            );
        };

        // --- Vision & Mission Section ---
        const VisionMissionSection = ({ l, isRtl }) => (
            <section className="pt-10 pb-16 bg-[#FDFCFB]">
                <div className="container mx-auto px-4">
                <FadeUp>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
                        <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-xl relative overflow-hidden animate-float-fast" style={{ animationDuration: '5s' }}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-pharaonic/10 rounded-full blur-2xl"></div>
                        <h3 className="text-xl font-black mb-2 flex items-center text-pharaonic">
                            <Icons.Star size={20} className={isRtl?"ml-2":"mr-2"} /> {l.vision}
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed font-bold">{l.visionDesc}</p>
                        </div>
                        
                        <div className="bg-white rounded-2xl p-5 shadow-xl border border-gray-100 relative overflow-hidden animate-float-slow" style={{ animationDuration: '7s' }}>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-pharaonic/10 rounded-full blur-2xl"></div>
                        <h3 className="text-xl font-black mb-2 flex items-center text-gray-900">
                            <Icons.ShieldCheck size={20} className={`text-pharaonic ${isRtl?"ml-2":"mr-2"}`} /> {l.mission}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed font-bold">{l.missionDesc}</p>
                        </div>

                        <div className="bg-pharaonic text-white rounded-2xl p-5 shadow-xl relative overflow-hidden animate-float-fast" style={{ animationDuration: '6s' }}>
                        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <h3 className="text-xl font-black mb-2 flex items-center text-white">
                            <Icons.CheckCircle2 size={20} className={isRtl?"ml-2":"mr-2"} /> {l.whyUs}
                        </h3>
                        <p className="text-white/90 text-sm leading-relaxed font-bold">{l.whyUsDesc}</p>
                        </div>
                    </div>
                </FadeUp>
                </div>
            </section>
        );

        const App = () => {
            const [currentView, setCurrentView] = useState('home');
            const [isMenuOpen, setIsMenuOpen] = useState(false);
            const [lang, setLang] = useState('ar');
            const [isLangOpen, setIsLangOpen] = useState(false);
            const [savedScroll, setScroll] = useState(0);
            const [scrolled, setScrolled] = useState(false);
            // آخر نسخة من بيانات الموقع محفوظة على جهاز الزائر: الصفحة تفتح فوراً بيها، وبعدين تتحدّث من قاعدة البيانات
            const [dbBranches, setDbBranches] = useState(() => lsGet('ne_branches') || []);
            const [cfg, setCfg] = useState(() => { const c = lsGet('ne_site_cfg'); try { return c ? mergeCfg(c) : DEFAULT_CFG; } catch (e) { return DEFAULT_CFG; } });
            const [cfgLoaded, setCfgLoaded] = useState(!db);
            const [isAdmin, setIsAdmin] = useState(location.hash === '#admin');
            // لينك الحجز المباشر: #book أو #consult أو #track=الكود
            const bkRouteOf = () => { const h = location.hash.replace('#', ''); const [k, v] = h.split('='); return ['book', 'consult', 'track'].includes(k) ? { tab: k, code: v || '' } : null; };
            const [bkRoute, setBkRoute] = useState(bkRouteOf);
            useEffect(() => {
                const h = () => { setIsAdmin(location.hash === '#admin'); setBkRoute(bkRouteOf()); };
                window.addEventListener('hashchange', h);
                return () => window.removeEventListener('hashchange', h);
            }, []);
            useEffect(() => {
                if (!db) return;
                return db.collection('settings').doc('site').onSnapshot(
                    (doc) => { if (doc.exists) { setCfg(mergeCfg(doc.data())); lsSet('ne_site_cfg', doc.data()); } setCfgLoaded(true); },
                    () => setCfgLoaded(true));
            }, []);
            
            const sliderRef = useRef(null);
            const reviewSliderRef = useRef(null);

            const l = { ...(t[lang] || t.en), ...((cfg.texts || {})[lang] || {}) };
            BR_EN = cfg.branchesEn || {};
            const SVC = cfg.services.filter(sv => !sv.hidden).map(sv => ({ ...sv, titleAr: sv.title, title: (lang === 'en' && sv.titleEn) || sv.title, desc: (lang === 'en' && sv.descEn) || sv.desc, details: (lang === 'en' && sv.detailsEn) || sv.details || '', icon: BASE_ICONS[sv.id] || <Icons.Sparkles size={26} /> }));
            const show = k => (cfg.show || {})[k] !== false;
            const [annClosed, setAnnClosed] = useState(false);
            const ann = cfg.announce || {}; const annText = (lang === 'en' && ann.en) || ann.ar;
            const showAnn = ann.on && annText && !annClosed;
            // SEO: العنوان والوصف من اللوحة
            const setMeta = (attr, key, val) => { if (!val) return; let m = document.querySelector('meta[' + attr + '="' + key + '"]'); if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); } m.content = val; };
            useEffect(() => {
                const se = cfg.seo || {}, en = lang === 'en';
                const title = (en && se.titleEn) || se.title, desc = (en && se.descEn) || se.desc;
                if (title) document.title = title;
                setMeta('name', 'description', desc);
                // مشاركة اللينك (واتساب/فيسبوك)
                setMeta('property', 'og:title', title); setMeta('property', 'og:description', desc); setMeta('property', 'og:type', 'website');
                setMeta('property', 'og:image', se.ogImage || (cfg.heroImages || []).filter(Boolean)[0]); setMeta('property', 'og:locale', en ? 'en_US' : 'ar_EG');
                setMeta('name', 'twitter:card', 'summary_large_image');
                if (se.gsc) setMeta('name', 'google-site-verification', se.gsc);
                if (se.bing) setMeta('name', 'msvalidate.01', se.bing);
                document.documentElement.lang = en ? 'en' : 'ar';
            }, [cfg.seo, lang, cfg.heroImages]);
            // أدوات القياس (جوجل أناليتكس / تاج مانجر / بيكسل فيسبوك وتيك توك) — من اللوحة ← التسويق و SEO
            useEffect(() => { loadTrackers(cfg.seo || {}); }, [cfg.seo]);
            // بيانات منظمة لجوجل (Schema.org): العيادة + كل فرع + الخدمات + الأسئلة الشائعة
            const [schemaFaqs, setSchemaFaqs] = useState([]);
            useEffect(() => { if (!db) return; try { db.collection('faqs').where('published', '==', true).get().then(s => setSchemaFaqs(s.docs.map(x => x.data()).filter(f => f.q && f.a).slice(0, 30))).catch(() => {}); } catch (e) {} }, []);
            useEffect(() => {
                const url = location.href.split('#')[0], phones = (cfg.phones || []).filter(Boolean);
                const se0 = cfg.seo || {};
                const org = { '@type': ['Dentist', 'MedicalClinic'], '@id': url + '#clinic', name: 'New Era Dental Center — نيو إيرا لطب الأسنان', alternateName: ['نيو إيرا لطب الأسنان', 'New Era Dental Center'], url, logo: se0.logo || SITE_LOGO, image: se0.ogImage || (cfg.heroImages || []).filter(Boolean)[0] || undefined, telephone: phones[0] || undefined, description: se0.desc || undefined, priceRange: se0.priceRange || '$$', foundingDate: se0.founded || undefined, keywords: (se0.keywords || []).filter(Boolean).length ? se0.keywords.filter(Boolean).join(', ') : undefined,
                    sameAs: Object.values(cfg.socials || {}).filter(Boolean), medicalSpecialty: 'Dentistry', availableService: (cfg.services || []).filter(s => !s.hidden).map(s => ({ '@type': 'MedicalProcedure', name: s.title, alternateName: s.titleEn || undefined, description: s.desc || undefined })),
                    department: dbBranches.map(b => ({ '@type': 'Dentist', name: 'New Era Dental Center — فرع ' + b.name, address: b.address ? { '@type': 'PostalAddress', streetAddress: b.address, addressLocality: b.name, addressCountry: 'EG' } : undefined, telephone: b.phone || phones[0] || undefined, hasMap: b.mapsLink || undefined, openingHours: b.hours || undefined, url })) };
                const graph = [org];
                if (schemaFaqs.length) graph.push({ '@type': 'FAQPage', mainEntity: schemaFaqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
                let el = document.getElementById('ld-clinic'); if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'ld-clinic'; document.head.appendChild(el); }
                el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
            }, [cfg, dbBranches, schemaFaqs]);
            const isRtl = lang === 'ar';

            // الفروع من قاعدة البيانات (نفس فروع السيستم). لو حصل خطأ بنعيد المحاولة لوحدنا
            const [brStatus, setBrStatus] = useState(db ? 'loading' : 'error');
            const bookTab = useRef(null);
            const [brTry, setBrTry] = useState(0);
            useEffect(() => {
                if (!db) return;
                let t;
                const unsub = db.collection('branches').onSnapshot((snap) => {
                    const brs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
                    setDbBranches(brs); lsSet('ne_branches', brs);
                    setBrStatus('ok');
                }, (err) => {
                    console.error('branches load failed:', err && err.code, err);
                    setBrStatus(s0 => s0 === 'ok' ? 'ok' : 'error');
                    t = setTimeout(() => setBrTry(n => n + 1), 4000);
                });
                return () => { unsub(); clearTimeout(t); };
            }, [brTry]);

            useEffect(() => {
                const handleScroll = () => { setScrolled(window.scrollY > 30); };
                window.addEventListener('scroll', handleScroll);
                return () => window.removeEventListener('scroll', handleScroll);
            }, []);

            const handleServiceClick = (id) => {
                setScroll(window.scrollY);
                setCurrentView(id);
                window.scrollTo(0, 0);
            };

            const handleBackHome = () => {
                setCurrentView('home');
                setTimeout(() => window.scrollTo({ top: savedScroll, behavior: 'instant' }), 50);
            };

            const scrollSlider = (direction, ref) => {
                if (ref.current) {
                const scrollAmount = isRtl ? (direction === 'left' ? -350 : 350) : (direction === 'left' ? -350 : 350);
                ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            };

            const activeService = SVC.find(s => s.id === currentView);

            if (isAdmin) return cfgLoaded ? <Admin cfg={cfg} /> : <div className="p-10 text-center font-bold">...</div>;
            if (bkRoute) return (
                <div className="min-h-screen bg-[#FDFCFB] pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div className="bg-white border-b border-gray-100 shadow-sm"><div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                        <a href="/" onClick={e => { e.preventDefault(); location.hash = ''; }} className="flex items-center gap-2"><img src="https://i.ibb.co/qLw7Tcqv/logo-Dr-shahenda-original.png" alt="New Era" className="h-10" /><span className="font-black text-gray-900 hidden sm:inline">NEW ERA DENTAL CENTER</span></a>
                        <div className="flex items-center gap-2"><button type="button" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="text-xs font-black bg-gray-100 px-3 py-1.5 rounded-lg">{lang === 'ar' ? 'English' : 'عربي'}</button>
                            <a href="/" onClick={e => { e.preventDefault(); location.hash = ''; }} className="text-xs font-black text-pharaonic">{isRtl ? 'الموقع ←' : '← Website'}</a></div>
                    </div></div>
                    <div className="max-w-7xl mx-auto px-3 pt-6"><BookingWidget key={bkRoute.tab + bkRoute.code + lang} cfg={cfg} lang={lang} branches={dbBranches} tab={bkRoute.tab} initialCode={bkRoute.code} /></div>
                </div>
            );

            return (
                <div>
                {/* Floating Official WhatsApp Button */}
                {show('whatsapp') && cfg.whatsapp && <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noreferrer" 
                    className="fixed bottom-6 left-6 z-50 bg-[#25D366] text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-[0_4px_15px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform whatsapp-bounce flex items-center justify-center border-none">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                </a>}

                {/* Floating Navbar */}
                <div className={`fixed z-50 transition-all duration-300 w-full ${scrolled ? 'top-3 px-3 md:px-4' : 'top-0 px-0'}`}>
                    {showAnn && !scrolled && <div className="bg-pharaonic text-white text-xs md:text-sm font-black py-2 px-10 text-center relative">
                        <a href={ann.link || '#booking-section'} target={ann.link ? '_blank' : undefined} rel="noreferrer" className="hover:underline">{annText}</a>
                        <button onClick={() => setAnnClosed(true)} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100" aria-label="close">✕</button>
                    </div>}
                    <nav className={`${scrolled ? 'rounded-2xl shadow-2xl bg-white/95 backdrop-blur-lg border border-gray-100' : 'bg-white shadow-sm border-b border-gray-100'}`}>
                    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center cursor-pointer" onClick={handleBackHome}>
                        <div className="flex flex-col" style={{ alignItems: 'flex-start' }}>
                            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight" style={{ lineHeight: '0.85', marginBottom: '2px' }}>NEW ERA</div>
                            <span className="text-pharaonic text-[8.5px] md:text-[9.5px] font-black tracking-[0.26em] uppercase" style={{ lineHeight: '1' }}>DENTAL CENTER</span>
                        </div>
                        </div>
                        
                        <div className="hidden md:flex space-x-5 space-x-reverse items-center">
                        <button onClick={handleBackHome} className={`font-bold text-base md:text-lg transition ${currentView === 'home' ? 'text-pharaonic' : 'text-gray-600 hover:text-pharaonic'}`}>{l.home}</button>
                        <button onClick={() => { handleBackHome(); setTimeout(() => document.getElementById('about')?.scrollIntoView(), 100); }} className="text-gray-600 hover:text-pharaonic font-bold text-base md:text-lg transition">{l.about}</button>
                        <button onClick={() => { handleBackHome(); setTimeout(() => document.getElementById('services')?.scrollIntoView(), 100); }} className="text-gray-600 hover:text-pharaonic font-bold text-base md:text-lg transition">{l.services}</button>
                        <button onClick={() => { handleBackHome(); setTimeout(() => document.getElementById('reviews')?.scrollIntoView(), 100); }} className="text-gray-600 hover:text-pharaonic font-bold text-base md:text-lg transition">{l.reviews}</button>
                        
                        <div className="relative">
                            <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center text-gray-600 hover:text-pharaonic font-bold text-base bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <Icons.Globe size={18} className={isRtl?"ml-1":"mr-1"} /> {lang.toUpperCase()}
                            </button>
                            {isLangOpen && (
                            <div className="absolute top-full mt-2 w-32 bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden right-0">
                                {LANGUAGES.map(lng => (
                                <button key={lng.code} onClick={() => {setLang(lng.code); setIsLangOpen(false);}} className="block w-full text-start px-4 py-2 text-base text-gray-700 hover:bg-gray-50 hover:text-pharaonic font-bold transition-colors">
                                    {lng.label}
                                </button>
                                ))}
                            </div>
                            )}
                        </div>

                        <a href="#booking-section" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-pharaonic transition shadow-lg flex items-center text-base">
                            <Icons.Calendar size={18} className={isRtl?"ml-1.5":"mr-1.5"} /> {l.book}
                        </a>
                        </div>

                        <div className="md:hidden flex items-center space-x-3 space-x-reverse">
                        <button onClick={() => {setLang(lang === 'ar' ? 'en' : 'ar')}} className="text-gray-600 font-bold text-xs bg-gray-50 px-2 py-1 rounded border">
                            {lang === 'ar' ? 'EN' : 'AR'}
                        </button>
                        <button className="text-gray-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <Icons.X size={28} /> : <Icons.Menu size={28} />}
                        </button>
                        </div>
                    </div>
                    
                    {isMenuOpen && (
                        <div className="md:hidden bg-white border-t border-gray-100 px-5 py-4 space-y-4 absolute w-full shadow-2xl rounded-b-2xl">
                        <button onClick={() => {handleBackHome(); setIsMenuOpen(false);}} className="block w-full text-start font-bold text-gray-800 text-lg">{l.home}</button>
                        <button onClick={() => {handleBackHome(); setIsMenuOpen(false); setTimeout(() => document.getElementById('about')?.scrollIntoView(), 100);}} className="block w-full text-start font-bold text-gray-800 text-lg">{l.about}</button>
                        <button onClick={() => {handleBackHome(); setIsMenuOpen(false); setTimeout(() => document.getElementById('services')?.scrollIntoView(), 100);}} className="block w-full text-start font-bold text-gray-800 text-lg">{l.services}</button>
                        <button onClick={() => {handleBackHome(); setIsMenuOpen(false); setTimeout(() => document.getElementById('reviews')?.scrollIntoView(), 100);}} className="block w-full text-start font-bold text-gray-800 text-lg">{l.reviews}</button>
                        <a href="#booking-section" onClick={() => setIsMenuOpen(false)} className="w-full bg-pharaonic text-white px-4 py-3 rounded-xl font-bold flex justify-center text-lg">{l.book}</a>
                        </div>
                    )}
                    </nav>
                </div>

                <div className={scrolled ? "mt-24" : "mt-0"}></div>

                {currentView === 'home' ? (
                    <main>
                    {/* Hero Section */}
                    <FadeUp>
                    <section className="relative bg-gray-900 pt-28 pb-16 overflow-hidden">
                        <HeroBG imgs={cfg.heroImages.filter(Boolean)} x={cfg.heroX} y={cfg.heroY} dim={cfg.heroDim} zoom={cfg.heroZoom || 100} />
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-gray-900/60 to-[#FDFCFB]"></div>

                        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
                        <div className="max-w-4xl mx-auto mb-5 animate-float-slow">
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] md:leading-[1.1] mb-2 drop-shadow-2xl">
                            {l.heroTitle}
                            </h1>
                            <p className="text-xl md:text-2xl text-white font-bold max-w-2xl mx-auto drop-shadow-lg">
                            {l.heroSub}
                            </p>
                        </div>

                        <div className="w-full max-w-3xl mx-auto mb-6 animate-float-fast">
                            {show('counters') && <div className="flex flex-col space-y-0 mb-3">
                            {cfg.counters.map((c, i) => <LiveCounter key={i + '-' + c.n} targetNumber={c.n} title={c[lang] || c.ar} />)}
                            </div>}
                            <p className="text-pharaonic font-black text-xl md:text-2xl drop-shadow-xl mt-3">
                            {l.heroSlogan}
                            </p>
                        </div>

                        <div className="mt-1">
                            <a href="#booking-section" className="inline-flex items-center bg-pharaonic text-white px-8 py-3.5 rounded-full font-black text-xl hover:bg-[#B5952F] hover:scale-105 transition-all shadow-[0_0_30px_rgba(212,175,55,0.6)] border-2 border-white/20">
                            {l.startJourney} <Icons.ArrowRight size={24} className={isRtl?"mr-2":"ml-2"} />
                            </a>
                        </div>
                        </div>
                    </section>
                    </FadeUp>
                    <CustomAt cfg={cfg} lang={lang} place="hero" />

                    {(() => { const H = {
                        about: <>
                    {show('about') && <section id="about" className="py-12 bg-[#FDFCFB] relative z-20">
                        <FadeUp>
                        <div className="container mx-auto px-4 text-center max-w-3xl animate-float-slow" style={{ animationDuration: '6s' }}>
                        <span className="text-pharaonic font-black text-sm tracking-widest uppercase mb-2 block">{l.about}</span>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{l.aboutTitle}</h2>
                        <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-bold">
                            {l.aboutDesc}
                        </p>
                        </div>
                        </FadeUp>
                    </section>}

                    <CustomAt cfg={cfg} lang={lang} place="about" />
                        </>,
                        services: <>
                    {show('services') && SVC.length > 0 && <section id="services" className="py-10 bg-white border-y border-gray-100 overflow-hidden">
                        <div className="container mx-auto px-4 relative">
                        <FadeUp>
                        <div className="text-center mb-6">
                            <span className="text-pharaonic font-black text-sm tracking-widest uppercase mb-2 block">{l.services}</span>
                            <div className="w-16 h-1 bg-pharaonic mx-auto rounded-full mb-1"></div>
                        </div>
                        </FadeUp>

                        <FadeUp delay={100}>
                        <div className="relative group max-w-6xl mx-auto">
                            <button onClick={() => scrollSlider(isRtl ? 'right' : 'left', sliderRef)} className={`absolute ${isRtl?'-right-2 md:-right-4':'-left-2 md:-left-4'} top-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-full shadow-[0_5px_20px_rgba(0,0,0,0.15)] text-pharaonic hover:scale-110 hover:bg-pharaonic hover:text-white transition-all`}>
                            {isRtl ? <Icons.ArrowRight size={24}/> : <Icons.ArrowLeft size={24}/>}
                            </button>
                            <button onClick={() => scrollSlider(isRtl ? 'left' : 'right', sliderRef)} className={`absolute ${isRtl?'-left-2 md:-left-4':'-right-2 md:-right-4'} top-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-full shadow-[0_5px_20px_rgba(0,0,0,0.15)] text-pharaonic hover:scale-110 hover:bg-pharaonic hover:text-white transition-all`}>
                            {isRtl ? <Icons.ArrowLeft size={24}/> : <Icons.ArrowRight size={24}/>}
                            </button>

                            <div ref={sliderRef} className="flex overflow-x-auto pb-10 pt-2 hide-scroll-bar snap-x snap-mandatory gap-4 px-6">
                            {SVC.map((service) => (
                                <div 
                                key={service.id} 
                                onClick={() => handleServiceClick(service.id)}
                                className="snap-center shrink-0 w-[204px] bg-[#FDFCFB] rounded-[20px] p-4 border border-gray-100 shadow-xl hover:border-pharaonic hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                                >
                                <div>
                                    <div className="w-full h-24 overflow-hidden rounded-xl mb-3 shadow"><img src={service.image || undefined} alt={service.title} loading="lazy" style={imgFx(service)} className="w-full h-full object-cover" /></div>
                                    <div className="w-10 h-10 bg-pharaonic/10 rounded-lg flex items-center justify-center mb-2 text-pharaonic transition-colors">
                                    {service.icon}
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 mb-1 transition-colors">{service.title}</h3>
                                    <p className="text-gray-500 text-xs font-bold leading-relaxed line-clamp-3 mb-2">{service.desc}</p>
                                </div>
                                <div className="flex items-center text-pharaonic font-black text-xs mt-1 bg-pharaonic/5 p-1.5 rounded-lg justify-center">
                                    {l.readMore} <Icons.ArrowRight size={14} className={isRtl?"mr-1.5":"ml-1.5"} />
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                        </FadeUp>
                        </div>
                    </section>}

                    <CustomAt cfg={cfg} lang={lang} place="services" />
                        </>,
                        vision: <>
                    {show('vision') && <VisionMissionSection l={l} isRtl={isRtl} />}

                    <CustomAt cfg={cfg} lang={lang} place="vision" />
                        </>,
                        gallery: <>
                    {show('gallery') && <GallerySection imgs={(cfg.gallery || []).filter(Boolean)} title={(lang === 'en' && cfg.galleryTitleEn) || cfg.galleryTitle} speed={cfg.gallerySpeed ?? 40} />}

                    <CustomAt cfg={cfg} lang={lang} place="gallery" />
                        </>,
                        reviews: <>
                    {show('reviews') && cfg.reviews.some(r => !r.hidden && r.text) && <section id="reviews" className="py-10 bg-gray-50 border-y border-gray-200 overflow-hidden">
                        <div className="container mx-auto px-4">
                        <FadeUp>
                        <div className="text-center mb-6">
                            <span className="text-pharaonic font-black text-sm tracking-widest uppercase mb-2 block">{l.reviews}</span>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{l.reviewsTitle}</h2>
                            <div className="w-16 h-1 bg-pharaonic mx-auto rounded-full"></div>
                        </div>
                        </FadeUp>

                        <FadeUp delay={100}>
                        <div className="relative max-w-5xl mx-auto group">
                            <button onClick={() => scrollSlider(isRtl ? 'right' : 'left', reviewSliderRef)} className={`absolute ${isRtl?'-right-2 md:-right-6':'-left-2 md:-left-6'} top-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-full shadow-[0_5px_20px_rgba(0,0,0,0.15)] text-pharaonic hover:scale-110 hover:bg-pharaonic hover:text-white transition-all`}>
                            {isRtl ? <Icons.ArrowRight size={24}/> : <Icons.ArrowLeft size={24}/>}
                            </button>
                            <button onClick={() => scrollSlider(isRtl ? 'left' : 'right', reviewSliderRef)} className={`absolute ${isRtl?'-left-2 md:-left-6':'-right-2 md:-right-6'} top-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-full shadow-[0_5px_20px_rgba(0,0,0,0.15)] text-pharaonic hover:scale-110 hover:bg-pharaonic hover:text-white transition-all`}>
                            {isRtl ? <Icons.ArrowLeft size={24}/> : <Icons.ArrowRight size={24}/>}
                            </button>

                            <div ref={reviewSliderRef} className="flex overflow-x-auto pb-10 pt-4 hide-scroll-bar snap-x snap-mandatory gap-5 px-4">
                            {cfg.reviews.filter(r => !r.hidden && r.text).map((review, idx) => { const g = cfg.googleReviews !== false; return (
                                <div key={idx} className="snap-center shrink-0 w-[280px] md:w-[320px] bg-white rounded-xl p-4 shadow-md border border-gray-200 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full text-white font-black flex items-center justify-center text-lg shrink-0" style={{ background: AVATARS[idx % AVATARS.length] }}>{review.name.replace('م. ', '').charAt(0)}</div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-gray-900 text-sm truncate">{(lang === 'en' && review.nameEn) || review.name}</h4>
                                            {g && <p className="text-xs text-gray-500">{lang === 'en' ? 'Google review' : 'مراجعة على Google'}</p>}
                                        </div>
                                        {g && <GoogleG size={22} />}
                                    </div>
                                    <div className="flex" style={{ color: '#FBBC04' }}>{[...Array(5)].map((_, k) => <Icons.Star key={k} size={16} fill={k < (review.stars || 5) ? 'currentColor' : 'none'} />)}</div>
                                    <p className="text-gray-700 text-sm leading-relaxed">{(lang === 'en' && review.textEn) || review.text}</p>
                                </div>); })}
                            </div>
                        </div>
                        </FadeUp>
                        </div>
                    </section>}

                    <CustomAt cfg={cfg} lang={lang} place="reviews" />
                        </>,
                        faq: <>
                    {show('faq') && <FaqSection l={l} lang={lang} />}

                    <CustomAt cfg={cfg} lang={lang} place="faq" />
                        </>,
                        consult: <>
                    {show('consult') && <section className="py-12 bg-white border-y border-gray-100">
                        <FadeUp>
                        <div className="container mx-auto px-4 max-w-4xl grid md:grid-cols-2 gap-6 items-center">
                            <div className="space-y-4 text-center md:text-start">
                                <h2 className="text-3xl md:text-4xl font-black text-gray-900">{l.consultTitle}</h2>
                                <p className="text-gray-600 font-bold leading-relaxed">{l.consultText}</p>
                                <button type="button" onClick={() => { bookTab.current && bookTab.current('consult'); const el = document.getElementById('booking-section'); el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                                    className="inline-flex bg-pharaonic text-white px-8 py-3.5 rounded-full font-black text-lg hover:bg-[#B5952F] transition-all shadow-lg">{l.consultBtn}</button>
                            </div>
                            <div className="flex justify-center">{cfg.consultImg ? <img src={cfg.consultImg} alt="" loading="lazy" className="w-full max-w-sm rounded-[28px] shadow-xl object-cover" /> : <div className="hidden md:flex w-48 h-48 rounded-full bg-pharaonic/10 items-center justify-center text-7xl">💬</div>}</div>
                        </div>
                        </FadeUp>
                    </section>}

                    <CustomAt cfg={cfg} lang={lang} place="consult" />
                        </>,
                        booking: <>
                    {show('booking') && <section className="py-12 bg-[#FDFCFB] relative">
                        <div className="w-full max-w-7xl mx-auto px-3" id="booking-section"><BookingWidget cfg={cfg} lang={lang} branches={dbBranches} tabRef={bookTab} /></div>
                    </section>}
                    <CustomAt cfg={cfg} lang={lang} place="booking" />
                        </>,
                    }; return homeOrder(cfg).map(k => <React.Fragment key={k}>{H[k]}</React.Fragment>); })()}
                    </main>
                ) : (
                    <main className="bg-[#FDFCFB] animate-fade-in pb-16">
                    <FadeUp>
                    <div className="bg-gray-900 text-white pt-24 pb-32 relative overflow-hidden shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800"></div>
                        <div className="container mx-auto px-4 relative z-10 text-center mt-6">
                            <div className="flex justify-center items-center mb-5">
                                <div className="w-16 h-16 bg-pharaonic rounded-2xl flex items-center justify-center mx-4 text-white shadow-2xl">
                                {activeService.icon}
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-white">{activeService.title}</h1>
                            </div>
                            <div className="flex justify-center md:justify-start max-w-4xl mx-auto mt-3">
                                <button onClick={handleBackHome} className="inline-flex items-center text-pharaonic hover:text-white transition font-bold text-base bg-white/10 px-6 py-3 rounded-full backdrop-blur-md border border-white/20">
                                <Icons.ArrowRight size={20} className={isRtl?"ml-2":"mr-2"} /> {l.back}
                                </button>
                            </div>
                        </div>
                    </div>
                    </FadeUp>

                    <div className="container mx-auto px-4 max-w-4xl text-center">
                        <FadeUp delay={100}>
                        <div className="-mt-24 mb-8 relative z-20">
                            <div className="w-full max-w-3xl mx-auto overflow-hidden rounded-[30px] shadow-2xl border-4 border-white bg-white"><img src={activeService.image} alt={activeService.title} style={imgFx(activeService)} className="w-full h-auto max-h-[400px] object-cover" /></div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 mb-10 relative z-20">
                            <p className="text-gray-700 text-lg md:text-xl leading-loose font-bold">
                            "{activeService.desc}"
                            </p>
                            {richBlocks(activeService.details).map(([hd, ps], k) => <div key={k} className="mt-5 text-start">{hd && <h2 className="text-lg md:text-xl font-black text-gray-900 mb-2">{hd}</h2>}{ps.map((x, n) => <p key={n} className="text-gray-600 text-[15px] md:text-base leading-loose font-semibold mb-2">{x}</p>)}</div>)}
                            <a href={'/' + seoSvcSlug(activeService)} className="inline-block mt-3 text-pharaonic font-black text-sm hover:underline">{isRtl ? 'اعرف كل التفاصيل والأسئلة الشائعة ←' : 'Full details & FAQs →'}</a>
                        </div>
                        </FadeUp>
                        
                        {(activeService.gallery || []).filter(Boolean).length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">{activeService.gallery.filter(Boolean).map((u, i) => <img key={i} src={u} loading="lazy" className="w-full h-40 object-cover rounded-2xl shadow-lg hover:scale-[1.03] transition-transform" />)}</div>}
                        <div className="mb-10">
                            {show('vision') && <VisionMissionSection l={l} isRtl={isRtl} />}
                        </div>

                        {show('faq') && <FaqSection l={l} lang={lang} svc={activeService} />}
                        {show('booking') && <div className="w-full max-w-7xl mx-auto px-3" id="booking-section"><BookingWidget key={activeService.id + lang} cfg={cfg} lang={lang} branches={dbBranches} presetService={((cfg.services || []).find(x => x.id === activeService.id) || {}).title || activeService.title} /></div>}
                    </div>
                    </main>
                )}

                {['facebook', 'instagram', 'youtube', 'tiktok'].some(k => cfg.socials[k]) && <FadeUp delay={100}>
                <section className="py-2.5 bg-pharaonic text-white border-t border-pharaonic-dark">
                    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-4">
                        <h3 className="text-sm md:text-base font-black m-0">{l.followUs}</h3>
                        <div className="flex justify-center gap-4">
                        {[['facebook', Icons.Facebook], ['instagram', Icons.Instagram], ['youtube', Icons.Youtube], ['tiktok', Icons.TikTok]].filter(([k]) => cfg.socials[k]).map(([k, Ic]) =>
                            <a key={k} href={cfg.socials[k]} target="_blank" rel="noreferrer" aria-label={k} className="w-9 h-9 bg-white text-pharaonic rounded-full flex items-center justify-center shadow-md hover:scale-110 hover:bg-gray-900 hover:text-white transition-all"><Ic size={16}/></a>)}
                        </div>
                    </div>
                </section>
                </FadeUp>}

                <FadeUp delay={200}>
                <footer className="bg-gray-900 text-white pt-4 pb-2 font-body relative z-20">
                    <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-center md:text-start border-b border-gray-800 pb-3">
                        
                        <div>
                        <div className="flex flex-col items-center md:items-start mb-2">
                            <div className="text-2xl font-black text-white tracking-tight" style={{ lineHeight: '0.85', marginBottom: '2px' }}>NEW ERA</div>
                            <span className="text-pharaonic text-[8px] font-black tracking-[0.26em] uppercase" style={{ lineHeight: '1' }}>DENTAL CENTER</span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed font-bold max-w-xs mx-auto md:mx-0">
                            {l.footerAbout}
                        </p>
                        </div>

                        {/* قسم الفروع بعد التعديل */}
                        <div className="text-start">
                        <h3 className="text-base font-black mb-2 text-white border-b border-pharaonic/50 pb-1 inline-block">{l.branchesT}</h3>
                        <ul className="space-y-1.5">
                            {dbBranches.length === 0 && <li className="text-gray-500 text-xs font-bold">{brStatus === 'loading' ? '...' : ''}</li>}
                            {dbBranches.map(b => {
                                // حل ذكي: لو مفيش لينك للفرع في الداتا، هيعمل لينك بحث على جوجل ماب أوتوماتيك
                                const mapUrl = b.mapLink || b.mapsLink || `https://maps.google.com/maps?q=${encodeURIComponent(b.name + ' نيو إيرا لطب الأسنان')}`;
                                return (
                                <li key={b.id} className="flex flex-col border-b border-gray-800 pb-1.5 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between text-white mb-0.5">
                                        <div className="flex items-center">
                                            <Icons.MapPin size={14} className="text-pharaonic ml-1.5 shrink-0" />
                                            <a href={'/' + seoBranchSlug(b)} className="text-xs md:text-sm font-black text-white hover:text-pharaonic">{brName(b, lang)}</a>
                                        </div>
                                        <a href={mapUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center text-pharaonic hover:text-white transition-all bg-white/5 hover:bg-pharaonic w-6 h-6 rounded-md shrink-0 shadow-sm" title={l.mapLocation}>
                                            <Icons.MapPin size={12} />
                                        </a>
                                    </div>
                                    
                                    {b.address && (
                                        <span className="ms-5 text-gray-400 text-[10px] md:text-xs font-bold leading-relaxed block">
                                            {brAddr(b, lang)}
                                        </span>
                                    )}
                                </li>
                            )})}
                        </ul>
                        </div>

                        <div>
                        <h3 className="text-base font-black mb-2 text-white border-b border-pharaonic/50 pb-1 inline-block">{l.contactT}</h3>
                        <ul className="space-y-1.5 text-sm text-gray-200">
                            {(cfg.phones || []).filter(Boolean).map((ph, i) => (
                            <li key={i} className="flex items-center justify-center md:justify-start font-sans font-black tracking-widest" dir="ltr">
                            <Icons.Phone size={16} className="text-pharaonic mr-1.5 shrink-0" />
                            {ph}
                            </li>))}
                        </ul>
                        {((lang === 'en' && cfg.hours.en) || cfg.hours.ar) && <p className="text-xs text-gray-300 font-bold mt-2">🕓 {l.hoursT}: {(lang === 'en' && cfg.hours.en) || cfg.hours.ar}</p>}
                        </div>
                    </div>

                    {SVC.length > 0 && <div className="text-center text-[11px] font-bold text-gray-400 mb-2 leading-7">{SVC.map(sv => <a key={sv.id} href={'/' + seoSvcSlug(sv)} className="hover:text-pharaonic inline-block" style={{ margin: "0 6px" }}>{sv.title}</a>)}</div>}
                    <div className="text-center mb-3"><a href="/blog" className="inline-block text-xs font-black text-pharaonic hover:underline">{lang === 'en' ? '📝 New Era Blog — dental tips' : '📝 مدونة نيو إيرا — نصايح ومعلومات عن الأسنان'}</a></div>
                    <div className="flex flex-col items-center justify-center text-gray-400 text-[10px] md:text-xs font-bold">
                        <p>© 2026 New Era Dental Center. All rights reserved. <span className="opacity-40">v{SITE_VERSION}</span></p>
                        <p className="mt-0.5">{lang === 'en' ? <>Made with <span className="text-pharaonic text-sm">♥</span> for your smile</> : <>صُنع بكل <span className="text-pharaonic text-sm">♥</span> لابتسامتك</>}</p>
                    </div>
                    </div>
                </footer>
                </FadeUp>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<ErrorBoundary><App /></ErrorBoundary>);
    
