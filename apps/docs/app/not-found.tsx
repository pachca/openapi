import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Страница не найдена',
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 ">
      <h1 className="text-4xl font-bold text-text-primary mb-4!">404</h1>
      <p className="text-[15px] text-text-primary mb-0 text-center">
        К сожалению, такой страницы не существует
      </p>
    </div>
  );
}
