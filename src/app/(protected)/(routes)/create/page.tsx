import { postEntry } from "@/actions";
import PostComposer from "@/app/components/PostComposer";
export default function CreatePage() {
  return <main className="mx-auto w-full max-w-xl py-6"><h1 className="mb-6 text-2xl font-bold">Create a post</h1><PostComposer action={postEntry}/></main>;
}
