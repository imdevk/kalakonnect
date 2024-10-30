import React from 'react';

const About = () => {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-primary-darkest text-primary-off-white py-4 md:py-8 lg:py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-6 md:mb-8 lg:mb-12">
                    <h1 className="text-3xl md:text-3xl font-bold mb-4 md:mb-6 lg:mb-8 tracking-tight">
                        कला Konnect: A Safe Space for Indian Creativity
                    </h1>
                    <p className="text-lg text-primary-light leading-relaxed mb-6 md:mb-8 lg:mb-12">
                        Art is a form of expression, and every artist should have the freedom to decide how their work is used and shared.
                        Unfortunately, many platforms fall short in protecting creators. At कला Konnect, we're changing that by putting
                        Indian artists at the heart of everything we do.
                    </p>
                </div>

                <div className="mb-6 md:mb-8 lg:mb-12">
                    <h2 className="text-2xl md:text-2xl font-bold mb-4 md:mb-6 lg:mb-8 text-center">
                        Our Vision
                    </h2>
                    <div className="space-y-4 md:space-y-6">
                        <div className="bg-primary-darker p-4 md:p-6 lg:p-8 rounded-lg shadow-lg">
                            <p className="text-lg leading-relaxed">
                                To build a platform that protects Indian digital artists, ensuring their work isn't misused or exploited
                                by AI models or unauthorized third parties.
                            </p>
                        </div>
                        <div className="bg-primary-darker p-4 md:p-6 lg:p-8 rounded-lg shadow-lg">
                            <p className="text-lg leading-relaxed">
                                To foster a thriving community where artists can connect with employers, fans, and opportunities to
                                monetize their talents.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-lg text-primary-light leading-relaxed">
                        कला Konnect is built on respect—for you, for your art, and for your creative journey. We're proud to offer
                        this platform free for all artists, with a monetization model that focuses on those who enjoy and consume your work.
                    </p>
                </div>

                {/* Optional decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-5">
                    <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary-light blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-primary-light blur-3xl"></div>
                </div>
            </div>
        </div>
    );
};

export default About;