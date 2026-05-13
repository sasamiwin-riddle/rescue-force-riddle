import HomeClient from './HomeClient';
import { Metadata } from 'next';

export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}): Promise<Metadata> {
  const params = await searchParams;
  const isClear = params.clear === 'true';
  const ogImage = isClear ? "/assets/clear.png" : "/assets/top.png";

  return {
    title: "Like Alphabet",
    description: "WEB型謎解きゲーム",
    openGraph: {
      title: "Like Alphabet",
      description: "WEB型謎解きゲーム",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Like Alphabet",
      description: "WEB型謎解きゲーム",
      images: [ogImage],
    },
  };
}

export default function Page() {
  return <HomeClient />;
}
