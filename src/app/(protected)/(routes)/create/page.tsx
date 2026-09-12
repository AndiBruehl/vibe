import { postEntry } from "@/actions";
import PostComposer from "@/app/components/PostComposer";
import LocalizedText from "@/app/components/LocalizedText";
export default function CreatePage() {
  return <main className="mx-auto w-full max-w-xl py-6"><h1 className="mb-6 text-2xl font-bold"><LocalizedText en="Create a post" de="Beitrag erstellen" /></h1><PostComposer action={postEntry}/></main>;
}
