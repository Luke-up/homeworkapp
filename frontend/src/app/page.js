'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import SiteFooter from '@/components/SiteFooter/SiteFooter';
import { runTimedLiveDemoFromBrowser } from '@/utils/runTimedLiveDemoFromBrowser';
import '../styles/global.scss';
import '../styles/homepage.scss';

const ReCAPTCHA = dynamic(() => import('react-google-recaptcha'), { ssr: false });

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

const FAQ_ITEMS = [
  {
    id: 'what',
    title: 'What is this?',
    body: (
      <>
        <p>
          Granadilla is a proof-of-concept platform for schools, teachers, and students. Schools manage
          classes and people; teachers see their classes and review submitted work; students complete homework,
          build a personal lexicon, and track progress.
        </p>
      </>
    ),
  },
  {
    id: 'how',
    title: 'How do I use this?',
    body: (
      <>
        <p>
          Create a school account (or log in if your school already invited you). School admins set up
          classes, teachers, and students. Teachers and students each have their own dashboard after login.
          Try the 20-minute live demo to explore the app.
        </p>
      </>
    ),
  },
  {
    id: 'free',
    title: 'Is it free?',
    body: (
      <p>
        This build is a learning and demonstration project. It is not production-ready.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Get in touch',
    body: (
      <>
        <p>
          Questions, ideas, or bugs? Contact me at <a href="mailto:painelukeb@gmail.com" target="_blank" rel="noopener noreferrer">painelukeb@gmail.com</a>
        </p>
      </>
    ),
  },
];

const HomePage = () => {
  const router = useRouter();
  const [openFaqId, setOpenFaqId] = useState(null);
  const [demoError, setDemoError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef(null);

  useEffect(() => {
    const accessToken = sessionStorage.getItem('access_token');
    if (accessToken) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/auth-status/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      .then(res => res.json())
      .then((data) => {
        const userType = data.userType;
        if (userType === 'school') {
          router.push('/school');
        } else if (userType === 'teacher') {
          router.push('/teacher');
        } else if (userType === 'student') {
          router.push('/student');
        }
      })
      .catch((error) => {
        console.error('Error checking authentication status:', error);
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
      });
    } 
  }, [router]);

  const handleLiveDemo = async () => {
    setDemoError('');
    if (recaptchaSiteKey && !recaptchaToken) {
      setDemoError('Complete the captcha below to start the demo.');
      return;
    }
    const wins = [
      typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null,
      typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null,
      typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null,
    ];
    setDemoLoading(true);
    try {
      const result = await runTimedLiveDemoFromBrowser({
        recaptchaToken,
        blankWindows: wins,
      });
      if (!result.ok) {
        setDemoError(result.error);
        recaptchaRef.current?.reset();
        setRecaptchaToken('');
      }
    } catch (err) {
      console.error(err);
      wins.forEach((w) => w && w.close());
      setDemoError('Network error — is the API running?');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <>
  <div className="homefold">
    <div className="homewelcome">

      <h1>Granadilla</h1>
  
      <p>Granadilla is a platform for teachers to create and share educational content with their students.</p>

      <div className="cta-row">
        <a href="/signup" className="button">Sign Up</a>
        <a href="/login" className="button button-outline">Login</a>
      </div>

      <p className="italics">Granadilla is a proof of concept and is not yet ready for production use.</p>

      {demoError ? (
        <p className="home-live-demo-error" role="status">
          {demoError}
        </p>
      ) : null}

      {recaptchaSiteKey ? (
        <div className="home-live-demo-recaptcha">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={recaptchaSiteKey}
            onChange={(token) => setRecaptchaToken(token || '')}
          />
        </div>
      ) : null}

      <p className="home-live-demo-wrap">
        <button type="button" className="home-live-demo-link" onClick={handleLiveDemo} disabled={demoLoading}>
          {demoLoading ? 'Starting demo…' : 'Try the 20-minute live demo'}
        </button>
      </p>
      <p className="home-live-demo-hint">
        Opens school, teacher, and student in three tabs with sample data. The sandbox is removed after about twenty
        minutes.
      </p>

    </div>
  </div>

  <section className="home-faq" aria-labelledby="home-faq-heading">
    <div className="home-faq-inner">
      <h2 id="home-faq-heading">Information</h2>
      <div className="accordion">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openFaqId === item.id;
          const panelId = `faq-panel-${item.id}`;
          return (
            <div className={`accordion-item${isOpen ? ' is-open' : ''}`} key={item.id}>
              <button
                type="button"
                className="accordion-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                id={`faq-trigger-${item.id}`}
                onClick={() => setOpenFaqId(isOpen ? null : item.id)}
              >
                <span>{item.title}</span>
                <span className="accordion-icon" aria-hidden>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              <div
                className="accordion-panel"
                id={panelId}
                role="region"
                aria-labelledby={`faq-trigger-${item.id}`}
                hidden={!isOpen}
              >
                <div className="accordion-panel-inner">{item.body}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>

  <SiteFooter />
  </>
)
};

export default HomePage;
