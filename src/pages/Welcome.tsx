import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, Heart, Lock, Sparkles, Star } from 'lucide-react';

export default function Welcome() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-romantic-dark overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className={`absolute top-1/4 left-1/4 w-64 h-64 bg-romantic-primary/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        />
        <div 
          className={`absolute bottom-1/3 right-1/3 w-96 h-96 bg-romantic-secondary/10 rounded-full blur-3xl transition-all duration-1000 delay-300 ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        />
        {/* Decorative stars */}
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`absolute w-4 h-4 text-romantic-primary/30 animate-twinkle`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Animated Logo and Title */}
          <div className={`space-y-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 animate-pulse-slow group-hover:animate-none">
                  <Book className="w-16 h-16 text-romantic-primary/50 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <Book className="w-16 h-16 text-romantic-primary relative z-10 transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-romantic-light animate-float">
              Secreto
            </h1>
            <p className="text-lg text-romantic-muted animate-fade-in">
              Your personal space for thoughts and memories
            </p>
          </div>

          {/* Animated Features */}
          <div className="py-8 grid gap-6">
            {[
              {
                icon: Lock,
                title: "Private & Secure",
                description: "Your thoughts stay yours, always encrypted and secure",
                delay: "100",
              },
              {
                icon: Heart,
                title: "Express Yourself",
                description: "Share your feelings with photos and mood emojis",
                delay: "200",
              },
              {
                icon: Sparkles,
                title: "Beautiful Experience",
                description: "Elegant design that makes journaling a joy",
                delay: "300",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group flex items-center space-x-4 bg-romantic-card/50 p-4 rounded-lg backdrop-blur-sm hover:bg-romantic-card/70 transition-all duration-300 transform hover:scale-102 hover:shadow-lg ${
                  mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`}
                style={{ transitionDelay: `${feature.delay}ms` }}
              >
                <feature.icon className="w-8 h-8 text-romantic-primary flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                <div className="text-left">
                  <h3 className="font-medium text-romantic-light group-hover:text-white transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-romantic-muted group-hover:text-romantic-light/90 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Animated CTA Buttons */}
          <div className={`space-y-4 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link
              to="/register"
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-romantic-primary hover:bg-romantic-accent transition-all duration-300 hover:scale-105 hover:shadow-lg group"
            >
              <span className="relative">
                Get Started
                <span className="absolute inset-0 bg-white/20 rounded-lg transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200"/>
              </span>
            </Link>
            <Link
              to="/login"
              className="w-full flex items-center justify-center px-4 py-3 border border-romantic-secondary/30 text-base font-medium rounded-lg text-romantic-light hover:bg-romantic-card/50 transition-all duration-300 hover:shadow-lg relative overflow-hidden group"
            >
              <span className="relative z-10">Sign In</span>
              <div className="absolute inset-0 bg-romantic-primary/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"/>
            </Link>
          </div>
        </div>

        {/* Animated Footer */}
        <div className={`mt-8 text-center text-sm text-romantic-muted transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="animate-float">Your safe space for personal reflections</p>
        </div>
      </div>
    </div>
  );
}