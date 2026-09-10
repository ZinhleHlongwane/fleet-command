// Keeps track of whether an operator is logged in, and exposes
// login/register/logout functions to the rest of the app via useAuth().

import { createContext, useContext, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [operator, setOperator] = useState(() => {
    const saved = localStorage.getItem("fleet_operator");
    return saved ? JSON.parse(saved) : null;
  });

  function persist(operator, token) {
    localStorage.setItem("fleet_token", token);
    localStorage.setItem("fleet_operator", JSON.stringify(operator));
    setOperator(operator);
  }

  async function login(email, password) {
    const data = await api.login({ email, password });
    persist(data.operator, data.token);
  }

  async function register(name, email, password) {
    const data = await api.register({ name, email, password });
    persist(data.operator, data.token);
  }

  function logout() {
    localStorage.removeItem("fleet_token");
    localStorage.removeItem("fleet_operator");
    setOperator(null);
  }

  return (
    <AuthContext.Provider value={{ operator, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
