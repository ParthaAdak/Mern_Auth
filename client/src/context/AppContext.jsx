import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  axios.defaults.withCredentials = true;

  const getUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/data', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        withCredentials: true
      });

      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Failed to fetch user data';
      toast.error(errMsg);
    }
  };

  const getAuthState = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/auth/is-auth', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (data.success) {
        setIsLoggedin(true);
        await getUserData(); // ✅ await ensures userData loads before UI
      } else {
        setIsLoggedin(false);
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error("Auth check failed:", error.message);
      setIsLoggedin(false);
      localStorage.removeItem('token');
    } finally {
      setLoading(false); // ✅ always end loading
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getAuthState();
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUserData(null);
    setIsLoggedin(false);
    toast.success("Logged out");
  };

  const value = {
    backendUrl,
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserData,
    getUserData,
    logout,
    loading
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};
