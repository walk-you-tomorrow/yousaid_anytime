import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import LandingPage from './components/LandingPage';

function App() {
  const [userName, setUserName] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<{ [userName: string]: string[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedDataParam = params.get('sharedData');

    if (sharedDataParam) {
      setSharedData(JSON.parse(decodeURIComponent(sharedDataParam)));
    } else {
      const storedUserName = localStorage.getItem('userName');
      if (storedUserName) {
        setUserName(storedUserName);
      }
    }
  }, []);

  const handleUserNameSubmit = (name: string) => {
    setUserName(name);
    localStorage.setItem('userName', name);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {userName ? (
        <Calendar userName={userName} sharedData={sharedData} />
      ) : (
        <LandingPage onSubmit={handleUserNameSubmit} />
      )}
    </div>
  );
}

export default App;