import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, api, Profile } from "@/lib/api";
import {
  clearSession,
  getStoredProfile,
  getStoredToken,
  storeSession,
  storeToken,
} from "@/lib/sessionStore";

type AuthContextValue = {
  isReady: boolean;
  isSignedIn: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signInWithGoogleToken: (idToken: string) => Promise<void>;
  signInWithMobileToken: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const signOut = useCallback(async () => {
    await clearSession();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const nextProfile = await api.getProfile();
    setProfile(nextProfile);
  }, []);

  const signInWithGoogleToken = useCallback(async (idToken: string) => {
    const session = await api.loginWithGoogle(idToken);
    await storeSession(session.token, session.profile);
    setProfile(session.profile);
  }, []);

  const signInWithMobileToken = useCallback(async (token: string) => {
    await storeToken(token);
    const nextProfile = await api.getProfile();
    await storeSession(token, nextProfile);
    setProfile(nextProfile);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const [storedToken, storedProfile] = await Promise.all([
        getStoredToken(),
        getStoredProfile(),
      ]);

      if (!storedToken) {
        return;
      }

      if (storedProfile && isMounted) {
        setProfile(storedProfile);
      }

      try {
        const freshProfile = await api.getProfile();

        if (isMounted) {
          setProfile(freshProfile);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearSession();

          if (isMounted) {
            setProfile(null);
          }
        } else {
          console.error(error);
        }
      }
    }

    bootstrap()
      .catch(console.error)
      .finally(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      isSignedIn: !!profile,
      profile,
      refreshProfile,
      signInWithGoogleToken,
      signInWithMobileToken,
      signOut,
    }),
    [
      isReady,
      profile,
      refreshProfile,
      signInWithGoogleToken,
      signInWithMobileToken,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}
