import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();
  return (
    <>
      <div className="bg-red-400">
        test
        <br className="bg-blackS" />
      </div>
      {session && (
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button
            className="border px-4 py-3 m-8 rounded-xl bg-(--ig-orange) text-black"
            type="submit"
          >
            Signout
          </button>
        </form>
      )}
      {!session && (
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button
            className="border px-4 py-3 m-8 rounded-xl bg-(--ig-orange) text-black"
            type="submit"
          >
            Signin with Google
          </button>
        </form>
      )}
      <br />
      <br />
    </>
  );
}
