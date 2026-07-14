import PawPrint from "@/components/quiz/PawPrint";
import StartQuizButton from "@/components/quiz/StartQuizButton";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-primary">
        <PawPrint size={48} />
      </span>
      <h1 className="font-heading text-4xl tracking-tight text-primary sm:text-5xl">
        Pawfect Quiz
      </h1>
      <p className="max-w-md text-balance text-muted-foreground">
        재미있는 퀴즈로 내 라이프스타일에 딱 맞는 강아지를 찾아보세요.
        나와 어울리는 견종 Top 3를 알려드려요!
      </p>
      <StartQuizButton />
    </main>
  );
}
