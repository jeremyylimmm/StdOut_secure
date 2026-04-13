import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config/api";

const AppStateContext = createContext(null);

const defaultSettings = {
  interviewName: "Frontend Interview",
  company: "Google",
  difficulty: "Easy",
  durationMinutes: 15,
};

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem("theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function AppStateProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [theme, setTheme] = useState(getInitialTheme);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSessionId, setLastSessionId] = useState(null);

  // Check for stored auth token on load
  useEffect(() => {
    const token = window.localStorage.getItem("authToken");
    const userId = window.localStorage.getItem("userId");
    const username = window.localStorage.getItem("username");

    if (token && userId && username) {
      setUser({
        id: userId,
        name: username,
        email: `${username.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const login = (username, userId) => {
    const name = username?.trim() || "Candidate";
    setUser({
      id: userId || "mock-user-1",
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    });
  };

  const logout = () => {
    setUser(null);
    setQuestionIndex(0);
    setSettings(defaultSettings);
    // Clear stored auth data
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
  };

  const saveSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const startInterview = async () => {
    setQuestionIndex(0);
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/questions/random?company=${settings.company}`;
      if (settings.company === "LeetCode") {
        url += `&difficulty=${settings.difficulty}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const question = await response.json();
        setQuestions([question]);
      } else {
        console.error("Failed to fetch question");
        setQuestions([]);
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    setQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const resetInterview = () => {
    setQuestionIndex(0);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const saveInterview = async (
    transcript,
    code,
    timeLeftSeconds,
    testResults,
    review,
  ) => {
    if (!user?.id) {
      console.error("User not logged in");
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/interviews/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            interview: {
              title: settings.interviewName,
              company: settings.company,
              difficulty: settings.difficulty,
              durationMinutes: settings.durationMinutes,
              questionId: questions[questionIndex]?.id,
            },
            transcript,
            review,
            code,
            timeLeftSeconds,
            testResults,
          }),
        },
      );

      if (!response.ok) {
        console.error("Failed to save interview");
        return null;
      }

      const data = await response.json();
      setLastSessionId(data.sessionId);
      return data.sessionId;
    } catch (error) {
      console.error("Error saving interview:", error);
      return null;
    }
  };

  const value = useMemo(
    () => ({
      user,
      theme,
      settings,
      questions,
      questionIndex,
      currentQuestion: questions[questionIndex] || null,
      loading,
      lastSessionId,
      login,
      logout,
      toggleTheme,
      saveSettings,
      startInterview,
      nextQuestion,
      resetInterview,
      saveInterview,
    }),
    [user, theme, settings, questionIndex, questions, loading, lastSessionId],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}
