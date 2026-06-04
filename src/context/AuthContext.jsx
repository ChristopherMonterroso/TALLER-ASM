import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserData } from '../firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const data = await getUserData(firebaseUser.uid);
        setUserData(data);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUserData = async () => {
    if (user) {
      const data = await getUserData(user.uid);
      setUserData(data);
    }
  };

  const isAdmin = () => userData?.role === 'admin';
  const canWrite = () => userData?.role === 'admin' || (userData?.role === 'employee' && userData?.permissions?.write === true);
  const canRead = () => !!userData?.active;

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, canWrite, canRead, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
