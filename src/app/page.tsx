import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="text-6xl">🐶</span>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Pawfect Quiz
      </h1>
      <p className="max-w-md text-balance text-muted-foreground">
        재미있는 퀴즈로 내 라이프스타일에 딱 맞는 강아지를 찾아보세요.
        나와 어울리는 견종 Top 3를 알려드려요!
      </p>
      <Button size="lg" nativeButton={false} render={<Link href="/quiz" />}>
        퀴즈 시작하기
      </Button>
    </main>
  );
}
