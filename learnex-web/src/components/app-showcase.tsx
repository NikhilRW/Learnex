import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Swiper components and modules
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import {
  EffectCoverflow,
  Pagination,
  Navigation,
  Autoplay,
} from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export function AppShowcase() {
  // Array of screenshots with descriptions
  const swiperRef = useRef<SwiperRef>(null);

  const autoPlayIntialize = () => {
    if (swiperRef.current) {
      swiperRef.current.swiper.autoplay.start();
    }
  };

  const screenshots = [
    {
      image: '/post.png',
      title: 'Social Feed',
      description:
        'Connect with peers and share knowledge through our distraction-minimized social feed',
      gradient: 'from-blue-600/30 to-blue-400/10',
    },
    {
      image: '/app.png',
      title: 'User Profile',
      description:
        'Customize your profile and control your privacy settings for different content types',
      gradient: 'from-purple-600/30 to-purple-400/10',
    },
    {
      image: '/message.png',
      title: 'Group Chats',
      description:
        'Collaborate in topic-specific groups with real-time messaging and file sharing',
      gradient: 'from-green-600/30 to-teal-400/10',
    },
    {
      image: '/room.png',
      title: 'Virtual Meetings',
      description:
        'Host or join video calls with screen sharing for interactive study sessions',
      gradient: 'from-amber-600/30 to-amber-400/10',
    },
    {
      image: '/event.png',
      title: 'Event Discovery',
      description:
        'Explore events, hackathons and competitions in your region and participate directly',
      gradient: 'from-red-600/30 to-rose-400/10',
    },
    {
      image: '/lex-ai-2.png',
      title: 'Lex AI Assistant',
      description:
        'Get instant help with your studies using our intelligent AI assistant for personalized learning support',
      gradient: 'from-indigo-600/30 to-indigo-400/10',
    },
  ];

  return (
    <section
      className="py-16 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden"
      id="screenshots">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/3 h-[35rem] w-[35rem] rounded-full bg-gradient-to-br from-primary/10 to-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[25rem] w-[25rem] rounded-full bg-gradient-to-tr from-accent/10 to-purple-500/5 blur-[100px]" />

        {/* Floating elements - smaller and fewer */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-8 h-8 rounded-xl rotate-12 bg-primary/10 backdrop-blur-sm border border-primary/20"
          animate={{
            y: [0, 15, 0],
            rotate: [12, 20, 12],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="max-w-screen-xl mx-auto relative z-10">
        {/* Section header - more compact */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full mb-2 font-medium text-xs"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}>
            APP SHOWCASE
          </motion.div>
          <motion.h2
            className="text-2xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}>
            Discover the Learnex Experience
          </motion.h2>
          <motion.p
            className="text-foreground/70 max-w-2xl mx-auto text-base"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}>
            See how Learnex helps students connect, collaborate, and learn
            together
          </motion.p>
        </div>

        {/* Phone frame wrapper */}
        <motion.div
          className="relative max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}>
          {/* Android phone frame */}
          <div className="relative mx-auto">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={false}
              loop={true}
              slidesPerView={'auto'}
              coverflowEffect={{
                rotate: 10,
                stretch: 0,
                depth: 180,
                modifier: 2,
                slideShadows: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
                bulletActiveClass: 'swiper-pagination-bullet-active',
                renderBullet: function (index, className) {
                  return '<span class="' + className + '"></span>';
                },
              }}
              navigation={true}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
              className="app-showcase-swiper max-w-3xl"
              ref={swiperRef}
              onLoad={autoPlayIntialize}>
              {screenshots.map((screenshot, index) => (
                <SwiperSlide key={index}>
                  <div className="relative rounded-[38px] overflow-hidden border-[6px] border-secondary/90 shadow-2xl bg-black max-w-[220px] mx-auto">
                    {/* Modern status bar with dynamic island */}
                    <div className="absolute top-0 z-10 w-full h-6 bg-black flex items-center justify-between px-3">
                      <div className="text-white text-[8px] font-medium">
                        9:41
                      </div>
                      {/* Dynamic island style notch */}
                      <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-14 h-4 bg-black rounded-b-xl" />
                      <div className="flex space-x-1.5">
                        <div className="flex space-x-0.5">
                          <div className="h-1.5 w-1.5 rounded-sm bg-white/90" />
                          <div className="h-1.5 w-1.5 rounded-sm bg-white/90" />
                          <div className="h-1.5 w-1.5 rounded-sm bg-white/90" />
                          <div className="h-1.5 w-1.5 rounded-sm bg-white/90" />
                        </div>
                        <div className="w-2 h-1.5 bg-white/90 rounded-sm" />
                        <div className="flex items-center">
                          <div className="w-2.5 h-1.5 bg-white/90 rounded-[1px]" />
                        </div>
                      </div>
                    </div>

                    {/* Screenshot with glass effect overlay */}
                    <div className="relative aspect-[9/19.5] pt-6 pb-12">
                      <div className="absolute inset-x-0 top-6 bottom-12 mx-1 bg-gradient-to-br from-gray-800/10 to-gray-900/20 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="relative w-[95%] h-[98%]">
                            <Image
                              src={screenshot.image}
                              alt={screenshot.title}
                              fill
                              className="object-contain object-center"
                              sizes="220px"
                              priority={index < 2}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Subtle reflective glass effect */}
                      <div className="absolute inset-x-0 top-6 bottom-12 mx-1 bg-gradient-to-b from-white/10 to-transparent opacity-20 pointer-events-none rounded-2xl" />

                      {/* Gesture navigation bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-black flex items-center justify-center">
                        <div className="w-[100px] h-[5px] bg-white/70 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="text-center mt-4 max-w-xs mx-auto">
                    <h3 className="text-lg font-bold mb-1 text-foreground">
                      {screenshot.title}
                    </h3>
                    <p className="text-foreground/70 text-sm px-4">
                      {screenshot.description}
                    </p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </motion.div>

        {/* Features list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          {[
            {
              title: 'Intuitive Design',
              description:
                "Clean, modern interface that's easy to navigate and reduces cognitive load.",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                </svg>
              ),
              gradient: 'from-blue-500/20 to-blue-500/5',
            },
            {
              title: 'Privacy Controls',
              description:
                'Granular privacy settings giving you control over what you share.',
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="m8 2 4 4" />
                  <path d="m12 2-4 4" />
                  <path d="M18 6H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" />
                  <path d="M15 11v.01" />
                  <path d="M15 14v.01" />
                  <path d="M15 17v.01" />
                  <path d="M9 11h3" />
                  <path d="M9 14h3" />
                  <path d="M9 17h3" />
                </svg>
              ),
              gradient: 'from-purple-500/20 to-purple-500/5',
            },
            {
              title: 'Resource Sharing',
              description:
                'Easily share study materials to enhance collaborative learning.',
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <path d="M14 2v6h6" />
                  <circle cx="11.5" cy="14.5" r="2.5" />
                  <path d="M13.25 16.25 15 18" />
                </svg>
              ),
              gradient: 'from-green-500/20 to-green-500/5',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-border rounded-lg p-5 shadow hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}>
              <div className="p-3 rounded-full w-10 h-10 bg-primary/10 flex items-center justify-center text-primary mb-3">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-foreground/70 text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA button */}
        <div className="text-center mt-10">
          <motion.a
            href="#download"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-primary/20 transition-all hover:scale-105"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}>
            Download Now
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </motion.a>
        </div>
      </div>

      {/* Custom styles for Swiper */}
      <style jsx global>{`
        .app-showcase-swiper {
          padding: 40px 0;
        }
        .app-showcase-swiper .swiper-slide {
          width: 220px;
          transition: all 0.4s ease;
          max-height: 550px;
          opacity: 0.6;
        }
        .app-showcase-swiper .swiper-slide-active {
          transform: scale(1.08);
          opacity: 1;
        }
        .app-showcase-swiper .swiper-pagination {
          position: relative;
          margin-top: 70px;
        }
        .app-showcase-swiper .swiper-pagination-bullet {
          background-color: var(--primary-color, #2379c2);
          opacity: 0.5;
          width: 8px;
          height: 8px;
          margin: 0 5px;
        }
        .app-showcase-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          width: 10px;
          height: 10px;
          background-color: var(--primary-color, #2379c2);
          transform: translateX(-50px);
        }
        .app-showcase-swiper .swiper-button-next,
        .app-showcase-swiper .swiper-button-prev {
          color: var(--primary-color, #2379c2);
          transform: scale(0.7);
          opacity: 0.8;
          transition: all 0.3s ease;
          transform: translateX(30px);
          font-weight: 900;
          font-size: 50px;
        }

        .app-showcase-swiper .swiper-button-next {
          transform: translateX(-30px);
        }

        .app-showcase-swiper .swiper-button-next :after,
        .app-showcase-swiper .swiper-button-prev :after {
          font-size: 50px !important;
        }

        .app-showcase-swiper .swiper-button-next:hover {
          opacity: 1;
          transform: scale(0.75);
          transform: translateX(-30px);
          font-weight: 900;
          font-size: 50px;
        }
        .app-showcase-swiper .swiper-button-prev:hover {
          opacity: 1;
          transform: scale(0.75);
          transform: translateX(30px);
          font-weight: 900;
          font-size: 50px;
        }
        @media (max-width: 640px) {
          .app-showcase-swiper .swiper-button-next,
          .app-showcase-swiper .swiper-button-prev {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
