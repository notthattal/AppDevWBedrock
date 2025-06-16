import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import Chatbot from './components/Chatbot';
import CustomLogin from './components/CustomLogin';
import awsConfig from './aws-config';
import './App.css';

Amplify.configure(awsConfig);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="App">
      {user ? (
        <Chatbot user={user} signOut={handleSignOut} />
      ) : (
        <CustomLogin onSignIn={setUser} />
      )}
    </div>
  );
}

export default App;